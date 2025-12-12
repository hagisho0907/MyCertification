# MyCertification
自分の資格試験の過去問を管理するWebアプリ

# 概要
いくつかの資格試験を選択→資格試験の過去問の解答と解説を表示
参考サイト（https://www.examtopics.com/）

# 技術要素
Nextjs
Tailwindcss
Vercel（デプロイ）

# 決定した仕様メモ
- 対応資格：AWS Certified DevOps Engineer - Professional の過去問を対象とする。
- 利用者：自己学習用途のためログイン機能は当面不要。
- 表示フロー：クイズ形式で問題→回答→解説の順に表示する。

# データ管理の初期方針
- 管理者が用意した Excel ファイルを元データとし、アプリで扱いやすい JSON などに変換して保持する。
- Excel には `question_id / question_text / choices[] / correct_choice / explanation / tags` のようなカラムを用意しておき、変換スクリプトで Next.js から読み込める形にする想定。
- 初期段階ではリポジトリ内で変換後の JSON を静的読み込みすることで対応し、必要に応じて将来的に DB 化を検討する。

## 学習進捗の同期（Supabase）
- `/api/progress` は Supabase の `exam_progress` テーブルを使って学習状態（JSON）を保存・取得します（従来の GitHub Gist 同期を置き換え）。
- 必須環境変数（サーバーのみで使用）: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- 推奨テーブル定義（service role でアクセスする想定のためポリシー追加は不要）:
  ```sql
  create table if not exists exam_progress (
    exam_id text primary key,
    payload jsonb not null,
    updated_at timestamptz not null default now()
  );
  alter table exam_progress enable row level security;
  ```
- クライアント側は `/api/progress` を呼ぶだけでローカル保存＋リモート同期（デバウンス付き）が実行されます。
