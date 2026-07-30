# Discord 連携

一次情報: https://theapps.jp/api/discord

## ロール — `apps_*_discord_role`

| 操作 | ツール |
|------|--------|
| 取得 | `apps_get_discord_role` |
| 作成 | `apps_create_discord_role` |
| 更新 | `apps_update_discord_role` |
| 削除 | `apps_delete_discord_role`（HTTP 204） |

作成・更新 body:

| key | 説明 |
|-----|------|
| `name` | ロール名 |
| `position` | 表示位置 |
| `permissions` | Permission 名の配列（Discord Permissions に準拠） |

## チャンネル — `apps_*_discord_channel`

| 操作 | ツール |
|------|--------|
| 取得 | `apps_get_discord_channel` |
| 作成 | `apps_create_discord_channel` |
| 更新 | `apps_update_discord_channel` |
| 削除 | `apps_delete_discord_channel`（HTTP 204） |

作成・更新 body:

| key | 説明 |
|-----|------|
| `type` | チャンネルタイプ（Discord Channel Types） |
| `name` | 名前 |
| `topic` | 説明（任意） |
| `role` / `user` | Permission[]（任意） |
| `parent_id` | 親カテゴリ ID（カテゴリ配下に作るとき） |

Permission 要素: `id`（必須）, `allow[]`, `deny[]`

## 決済/登録ページの自動化との関係

プランの `discord_rule` は「申し込み時にロール付与」などの自動化設定。  
こちら（Discord API）はギルド上のロール/チャンネル自体の CRUD。用途を混同しない。
