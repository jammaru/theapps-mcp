# パス早見

一次情報: https://theapps.jp/api/endpoints  
Base: `https://api.theapps.jp`（本番のみ）

## 認証

```
POST /v1/identity/oauth2/token
Authorization: Basic base64(APP_ID:APP_SECRET)
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
```

以降の API: `Authorization: Bearer {access_token}`  
Apps-mcp 利用時はトークン取得を MCP が行う。

## 顧客・決済照会

| Method | Path | ツール |
|--------|------|--------|
| GET | `/v1/customer/{customer_id}` | `apps_get_customer` |
| GET | `/v1/charge/{payment_id}` | `apps_get_charge` |
| GET | `/v1/paid/{payment_id}` | `apps_get_paid_payment` |
| GET | `/v1/installments/{payment_id}` | `apps_get_installments_payment` |

`payment_id` は Webhook 決済成功イベント由来。管理画面表示 ID ではない。

## 登録ページ `/v1/advance`

| Method | Path | ツール |
|--------|------|--------|
| GET | `/v1/advance` | `apps_list_advance_plans` |
| GET | `/v1/advance/{plan_id}` | `apps_get_advance_plan` |
| POST | `/v1/advance` | `apps_create_advance_plan` |
| PUT | `/v1/advance/{plan_id}` | `apps_update_advance_plan` |
| DELETE | `/v1/advance/{plan_id}` | `apps_delete_advance_plan` |
| GET | `/v1/advance/{plan_id}/contractor` | `apps_list_advance_plan_contractors` |

## 決済ページ（client 系）

### 1回払い `/v1/client/product`

CRUD + `/{product_id}/purchaser` → `apps_*_product*` / `apps_list_product_purchasers`

### 定期払い `/v1/client/paid`

CRUD + `/{paid_id}/subscriber` → `apps_*_paid_plan*` / `apps_list_paid_plan_subscribers`

### 毎月払い（回数制限） `/v1/client/installments`

CRUD + `/{paid_id}/subscriber` → `apps_*_installment_plan*` / `apps_list_installment_plan_subscribers`

### クーポン `/v1/client/coupon`

CRUD → `apps_*_coupon*`

## Discord

| 操作 | Path 概形 | ツール |
|------|-----------|--------|
| Role | `/v1/discord/guilds/{guild_id}/roles[/{role_id}]` | `apps_*_discord_role` |
| Channel | `/v1/discord/guilds/{guild_id}/channels[/{channel_id}]` | `apps_*_discord_channel` |

## 公開されていないもの（呼ばない）

- 決済実行 / 返金 / 解約の REST
- 顧客一覧検索
- Webhook 設定 CRUD API
- Sandbox
