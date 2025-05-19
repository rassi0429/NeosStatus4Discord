# NeosStatus4Discord

NeosStatus4Discordは、Neos VRユーザーのオンラインステータスをDiscordサーバー上で管理・表示・ロール付与するBotです。

## 主な機能

- Neosユーザーのオンライン/オフライン状態を取得し、Discord上で表示
- DiscordユーザーとNeosユーザーIDの紐付け
- ステータスに応じたロールの自動付与/削除
- サーバー内ユーザー一覧表示
- 管理者向けのユーザー管理コマンド

## コマンド一覧

- `/status`  
  Neosユーザーの現在のステータスを表示  
  オプション: `userid` または `discord`（どちらか必須）

- `/setrole`  
  ステータスごとに付与するロールを設定（管理者のみ）

- `/setuserid`  
  DiscordユーザーとNeosユーザーIDを紐付け

- `/removeuser`  
  ユーザーの紐付け解除

- `/list`  
  サーバー内の登録ユーザーとステータス一覧を表示

## セットアップ

1. 依存パッケージのインストール

   ```
   npm install
   ```

2. 必要な環境変数を設定（.envファイルなどで）

   ```
   DISCORD_TOKEN=あなたのDiscordBotトークン
   NEOS_HOST=neosのAPIホスト（例: neos.com）
   ```

3. Botの起動

   ```
   npm start
   ```

## データベース

- SQLiteを使用（`./db/db.sqlite3`）

## 注意

- Botをサーバーに追加後、管理者が初期設定を行ってください。
- Neos APIの仕様変更等により動作しなくなる場合があります。
