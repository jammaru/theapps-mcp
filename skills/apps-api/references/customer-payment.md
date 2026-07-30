# 顧客・決済照会

## ツール

| 用途 | ツール | Path |
|------|--------|------|
| 顧客 | `apps_get_customer` | `GET /v1/customer/{customer_id}` |
| 1回払い決済 | `apps_get_charge` | `GET /v1/charge/{payment_id}` |
| 定期払い決済 | `apps_get_paid_payment` | `GET /v1/paid/{payment_id}` |
| 分割払い決済 | `apps_get_installments_payment` | `GET /v1/installments/{payment_id}` |

## payment_id の扱い（重要）

- Webhook「決済成功」イベントに含まれる `payment_id` を使う
- 管理画面の取引明細などに出る数字 ID では動かない場合がある
- ユーザーが「管理画面の ID」だけ渡してきたら、Webhook 由来か確認する

## プラン API との違い

| 欲しいもの | 使う系 |
|------------|--------|
| 「この決済は成功したか」などの取引照会 | `/v1/charge` `/v1/paid` `/v1/installments` |
| 「決済ページのプラン設定」 | `/v1/client/product` `/v1/client/paid` `/v1/client/installments` |

定期払いの **決済照会** は `apps_get_paid_payment`、**プラン管理** は `apps_get_paid_plan`。名前が似ているので混同しない。

## できないこと

- 顧客一覧・決済一覧の検索 API は公開範囲では未提供
- ID が無い状態から「全顧客を出して」はできない。管理画面や Webhook 側の ID が必要
