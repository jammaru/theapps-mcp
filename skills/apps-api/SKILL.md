---
name: apps-api
description: >-
  Apps（theapps.jp）を Apps-mcp（apps_* ツール）で操作する利用者向けガイド。
  顧客・決済照会、登録ページ、決済ページ（1回払い/定期/分割）、クーポン、Discord、
  Webhook、アプリID、アプリシークレット、payment_id、theapps-mcp の話題で使う。
  apps_* MCP ツールを呼ぶ直前、または Apps のプラン作成・顧客確認・クーポン発行などの依頼では、
  明示がなくても必ずこのスキルを最初に読む（ツール説明のヒントだけに頼らない）。
---

# Apps-mcp（利用者向け）

Apps API をエージェントから安全・正確に使うためのスキルです。

- **MCP（Apps-mcp）**: 認証・HTTP・書き込みガード・ツール実行
- **このスキル**: どのツールを使うか、必須フィールド、よくある手順、地雷

仕様の正本: https://theapps.jp/api  
エンドポイント詳細: https://theapps.jp/api/endpoints

## いつ読むか（必須）

`apps_*` を使うタスクでは、**最初の MCP 呼び出しより前に** この `SKILL.md` を読む。  
ツール説明の「read the skill」はヒントであり、代わりにはならない。

- 読み取りだけでも、まずこのファイル → 必要なら [recipes/lookup.md](recipes/lookup.md)
- 作成・更新・削除の前は、該当 `recipes/` と `references/` も読む
- 同じ会話で既に読済みなら再読は不要。別タスク・書き込みに入るときは再確認する

## セットアップ（未接続のとき）

```bash
npx -y theapps-mcp configure
```

その後クライアントを再起動し、`apps_auth_status` で資格情報の有無を確認する。  
スキルの導入（MCP とセットで）:

```bash
npx skills add jammaru/theapps-mcp
```

Claude Desktop は [apps-api-skill.zip](https://github.com/jammaru/theapps-mcp/releases/latest/download/apps-api-skill.zip) をアップロードする。

## 基本ワークフロー

1. このスキルを読む（未読ならここで）
2. `apps_auth_status` で接続確認（シークレットは返ってこない）
3. 読み取りツールから始める（一覧 → 1件取得）
4. 書き込み前に該当 `recipes/` と `references/` を読む
5. 書き込みは必ず `dry_run: true` → 差分説明 → `confirm: true`
6. 顧客・購入者・契約者などの個人情報はログ・コミット・Issue に残さない

書き込みには `APPS_MCP_ALLOW_WRITE=true` が必要。詳細は [recipes/write-safely.md](recipes/write-safely.md)。

## やりたいこと → レシピ

| やりたいこと | 読む |
|--------------|------|
| 顧客・決済を調べる | [recipes/lookup.md](recipes/lookup.md) |
| 1回払い / 定期 / 分割の決済ページを作る・直す | [recipes/create-payment-page.md](recipes/create-payment-page.md) |
| 登録ページ（オプトイン）を作る | [recipes/create-registration-page.md](recipes/create-registration-page.md) |
| 割引コードを作る | [recipes/create-coupon.md](recipes/create-coupon.md) |
| Discord ロール / チャンネル | [recipes/discord.md](recipes/discord.md) |
| 書き込みの安全手順 | [recipes/write-safely.md](recipes/write-safely.md) |

## フィールドリファレンス

| 領域 | 読む |
|------|------|
| 顧客・決済照会 | [references/customer-payment.md](references/customer-payment.md) |
| 決済ページ（Product / Paid / Installment） | [references/payment-pages.md](references/payment-pages.md) |
| 登録ページ（Plan） | [references/advance-plan.md](references/advance-plan.md) |
| クーポン | [references/coupon.md](references/coupon.md) |
| Discord | [references/discord.md](references/discord.md) |
| パス早見 | [references/endpoints.md](references/endpoints.md) |
| 安全・禁止事項 | [references/safety.md](references/safety.md) |

## ツールの選び方（要約）

| 領域 | 一覧 | 取得 | 作成 / 更新 / 削除 |
|------|------|------|-------------------|
| 登録ページ | `apps_list_advance_plans` | `apps_get_advance_plan` | `apps_create/update/delete_advance_plan` |
| 1回払い | `apps_list_products` | `apps_get_product` | `apps_create/update/delete_product` |
| 定期払い | `apps_list_paid_plans` | `apps_get_paid_plan` | `apps_create/update/delete_paid_plan` |
| 分割（回数制限） | `apps_list_installment_plans` | `apps_get_installment_plan` | `apps_create/update/delete_installment_plan` |
| クーポン | `apps_list_coupons` | `apps_get_coupon` | `apps_create/update/delete_coupon` |
| 顧客 | — | `apps_get_customer` | — |
| 決済照会 | — | `apps_get_charge` / `apps_get_paid_payment` / `apps_get_installments_payment` | — |
| Discord | — | `apps_get_discord_role` / `apps_get_discord_channel` | create/update/delete 系 |

迷ったら `apps_help`（`topic=tools|setup|safety`）。

## 絶対に外さない前提

- 接続先は本番のみ（`https://api.theapps.jp`）。Sandbox はない
- 決済ページ API は `/v1/client/...`（`/v1/apps/...` ではない）
- `payment_id` は管理画面の表示 ID ではなく、Webhook「決済成功」由来
- 決済実行・返金・解約・顧客一覧検索の REST は公開範囲では未提供（存在する前提で呼ばない）
