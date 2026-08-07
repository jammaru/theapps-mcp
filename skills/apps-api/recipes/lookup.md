# 顧客・決済を調べる

## いつ使うか

- 「この顧客の情報を見て」
- 「この決済は成功している？」
- 「最近の決済一覧を見たい」
- Webhook の `payment_id` / `customer_id` が手元にある

## 手順

1. `apps_auth_status`
2. ID の種類を確認する
   - 顧客 → `customer_id` → `apps_get_customer`
   - 1回払い決済 → `payment_id` → `apps_get_charge`（不明なら先に `apps_list_charges`）
   - 定期払い決済 → `payment_id` → `apps_get_paid_payment`（不明なら `apps_list_paid_payments`）
   - 分割払い決済 → `payment_id` → `apps_get_installments_payment`（不明なら `apps_list_installments_payments`）
3. 結果を要約（個人情報の生ログは残さない）

## payment_id が管理画面の数字だけのとき

「Webhook 決済成功の payment_id が必要。管理画面表示 ID では取れない場合がある」と伝え、正しい ID を求める。  
手元に ID が無い場合は一覧ツールで候補を探し、推測で別 API を連続試行しない。

## プラン設定を見たいとき（別物）

決済ページの商品/プラン一覧なら:

- `apps_list_products` / `apps_get_product`
- `apps_list_paid_plans` / `apps_get_paid_plan`
- `apps_list_installment_plans` / `apps_get_installment_plan`

購入者・契約者:

- `apps_list_product_purchasers`
- `apps_list_paid_plan_subscribers`
- `apps_list_installment_plan_subscribers`
- `apps_list_advance_plan_contractors`

詳細: [references/customer-payment.md](../references/customer-payment.md)
