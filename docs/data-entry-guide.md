# データ入力ガイド（CSV）

AWS DevOps Pro 問題データを記入する CSV ファイル（`data/aws-devops-pro.csv`）の各列の意味と入力ルールをまとめています。必要に応じて他資格でも同じカラム構成の CSV を作成してください。

## カラムごとの説明
- `question_id`  
  問題を一意に識別する ID。例: `DOP-C02-Q001`。資格ごとに連番で管理するとわかりやすい。

- `question_text`  
  問題文。段落がある場合はセル内改行（Option + Command + Enter）で調整する。

- `is_multi_answer`  
  正解が複数ある場合は `TRUE`、単一正解なら `FALSE`。英語大文字で統一する。

- `choice_1_text` ～ `choice_6_text`  
  選択肢の本文。必要な数だけ埋め、不要な列は空欄のままで良い。

- `choice_1_is_correct` ～ `choice_6_is_correct`  
  対応する選択肢が正解なら `TRUE`、不正解なら `FALSE`。複数正解の場合は該当列すべて `TRUE` にする。

- `explanation`  
  問題全体の解説。なぜ正解なのか、背景知識、公式ドキュメントの引用などを記載する。

- `reference_links`  
  参考 URL をカンマ区切りで列挙する。例: `https://docs.aws.amazon.com/...,https://aws.amazon.com/whitepapers/...`。必要なければ空欄。

- `tags`  
  今後の検索やフィルタ用タグ。和文・英文どちらでも良い。複数指定する場合はカンマ区切り（例: `ログ集約,クロスアカウント`）。未利用なら空欄のまま。

- `last_reviewed`  
  問題内容を最新化した日付（任意）。ISO 形式 `YYYY-MM-DD` 推奨。管理に不要なら空欄でも構わない。

## 入力のポイント
- 複数選択問題は `is_multi_answer = TRUE` とし、正解の選択肢に対応する `choice_x_is_correct` をすべて `TRUE` にする。
- 選択肢が 6 個を超える場合は列を追加するか、将来的な JSON 構造を拡張することを検討する。
- 日付や真偽値は一貫した表記（`TRUE` / `FALSE`, `YYYY-MM-DD`）にそろえると変換スクリプトが安定する。
- 解説や参考リンクは、のちに Web でそのまま表示される前提で記入する。
- カンマを含むフィールドは自動的にダブルクオートで囲まれるので、通常の入力で問題ない。手動編集時にクオートを削除しないよう注意する。
