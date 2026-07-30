# クーポン（割引コード）

一次情報: https://theapps.jp/api/endpoints（割引コードAPI）  
ツール: `apps_*_coupon`

## 必須（作成）

| key | 説明 |
|-----|------|
| `stripe_env_id` | `0` 本番 / `1` テスト。変更不可 |
| `coupon_name` | 表示名 |
| `coupon_code` | 入力コード |
| `coupon_type` | `0` パーセント / `1` 定額 |
| `rate` または `price` | `coupon_type=0` なら `rate`、`1` なら `price` |
| `coupon_term` | `-1` 都度 / `0` 初回のみ / `n` nヶ月 |
| `payment_type` | 対象決済種別（下表） |

## payment_type

| 値 | 種別 | product_ids |
|----|------|-------------|
| `0` | サブスク課金 for Stripe | 指定不可 |
| `1` | 1回払い | 商品 ID。`coupon_term=0` のみ |
| `4` | 定期払い | プラン ID |
| `5` | 毎月払い（回数制限） | プラン ID。`coupon_term=0` のみ |
| `14` | 定期払い（Stripe Billing） | プラン ID |

- セット販売（`8`）は対象外
- `4` と `14` は相互変更不可
- `product_ids` 未指定なら、その決済種別の全プラン/商品が対象
- 作成しただけでは特定ページに「自動付与」されない。対象は `payment_type` + `product_ids`

## 100% オフ

専用 API はない。`coupon_type=0` かつ `rate=100`。

```json
{
  "stripe_env_id": "1",
  "coupon_name": "全額オフキャンペーン",
  "coupon_code": "FREE100",
  "coupon_type": 0,
  "rate": 100,
  "coupon_term": 0,
  "payment_type": 1
}
```

## 変更・削除の注意

- 利用実績があると `coupon_code` / `payment_type` / `product_ids` は変更不可、削除不可
- 割引内容を変えるとリビジョンアップされる場合がある（公式注意書き参照）
