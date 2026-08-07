# 登録ページを作る

無料のオプトイン / 登録ページ（`/v1/advance`）。

詳細: [references/advance-plan.md](../references/advance-plan.md)  
安全手順: [recipes/write-safely.md](write-safely.md)

## 手順

1. `apps_list_advance_plans` で既存確認
2. `contract_type` を決める（`email` / `discord` / `line`）
3. Discord / LINE なら必須オブジェクトを用意
4. `apps_create_advance_plan` を dry_run → confirm
5. 返った申込 URL を伝える

## 最小例（メール）

```json
{
  "body": {
    "contract_type": "email",
    "plan_name": "ニュースレター登録",
    "language": "ja"
  },
  "dry_run": true
}
```

## WaitingList（任意）

手動承認・自動承認・成立条件付き申込を使う場合だけ `waiting_list` を付ける。  
**使わないときはキーごと省略**（`type: 0` を送らない）。送信時は `type` 必須。  
詳細: [references/waiting-list.md](../references/waiting-list.md)

## 契約者を見る

`apps_list_advance_plan_contractors` に `plan_id`。  
個人情報を含むため、チャットへの丸ごと貼り付けやファイル保存を避ける。
