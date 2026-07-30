# Discord ロール / チャンネルを操作する

詳細: [references/discord.md](../references/discord.md)  
安全手順: [recipes/write-safely.md](write-safely.md)

## 手順

1. `guild_id`（および role/channel ID）をユーザーから取得。推測しない
2. 取得で存在確認: `apps_get_discord_role` / `apps_get_discord_channel`
3. 作成・更新・削除は dry_run → confirm

## ロール作成例

```json
{
  "guild_id": "GUILD_ID",
  "body": {
    "name": "member",
    "position": 1,
    "permissions": []
  },
  "dry_run": true
}
```

## カテゴリ配下にチャンネル

`parent_id` にカテゴリのチャンネル ID を指定して `apps_create_discord_channel`。

## プランの discord_rule との違い

- このレシピ: ギルド上のロール/チャンネル自体を CRUD
- 決済・登録ページの `discord_rule`: 申込時の自動付与などの設定

申し込み連動だけなら、先にロールを作り、その ID をプランの `discord_rule.role_ids` に入れる、という順番が安全。
