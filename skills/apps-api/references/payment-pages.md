# 決済ページ（Product / Paid / Installment）

一次情報: https://theapps.jp/api/endpoints  
パスはすべて `/v1/client/...`。

更新時に変更できない項目がある（例: `stripe_env_id`、`platform`）。既存を変える前に GET で現状を取る。

`stripe_env_id`: 作成時必須。`0` = 本番、`1` = テスト（公式ドキュメントの表記に従う）。

---

## Product（1回払い）— `apps_*_product`

必須（作成）: `product_name`, `stripe_env_id`, `price`, **`platform`（決済プラットフォームを1つ以上 true）**

よく使う任意項目:

| key | 説明 |
|-----|------|
| `language` | `ja` / `en` / `pt` |
| `provider_name` / `label` | 提供者名・ラベル |
| `stock` | 在庫。`-1` は無制限 |
| `platform` | PaymentPlatform。**作成時必須**（例: `{ "stripe": true }`）。作成後は変更不可 |
| `waiting_list` | 成立条件付き申込（詳細: [waiting-list.md](waiting-list.md)） |
| `discord_rule` | Discord 自動化 |
| `tax_rate` / `allow_duplicate` / `limit_per_person` | 税率・重複・購入上限 |

作成例の最小 body:

```json
{
  "product_name": "単発講座",
  "stripe_env_id": "1",
  "price": 3000,
  "language": "ja",
  "platform": { "stripe": true }
}
```

---

## Paid（定期払い）— `apps_*_paid_plan`

必須（作成）: `plan_name`, `stripe_env_id`, `price`, `billing_cycle`, **`platform`**

`billing_cycle`（BillingCycle）:

| key | 必須 | 説明 |
|-----|------|------|
| `interval` | 必須 | 課金間隔（公式ドキュメントの値に従う） |
| `count` | 任意 | 間隔の倍数（既定 1） |
| `billing_cycle_anchor` | 任意 | 課金基準日。`-1` は指定なし |
| `immediate_payment` | 任意 | 即時決済 |
| `trial_end` | 任意 | トライアル終了（Unix 時間） |

作成例の最小 body:

```json
{
  "plan_name": "月額メンバーシップ",
  "stripe_env_id": "1",
  "price": 1980,
  "language": "ja",
  "platform": { "stripe": true },
  "billing_cycle": {
    "interval": "month",
    "count": 1
  }
}
```

`interval` の許容値は公式ドキュメントを優先。不明なら既存プランを `apps_get_paid_plan` で見て揃える。

---

## InstallmentPaid（毎月払い・回数制限）— `apps_*_installment_plan`

必須（作成）: `plan_name`, `stripe_env_id`, `price`, `billing_cycle`, **`platform`**

`billing_cycle`（InstallmentBillingCycle）:

| key | 必須 | 説明 |
|-----|------|------|
| `interval` | 必須 | 課金間隔 |
| `installments_count` | 必須 | **2 以上** |
| `manual_payments` | 任意 | 手動決済 |
| `sales_count` | 任意 | 販売上限。`-1` は無制限 |

パス上の ID パラメータ名は `paid_id`（ツール引数も `paid_id`）。

`waiting_list` を送る場合は `type` 必須。`type=2`（自動承認）なら `interval` も必須。詳細: [waiting-list.md](waiting-list.md)。

更新時: `price` と `billing_cycle` は変更できない（API が 400）。名前など変更可能な項目だけ送る。

作成例の最小 body:

```json
{
  "plan_name": "3回払い講座",
  "stripe_env_id": "1",
  "price": 30000,
  "language": "ja",
  "platform": { "stripe": true },
  "billing_cycle": {
    "interval": "month",
    "installments_count": 3
  }
}
```

---

## PaymentPlatform（任意・作成後変更不可）

| key | 用途の目安 |
|-----|------------|
| `stripe` / `univapay` | カード |
| `stripe_bank` / `univapay_bank` | 銀行振込（定期など） |
| `stripe_billing` | Stripe Billing（定期） |
| `paypal` | PayPal（1回払い） |

---

## ネストオブジェクト（必要になったら公式を確認）

`discord_rule`, `agreement_terms`, `mail_*`, `bank_invoice`, `auto_retry`, `auto_cancel`, `initial_cost`, `card_attribute`, `company_info`, `meta_conversion_api` など。  
詳細表は https://theapps.jp/api/endpoints を正とする。
