# Coupon rules

Official source: https://theapps.jp/api/endpoints

## Required decisions

- `coupon_name` and `coupon_code`
- `stripe_env_id`: `"0"` live payments, `"1"` test-mode payments; immutable after creation
- `coupon_type`: `0` percentage, `1` fixed amount
- `rate`: required for percentage coupons
- `price`: required for fixed-amount coupons
- `coupon_term`: `-1` every charge, `0` first charge only, or a positive month count
- `payment_type`: target payment family
- `initial_cost_coupon` is not allowed when `payment_type` is `1` or `5`

## Payment scope

| `payment_type` | Target | `product_ids` |
|---|---|---|
| `0` | Stripe subscription | Not allowed |
| `1` | One-time product | Product IDs; `coupon_term` must be `0` |
| `4` | Recurring plan | Plan IDs |
| `5` | Installment plan | Plan IDs; `coupon_term` must be `0` |
| `14` | Stripe Billing recurring plan | Plan IDs |

Omitting `product_ids` targets every product or plan in the selected payment type. A 100-percent discount uses the normal coupon API with `coupon_type=0` and `rate=100`.

## Existing coupons

- `stripe_env_id` cannot be changed.
- Payment types `4` and `14` cannot be changed into each other.
- After use, `coupon_code`, `payment_type`, and `product_ids` cannot be changed.
- Changing discount terms after use creates a revision: the old coupon is logically deleted and the replacement starts with zero uses.
- A coupon with usage history cannot be deleted.
