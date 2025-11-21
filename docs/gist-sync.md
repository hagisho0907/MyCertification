# 進捗データを GitHub Gist に保存する手順

ブラウザローカルではなく、GitHub の秘密 Gist に進捗 JSON を保存する構成です。無料で利用できます。  
環境変数を設定すると、アプリは `/api/progress` 経由で Gist に読み書きします。

## 事前準備（GitHub 側）
1. GitHub の **Fine-grained Personal Access Token** を発行  
   - 権限: `gist:write` のみでOK（リポジトリ権限は不要）  
   - Name/Expiration は任意（短め推奨）
2. 秘密 Gist を 1 つ作成  
   - https://gist.github.com/ で「Secret gist」を新規作成  
   - ファイル名: `progress.json`（中身は `{ "exams": {} }` など空でOK）  
   - 作成後の URL `https://gist.github.com/<user>/<GIST_ID>` の `<GIST_ID>` を控える

## Vercel 環境変数
Vercel ダッシュボード → Project → Settings → Environment Variables で以下を追加。

| 名前 | 値 | メモ |
| --- | --- | --- |
| `GITHUB_TOKEN` | さきほど発行した PAT | `gist:write` 権限のみ |
| `GITHUB_GIST_ID` | 控えた Gist の ID | GitHub URL の末尾文字列 |

※ Preview / Production の両方に同じ値をセットしてください。

## 動作イメージ
- クライアントで進捗を保存すると、ローカルストレージに加えて `/api/progress` へ送信され、Gist の `progress.json` が更新されます。
- 初回読み込み時は Gist を取得し、より新しい方（Gist / ローカル）を採用。Gist が空ならローカルの内容をアップロードします。
- ネットワーク障害時はローカル保存のみで動作し、復旧後に再同期します。

## 追加でやることが出たとき
- Gist を変更したい場合は、`GITHUB_GIST_ID` を新しいものに差し替えるだけでOKです。
- Token をローテーションする場合は `GITHUB_TOKEN` を更新後、再デプロイしてください。
