# Vercelへのデプロイ方法

## 前提条件
- Vercelアカウントを持っていること（https://vercel.com でサインアップ）
- GitHubアカウントを持っていること

## デプロイ手順

### 1. GitHubリポジトリの準備

まず、現在のコードをGitHubにプッシュします：

```bash
# リポジトリの初期化（既に初期化済みの場合はスキップ）
git init

# すべてのファイルをステージング
git add .

# 初回コミット
git commit -m "Initial commit: MyCertification app"

# GitHubでリポジトリを作成後、リモートリポジトリを追加
git remote add origin https://github.com/YOUR_USERNAME/MyCertification.git

# mainブランチにプッシュ
git push -u origin main
```

### 2. Vercelでのデプロイ

1. https://vercel.com にログイン
2. 「New Project」をクリック
3. GitHubと連携し、MyCertificationリポジトリを選択
4. 以下の設定を確認：
   - Framework Preset: `Next.js`（自動検出されるはず）
   - Build Command: `npm run build`（デフォルト）
   - Output Directory: `.next`（デフォルト）
   - Install Command: `npm install`（デフォルト）

5. 「Deploy」をクリック

### 3. 本番データの準備

現在はサンプルデータを使用していますが、実際のAWS DevOps Professionalのデータを使用する場合：

1. CSVファイルを適切にフォーマット
2. 変換スクリプトを実行：
   ```bash
   npx ts-node scripts/convert-csv-to-json.ts \
     --input data/aws-devops-pro.csv \
     --output app/data/aws-devops-pro.json \
     --title "AWS Certified DevOps Engineer - Professional" \
     --version "2025-01"
   ```

3. `app/page.tsx`と他のコンポーネントでインポートを更新：
   ```typescript
   // 変更前
   import examData from './data/sample.json'
   
   // 変更後
   import examData from './data/aws-devops-pro.json'
   ```

4. 変更をコミットしてプッシュ：
   ```bash
   git add .
   git commit -m "Update with production data"
   git push
   ```

### 4. 環境変数（Supabase 用）

学習進捗の同期先として Supabase を使います。

1. Supabase でプロジェクトを作成し、SQL エディタで以下を実行してテーブルを用意
   ```sql
   create table if not exists exam_progress (
     exam_id text primary key,
     payload jsonb not null,
     updated_at timestamptz not null default now()
   );
   alter table exam_progress enable row level security;
   -- service role でのみ叩く想定なので追加ポリシーは不要
   ```
2. Vercel の「Settings」→「Environment Variables」で以下を設定（ローカルは `.env.local` にも同じ値を配置）
   - `SUPABASE_URL`: Supabase プロジェクトの URL
   - `SUPABASE_SERVICE_ROLE_KEY`: service role key（クライアントには公開しない）

### 5. カスタムドメイン（オプション）

1. Vercelダッシュボードで「Settings」→「Domains」
2. カスタムドメインを追加
3. DNSレコードを設定

## デプロイ後の更新

コードを更新してGitHubにプッシュすると、Vercelが自動的に再デプロイします：

```bash
git add .
git commit -m "Update description"
git push
```

## トラブルシューティング

### ビルドエラーが発生した場合
1. ローカルで `npm run build` が成功することを確認
2. `node_modules` と `.next` をコミットしていないことを確認
3. Vercelのビルドログを確認

### データが表示されない場合
1. JSONファイルが正しくコミットされているか確認
2. インポートパスが正しいか確認
3. ブラウザの開発者ツールでコンソールエラーを確認
