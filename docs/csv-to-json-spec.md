# CSV→JSON 変換スクリプト仕様

このドキュメントでは、`data/*.csv` を Next.js アプリで利用する JSON に変換するスクリプトの仕様をまとめる。

## ゴール
- 開発者が CLI を 1 回実行するだけで、CSV データを `src/data/<exam-id>.json` として生成する。
- CSV のフォーマットミスや必須項目欠落を検出し、エラーをわかりやすく表示する。
- JSON を再生成した際に整形済み（インデント 2 スペース）になっている。

## 実行方法
- スクリプトファイル: `scripts/convert-csv-to-json.ts`（Node.js + TypeScript）を想定。
- 起動コマンド例:
  ```bash
  pnpm ts-node scripts/convert-csv-to-json.ts --input data/aws-devops-pro.csv --output src/data/aws-devops-pro.json --title "AWS Certified DevOps Engineer - Professional" --version 2025-01
  ```
- 必須引数:
  - `--input <path>`: CSV ファイルのパス。
  - `--output <path>`: 出力する JSON のパス。
  - `--title <string>`: 試験名。
  - `--version <string>`: データのバージョン（例: `2025-01`）。JSON の `meta.lastUpdatedAt` と `version` に利用。
- オプション引数:
  - `--dry-run`: ファイル出力せずに検証のみ行う。
  - `--pretty <number>`: JSON のインデント幅（デフォルト 2）。

## CSV のバリデーション
- 文字コードは UTF-8 を前提（BOM ありなしは自動判別）。
- 必須カラム: `question_id`, `question_text`, `is_multi_answer`, `choice_1_text`, `choice_1_is_correct`, `explanation`.
- 各行に対して以下をチェックする:
  - `question_id` が重複していない。
  - `is_multi_answer` が `TRUE` または `FALSE`。
  - 少なくとも 1 つの選択肢が存在する（`choice_n_text` が埋まっている）。
  - 正解フラグ（`choice_n_is_correct`）が `TRUE` の選択肢が最低 1 つ存在する。
  - `is_multi_answer === "FALSE"` の場合、正解フラグはちょうど 1 つ。
  - `reference_links` が存在する場合、カンマ区切りで `/^https?:\\/\\//` を満たしている。
  - `last_reviewed` が存在する場合、`YYYY-MM-DD` 形式。
- バリデーションエラーは行番号とともに表示し、処理を中断する。

## JSON 出力構造
```jsonc
{
  "examId": "aws-devops-pro",       // output ファイル名から自動推測（例: aws-devops-pro.json -> aws-devops-pro）
  "title": "AWS Certified DevOps Engineer - Professional",
  "version": "2025-01",
  "questions": [
    {
      "id": "DOP-C02-Q001",
      "questionText": "...",
      "isMultiAnswer": false,
      "choices": [
        { "id": "A", "text": "...", "isCorrect": false },
        { "id": "B", "text": "...", "isCorrect": true }
      ],
      "explanation": "...",
      "referenceLinks": ["https://..."],
      "tags": ["タグ1", "タグ2"]
    }
  ],
  "meta": {
    "totalQuestions": 200,
    "lastUpdatedAt": "2025-01-10"
  }
}
```

### 変換ルール
- `examId`: `--output` のファイル名（拡張子除く）を利用。オプション `--exam-id` を追加して手動指定も許容する（省略時は自動算出）。
- `questions[*].choices[*].id`: CSV の出現順に `A`, `B`, `C`, ... を割り振る。
- `referenceLinks`: カンマ区切りを分割し、トリム後に空要素を除外。セミコロン区切りにも対応（古いデータを考慮）。
- `tags`: カンマまたはセミコロン区切りを分割し、トリム。空要素は除去。
- `meta.totalQuestions`: 変換した問題数を自動で設定。
- `meta.lastUpdatedAt`: `--version` に日付が含まれない場合、現在日時（UTC, `YYYY-MM-DD`）を利用。バージョンが `2025-01` のような形式なら `2025-01-01` を採用。

## ログ出力
- 実行開始: `Converting <input> -> <output>`
- 各行の取り込み: `Processed question <question_id>` を verbose モード時のみ表示（`--verbose` オプションで切替）。
- エラー発生時: `ERROR line 12: message` の形式で STDERR に出力。
- 成功時: `✅ Generated src/data/aws-devops-pro.json (200 questions)` のように概要を表示。

## 今後の拡張アイデア
- `data/` 以下の全 CSV を一括変換する `--all` オプション。
- JSON Schema を使った更なる検証。
- 画像列を追加した場合に自動で `public/images/...` コピーハンドリング。
