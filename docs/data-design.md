# データ設計書

## データフロー概要
1. 運用者が資格ごとに CSV ファイルを更新する（1資格=1ファイル）。
2. 変換スクリプト（CLI）で CSV を読み込み、Next.js から利用できる JSON ファイルを生成する。
3. 生成された JSON を `app` もしくは `data` ディレクトリで静的に読み込み、ビルド時にバンドルする。
4. 学習進捗はブラウザの `localStorage` に保存し、クライアントコンポーネントで読み書きする。

## CSV スキーマ（案）
- ファイル名: `aws-devops-pro.csv`（資格IDを命名規則として使用）
- カラム構成

| 列名 | 型 | 説明 |
|------|----|------|
| `question_id` | 文字列 | 資格内でユニークなID（例: `DOP-C02-Q001`） |
| `question_text` | 文字列 | 問題文。改行を含む場合はセル内改行で管理。 |
| `is_multi_answer` | 真偽値 | 複数選択が必要な場合は `TRUE`。 |
| `choice_1_text` | 文字列 | 選択肢テキスト。`choice_6_text` まで最大6択を想定。 |
| `choice_1_is_correct` | 真偽値 | 正解なら `TRUE`。複数正解時は複数列で `TRUE`。 |
| `...` |  | `choice_6_*` まで繰り返し。不要な列は空欄のまま。 |
| `explanation` | 文字列 | 問題全体の解説。 |
| `reference_links` | 文字列 | カンマ区切りの参考URL。 |
| `tags` | 文字列 | カンマ区切りのタグ（例: `deployment,blue-green`）。MVPでは未使用。 |
| `last_reviewed` | 日付 | 任意。データメンテナンス用。 |

> **備考**: 選択肢数が6を超える場合は列を追加するか、将来的に別シート（choicesテーブル）へ分離する。

## JSON スキーマ（想定）
- 出力パス例: `src/data/aws-devops-pro.json`
- 構造例

```json
{
  "examId": "aws-devops-pro",
  "title": "AWS Certified DevOps Engineer - Professional",
  "version": "2024-05",
  "questions": [
    {
      "id": "DOP-C02-Q001",
      "questionText": "問題文...",
      "isMultiAnswer": true,
      "choices": [
        { "id": "A", "text": "選択肢A", "isCorrect": false },
        { "id": "B", "text": "選択肢B", "isCorrect": true }
      ],
      "explanation": "解説テキスト",
      "referenceLinks": ["https://docs.aws.amazon.com/..."],
      "tags": ["deployment", "blue-green"]
    }
  ],
  "meta": {
    "totalQuestions": 200,
    "lastUpdatedAt": "2024-05-10"
  }
}
```

- TypeScript インターフェース例

```ts
export type Choice = {
  id: string;            // A, B, C...
  text: string;
  isCorrect: boolean;
};

export type Question = {
  id: string;
  questionText: string;
  isMultiAnswer: boolean;
  choices: Choice[];
  explanation: string;
  referenceLinks: string[];
  tags: string[];
};

export type ExamData = {
  examId: string;
  title: string;
  version: string;
  questions: Question[];
  meta: {
    totalQuestions: number;
    lastUpdatedAt: string;
  };
};
```

## 進捗データ（ローカルストレージ）
- 保存キー案: `mycert-progress-{examId}`
- データ構造

```ts
type SessionQuestionProgress = {
  lastResult: "correct" | "incorrect";
  answeredAt: string;      // ISO8601
  attempts: number;
  correctAttempts: number;
};

type SessionProgress = {
  sessionNumber: number;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  lastPage: number;
  questions: Record<string, SessionQuestionProgress>;
};

type CumulativeQuestionProgress = {
  lastResult: "correct" | "incorrect" | "unanswered";
  lastAnsweredAt?: string;
  totalAttempts: number;
  totalCorrect: number;
  isFlaggedForReview: boolean;
};

type ExamProgress = {
  examId: string;
  version: string;
  updatedAt: string;
  nextSessionNumber: number;         // 次に開始するセッション番号
  currentSession?: SessionProgress;  // 進行中セッション
  sessionHistory: SessionProgress[]; // 完了済みセッション（最新が先頭）
  cumulative: Record<string, CumulativeQuestionProgress>;
};
```

- 振る舞い
  - 「第 n 回目の学習を開始」で `currentSession` を初期化し、`sessionNumber` は `nextSessionNumber` を割り当てる。開始時点で `lastPage = 1` を設定。
  - 回答確定時に `currentSession.questions[questionId]` と `cumulative[questionId]` を同時に更新する。解説表示後は UI 側で選択状態をクリアするが、セッション内の `attempts` は増える。
  - 復習フラグ操作は `cumulative[questionId].isFlaggedForReview` を更新する（セッションを跨いで維持）。
  - ページ遷移のたびに `currentSession.lastPage` を更新し、途中から「再開」した際に該当ページへ遷移できるようにする。
  - セッション終了時は `currentSession.completedAt` を設定し、`sessionHistory` の先頭に追加、`currentSession` を未定義化、`nextSessionNumber` をインクリメント。
  - 「履歴リセット」で ExamProgress を初期化。
  - バージョンが変わった場合は互換性チェックを行い、必要なら自動リセット。

## 派生データ・計算ロジック
- 現在セッションの正答率 = `sum(correctAttempts) / sum(attempts)` （`currentSession` が存在する場合）。
- 累積正答率 = `totalCorrect / totalAttempts`。
- 復習対象数 = `cumulative` のうち `isFlaggedForReview === true` をカウント。
- 未回答数（累積） = `totalQuestions -` `cumulative` で `lastResult !== "unanswered"` の件数。
- ページング時の配列スライス: `questions.slice(pageIndex * 20, (pageIndex + 1) * 20)`

## ファイル・ディレクトリ構成（想定）
```
MyCertification/
├── docs/
│   └── ... (本ドキュメント)
├── scripts/
│   └── convert-csv-to-json.ts     # 変換スクリプト（今後作成）
├── src/
│   ├── data/
│   │   └── aws-devops-pro.json    # 生成物
│   └── app/
│       └── ...                    # Next.js アプリ
└── data/                          # 元データ配置用（リポジトリ内で管理）
    └── aws-devops-pro.csv
```

## 今後の検討事項
- CSV 以外のデータ投入手段（Google Sheets API など）への対応。
- 画像・図表を扱う場合のファイル命名規則とストレージ方法。
- 進捗データのバックアップ・同期（例: JSON ダウンロード / GitHub Gist 連携）。
- 複数資格対応時の JSON 分割とロード戦略（動的インポート、Lazy Load など）。
