# Webhook 受信の設計を手伝う

詳細: [references/webhook.md](../references/webhook.md)  
決済 ID: [references/customer-payment.md](../references/customer-payment.md)

## いつ使うか

- 「Webhook の署名を検証したい」
- 「決済成功通知から payment_id を取りたい」
- 「同じ通知が二重に来ないようにしたい」

## 手順

1. 管理画面でエンドポイント URL とイベントを設定（API CRUD はない）
2. 可能なら Webhook シークレットを発行し、受信側で署名検証する
3. 受信は 30 秒以内に HTTP 200。失敗は最大 3 回再送される前提で冪等にする
4. 重複は `Apps-Webhook-Id` / body.`id` で判定（署名値ではない）
5. `event=payment` の `payment_id` を保存し、必要なら `apps_get_charge` 等で照会
6. 署名の手元検証は `apps_verify_webhook_signature`（**生ボディ**・シークレットはログに出さない）

## イベント早見

顧客作成 / 申し込み完了 / 決済成功 / 返金 / 決済エラー / かご落ち / 解約。  
申し込み完了・解約は定期・毎月払い向け。詳細表は references/webhook.md。

## やらないこと

- Webhook 設定を REST で変えようとする
- JSON をパースしてから stringify し直した文字列で署名検証する
- 管理画面の表示 ID を `payment_id` とみなす
- シークレットや生ペイロード（PII）をチャット・コミットに残す
