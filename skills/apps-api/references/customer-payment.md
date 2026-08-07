# 顧客・決済照会

## ツール

| 用途 | ツール | Path |
|------|--------|------|
| 顧客 | `apps_get_customer` | `GET /v1/customer/{customer_id}` |
| 1回払い決済一覧 | `apps_list_charges` | `GET /v1/charge` |
| 1回払い決済 | `apps_get_charge` | `GET /v1/charge/{payment_id}` |
| 定期払い決済一覧 | `apps_list_paid_payments` | `GET /v1/paid` |
| 定期払い決済 | `apps_get_paid_payment` | `GET /v1/paid/{payment_id}` |
| 分割払い決済一覧 | `apps_list_installments_payments` | `GET /v1/installments` |
| 分割払い決済 | `apps_get_installments_payment` | `GET /v1/installments/{payment_id}` |
| Webhook 署名検証 | `apps_verify_webhook_signature` | （ローカル検証・API 呼び出しなし） |

一覧レスポンスには個人情報が含まれ得る。件数や要約だけ返し、生データはログ・コミットに残さない。

## 一覧レスポンス（概形）

```json
{
  "items": [ { "payment_id": "...", "customer": {}, "payment": {}, "plan": {} } ],
  "has_more": false,
  "mode": "live",
  "error": []
}
```

任意クエリ: `limit`（件数上限）。`has_more=true` でも、次ページ用の公式カーソル／offset はドキュメント未記載のため推測で送らない。

## payment_id の扱い（重要）

- Webhook「決済成功」（`event=payment`）に含まれる `payment_id` を使う
- Webhook 共通の `id` / `Apps-Webhook-Id` は重複判定用で、`payment_id` ではない
- 管理画面の取引明細などに出る数字 ID では動かない場合がある
- ユーザーが「管理画面の ID」だけ渡してきたら、Webhook 由来か確認する
- ID が無いときは、まず対応する一覧ツールで候補を探し、必要なら単件取得する

## プラン API との違い

| 欲しいもの | 使う系 |
|------------|--------|
| 「この決済は成功したか」などの取引照会 | `/v1/charge` `/v1/paid` `/v1/installments` |
| 「決済ページのプラン設定」 | `/v1/client/product` `/v1/client/paid` `/v1/client/installments` |

定期払いの **決済照会** は `apps_get_paid_payment` / `apps_list_paid_payments`、**プラン管理** は `apps_get_paid_plan` / `apps_list_paid_plans`。名前が似ているので混同しない。

## できないこと

- 顧客一覧検索 API は公開範囲では未提供
- 決済実行・返金・解約の REST は未提供
- ID も一覧も無い状態から「全顧客を出して」はできない
