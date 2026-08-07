# Webhook

一次情報:
- 設定: https://theapps.jp/api/webhook
- データ構造: https://theapps.jp/api/webhook-data （公式メニュー参照）

Apps-mcp は Webhook の **受信サーバーではない**。設定 CRUD API も公開されていない。  
エージェントは受信実装の設計・署名検証・重複排除を案内し、設定変更は管理画面操作を案内する。

検証ツール: `apps_verify_webhook_signature`

## イベント（7種）

| event | 説明 | 1回払い | 定期・毎月払い |
|-------|------|---------|----------------|
| `customer` | 顧客新規作成 | ○ | ○ |
| `application` | 申し込み完了 | — | ○ |
| `payment` | 決済成功 | ○ | ○ |
| `refund` | 返金完了 | ○ | ○ |
| `payment_error` | 決済エラー | ○ | ○ |
| `abandoned` | かご落ち | ○ | ○ |
| `canceled` | 解約完了 | — | ○ |

`application` / `canceled` は定期払い・毎月払い（回数制限付き）が対象。

## 受信要件

- HTTP POST、JSON
- **30 秒以内に HTTP 200**
- 失敗時は最大 3 回自動再送
- 管理画面のテスト送信も本番と同じ応答要件・同じ構造（値はダミー）

## 署名（HMAC-SHA256）

Webhook シークレットを管理画面 API 設定で発行すると、通知に署名が付く。

- 形式: `whsec_` + 64 文字 hex
- 未設定時: `Apps-Signature` は付与されない
- 再発行後 24 時間は新旧両方の `v1` が付くことがある

ヘッダー例:

```
Apps-Signature: t=<unix>,v1=<64hex>[,v1=<64hex>]
Apps-Webhook-Id: <body.id と同じ>
```

署名対象文字列:

```text
{t}.{生のリクエストボディ}
```

検証手順の要点:

1. **JSON パース前の生ボディ**で検証（再 stringify 禁止）
2. `|now - t| <= 300` 秒
3. HMAC-SHA256(secret, `{t}.{rawBody}`) を hex 化し、いずれかの `v1` と定数時間比較
4. 失敗時は HTTP 400 を返す想定

Apps-mcp:

```json
{
  "raw_body": "<exact body>",
  "signature_header": "t=...,v1=...",
  "webhook_secret": "whsec_...",
  "webhook_id_header": "<optional Apps-Webhook-Id>"
}
```

`webhook_secret` はチャット・ログ・コミットに残さない。

## 重複判定

再送や手動再送では `t` / `v1` が変わる。  
**`id`（ボディ）または `Apps-Webhook-Id` で冪等処理**する。署名値では判定しない。

## payment_id

決済照会 API の `payment_id` は、`payment`（決済成功）イベント直下の `payment_id`。  
Webhook 共通の `id`（重複判定用）とは別物。

一覧取得:

- `apps_list_charges` → `GET /v1/charge`
- `apps_list_paid_payments` → `GET /v1/paid`
- `apps_list_installments_payments` → `GET /v1/installments`

単件:

- `apps_get_charge` / `apps_get_paid_payment` / `apps_get_installments_payment`
