# 割引コードを作る

詳細: [references/coupon.md](../references/coupon.md)  
安全手順: [recipes/write-safely.md](write-safely.md)

## 手順

1. `apps_list_coupons` で既存コードと衝突しないか確認
2. 対象の決済種別（`payment_type`）と、必要なら対象プラン/商品 ID（`product_ids`）を決める
3. パーセントか定額か（`coupon_type` + `rate`/`price`）
4. `apps_create_coupon` を dry_run → confirm

## 100% オフ（1回払い・初回のみ）

```json
{
  "body": {
    "stripe_env_id": "1",
    "coupon_name": "キャンペーン無料",
    "coupon_code": "FREE100",
    "coupon_type": 0,
    "rate": 100,
    "coupon_term": 0,
    "payment_type": 1
  },
  "dry_run": true
}
```

## 注意

- クーポン作成 ≠ 特定ページへの自動適用。対象は `payment_type` / `product_ids` で決まる
- 利用実績があるコードは削除や一部変更ができない
