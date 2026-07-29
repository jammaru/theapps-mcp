# 安全に使う

## 本番のみ

Sandbox はありません。検証でも実データに影響し得ます。

## 資格情報

- `APPS_APP_ID` / `APPS_APP_SECRET` をリポジトリ・チャット・Issue に貼らない
- ツールはシークレットをエコーしない

## 書き込みガード

1. デフォルト `APPS_MCP_ALLOW_WRITE` は無効（読み取り専用）
2. 有効化後も `confirm: true` が必須
3. 先に `dry_run: true` でリクエスト内容を確認
4. DELETE は破壊的（`destructiveHint`）

## payment_id

管理画面の数字IDでは動かない場合があります。Webhook「決済成功」の `payment_id` を使います。
