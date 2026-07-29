# Apps API エンドポイント要約（非公式メモ）

一次情報: https://theapps.jp/api/endpoints

Base: `https://api.theapps.jp`（本番のみ）

## 認証

```
POST /v1/identity/oauth2/token
Authorization: Basic base64(APP_ID:APP_SECRET)
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
```

以降: `Authorization: Bearer {access_token}`

## 顧客・決済照会

| Method | Path |
|--------|------|
| GET | `/v1/customer/{customer_id}` |
| GET | `/v1/charge/{payment_id}` |
| GET | `/v1/paid/{payment_id}` |
| GET | `/v1/installments/{payment_id}` |

`payment_id` は Webhook 決済成功イベント由来。管理画面表示IDではない。

## 登録ページ `/v1/advance`

POST / GET / GET/{plan_id} / PUT/{plan_id} / DELETE/{plan_id} / GET/{plan_id}/contractor

Plan 必須例: `contract_type`, `plan_name`, `language`

## 決済ページ（client 系）

### 1回払い `/v1/client/product`

CRUD + `/{product_id}/purchaser`

### 定期払い `/v1/client/paid`

CRUD + `/{paid_id}/subscriber`

### 毎月払い `/v1/client/installments`

CRUD + `/{paid_id}/subscriber`

### クーポン `/v1/client/coupon`

CRUD

## Discord

- Roles: `/v1/discord/guilds/{guild_id}/roles[/{role_id}]`
- Channels: `/v1/discord/guilds/{guild_id}/channels[/{channel_id}]`（`parent_id` 可）

## 公開されていないもの（実装しない）

- 決済実行 / 返金 / 解約 REST
- 顧客一覧検索
- Webhook 設定 CRUD API
- Sandbox
