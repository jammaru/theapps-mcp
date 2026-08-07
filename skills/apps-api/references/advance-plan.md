# 登録ページ（Plan / advance）

一次情報: https://theapps.jp/api/advance  
ツール接頭辞: `apps_*_advance_plan`

## 必須（作成）

| key | 説明 |
|-----|------|
| `contract_type` | `email` / `discord` / `line` |
| `plan_name` | プラン名 |
| `language` | `ja` / `en` / `pt` |

## 条件付き必須

| 条件 | 必要なオブジェクト |
|------|-------------------|
| `contract_type=discord` | `discord_rule` |
| `contract_type=line` | `line`（`channel_id`, `channel_secret`） |

## よく使う任意項目

| key | 説明 |
|-----|------|
| `provider_name` / `label` | 提供者名・ラベル |
| `quantity` | 在庫 |
| `url_redirect_1` / `url_redirect_2` | リダイレクト |
| `agreement_terms` | 同意チェック |
| `contract_start` / `contract_end` | 受付期間（`time` は Unix 時間） |
| `use_phone_number` | 電話番号入力 |
| `notes` | 備考欄定義 |
| `waiting_list` | 手動承認・自動承認・成立条件付き申込。詳細は [waiting-list.md](waiting-list.md) |

`waiting_list` を送る場合は `type` 必須。使わない場合は **オブジェクトごと送らない**。

## 最小 body 例（メール登録）

```json
{
  "contract_type": "email",
  "plan_name": "無料メルマガ登録",
  "language": "ja"
}
```

## Discord 登録の追加例

```json
{
  "contract_type": "discord",
  "plan_name": "コミュニティ登録",
  "language": "ja",
  "discord_rule": {
    "trigger": "auto",
    "action": "grant",
    "guild_id": "GUILD_ID",
    "target_type": "role",
    "role_ids": ["ROLE_ID"]
  }
}
```

## 契約者一覧

`apps_list_advance_plan_contractors`（`GET .../contractor`）

`status`: `2` 契約 / `3` 解約 / `5` 待機中 / `30` 不成立

個人情報が含まれる。ログやコミットに残さない。

## 表記ゆれ注意

公式 Plan に `disalbe_company_name` というキーがある（disable のスペル揺れ）。公式キーに合わせる。
