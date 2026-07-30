# 決済ページを作る・直す

対応: 1回払い / 定期払い / 毎月払い（回数制限）

フィールド詳細: [references/payment-pages.md](../references/payment-pages.md)  
安全手順: [recipes/write-safely.md](write-safely.md)

## 種別の選び方

| 売り方 | ツール接頭辞 | API |
|--------|--------------|-----|
| 一回きりの支払い | `apps_*_product` | `/v1/client/product` |
| 継続課金 | `apps_*_paid_plan` | `/v1/client/paid` |
| 回数制限つき毎月払い | `apps_*_installment_plan` | `/v1/client/installments` |

## 作成フロー

1. 既存を見る: 対応する `apps_list_*`
2. テスト環境なら `stripe_env_id: "1"`、本番なら `"0"`（ユーザーに確認）
3. 必須フィールドを埋めた body を用意
4. `dry_run: true` → 確認 → `confirm: true` で create
5. 返り値の申込 URL（`url_application` など）をユーザーに伝える

## 更新フロー

1. `apps_get_*` で現状取得
2. 変更できない項目（`stripe_env_id`, `platform` など）をいじらない
3. 変えたいキーだけ含む body で update（公式はオブジェクト送信。不明点は GET 結果をベースに差分を作る）
4. dry_run → confirm

## 最小例

1回払い → `apps_create_product`:

```json
{
  "body": {
    "product_name": "単発セミナー",
    "stripe_env_id": "1",
    "price": 5000,
    "language": "ja",
    "platform": { "stripe": true }
  },
  "dry_run": true
}
```

定期 → `apps_create_paid_plan`:

```json
{
  "body": {
    "plan_name": "月額プラン",
    "stripe_env_id": "1",
    "price": 1980,
    "language": "ja",
    "platform": { "stripe": true },
    "billing_cycle": { "interval": "month", "count": 1 }
  },
  "dry_run": true
}
```

分割 → `apps_create_installment_plan`（`installments_count` は 2 以上）:

```json
{
  "body": {
    "plan_name": "3回払い",
    "stripe_env_id": "1",
    "price": 30000,
    "language": "ja",
    "platform": { "stripe": true },
    "billing_cycle": { "interval": "month", "installments_count": 3 }
  },
  "dry_run": true
}
```

## 削除

`apps_delete_*` は破壊的。紐づく申込 URL が使えなくなる前提でユーザー確認 → dry_run → confirm。
