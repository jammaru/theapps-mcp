---
name: apps-api
description: >-
  Guidance for using apps-mcp with theapps.jp Apps API.
  Trigger on Apps API, theapps.jp, 決済ページ, 登録ページ, Webhook, APP_ID, APP_SECRET.
---

# Apps API（apps-mcp）

仕様の正は https://theapps.jp/api です。

## 役割分担

- **MCP**: 実行（認証・HTTP・ガード）
- **Skill**: 手順・注意点・用語

## 最短手順

1. 未セットアップなら案内: `npx -y github:manmaru-ai/apps-mcp configure`
2. `apps_auth_status` で資格情報の有無を確認
3. 読み取りツールから開始
4. 書き込みは `APPS_MCP_ALLOW_WRITE=true` + `confirm: true`（先に `dry_run: true` 推奨）
5. `payment_id` は管理画面表示IDではなく Webhook 決済成功イベント由来

## パス早見

| 領域 | Base |
|------|------|
| トークン | `POST /v1/identity/oauth2/token` |
| 顧客 | `GET /v1/customer/{customer_id}` |
| 決済照会 | `/v1/charge` `/v1/paid` `/v1/installments` |
| 登録ページ | `/v1/advance` |
| 1回払いプラン | `/v1/client/product` |
| 定期払いプラン | `/v1/client/paid` |
| 毎月払いプラン | `/v1/client/installments` |
| クーポン | `/v1/client/coupon` |
| Discord | `/v1/discord/guilds/...` |

詳細は [references/endpoints.md](references/endpoints.md) と [references/safety.md](references/safety.md)。
