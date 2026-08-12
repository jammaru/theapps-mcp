---
title: ツール
description: Apps-mcp が提供する MCP ツール一覧。
---

書き込み（create / update / delete）は `APPS_MCP_ALLOW_WRITE=true` かつ `confirm: true` が必要です。

公式エンドポイント: [theapps.jp/api/endpoints](https://theapps.jp/api/endpoints)

## 認証・ヘルプ

| ツール | 内容 |
|--------|------|
| `apps_help` | セットアップ・安全・ツール一覧の案内 |
| `apps_auth_status` | 資格情報の有無（シークレットは返さない） |
| `apps_clear_token_cache` | アクセストークンキャッシュのクリア |

## 顧客・決済照会

| ツール | 内容 |
|--------|------|
| `apps_get_customer` | 顧客情報 |
| `apps_list_charges` | 買い切り決済の一覧 |
| `apps_get_charge` | 買い切り決済 |
| `apps_list_paid_payments` | 定期課金決済の一覧 |
| `apps_get_paid_payment` | 定期課金の決済 |
| `apps_list_installments_payments` | 分割払い決済の一覧 |
| `apps_get_installments_payment` | 分割払いの決済 |
| `apps_verify_webhook_signature` | Webhook 署名（HMAC-SHA256）の検証 |

## 登録ページ（advance）

| ツール | 内容 |
|--------|------|
| `apps_list_advance_plans` | 一覧 |
| `apps_get_advance_plan` | 取得 |
| `apps_create_advance_plan` | 作成 |
| `apps_update_advance_plan` | 更新 |
| `apps_delete_advance_plan` | 削除 |
| `apps_list_advance_plan_contractors` | 契約者一覧 |

## 決済ページ — 買い切り（product）

| ツール | 内容 |
|--------|------|
| `apps_list_products` | 一覧 |
| `apps_get_product` | 取得 |
| `apps_create_product` | 作成 |
| `apps_update_product` | 更新 |
| `apps_delete_product` | 削除 |
| `apps_list_product_purchasers` | 購入者一覧 |

## 決済ページ — 定期（paid）

| ツール | 内容 |
|--------|------|
| `apps_list_paid_plans` | 一覧 |
| `apps_get_paid_plan` | 取得 |
| `apps_create_paid_plan` | 作成 |
| `apps_update_paid_plan` | 更新 |
| `apps_delete_paid_plan` | 削除 |
| `apps_list_paid_plan_subscribers` | 購読者一覧 |

## 決済ページ — 分割（installments）

| ツール | 内容 |
|--------|------|
| `apps_list_installment_plans` | 一覧 |
| `apps_get_installment_plan` | 取得 |
| `apps_create_installment_plan` | 作成 |
| `apps_update_installment_plan` | 更新 |
| `apps_delete_installment_plan` | 削除 |
| `apps_list_installment_plan_subscribers` | 購読者一覧 |

## クーポン

| ツール | 内容 |
|--------|------|
| `apps_list_coupons` | 一覧 |
| `apps_get_coupon` | 取得 |
| `apps_create_coupon` | 作成 |
| `apps_update_coupon` | 更新 |
| `apps_delete_coupon` | 削除 |

## Discord

| ツール | 内容 |
|--------|------|
| `apps_get_discord_role` | ロール取得 |
| `apps_create_discord_role` | ロール作成 |
| `apps_update_discord_role` | ロール更新 |
| `apps_delete_discord_role` | ロール削除 |
| `apps_get_discord_channel` | チャンネル取得 |
| `apps_create_discord_channel` | チャンネル作成 |
| `apps_update_discord_channel` | チャンネル更新 |
| `apps_delete_discord_channel` | チャンネル削除 |

## 注意（実装に基づく）

- 決済ページ API は `/v1/client/...`
- `payment_id` は Webhook 決済成功イベント由来（管理画面の表示 ID や通知の `id` ではない）
- 決済実行・返金・解約 REST は公開範囲では未提供
- WaitingList 未使用時は登録ページで `waiting_list` を送らない
