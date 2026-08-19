---
name: apps-manage-coupons
description: Create, inspect, update, or delete an Apps discount code, including percentage, fixed-amount, or 100-percent discounts and scoping to products or plans. Use when the user wants to run or maintain a discount campaign.
---

# Manage Apps coupons

Create and maintain discount codes with an explicit payment scope. Read [references/coupons.md](references/coupons.md) before constructing a body.

## Create

1. Call `apps_auth_status` and `apps_list_coupons` to detect code collisions.
2. Establish the coupon name, customer-facing code, live or test payment mode, discount type and value, validity period, usage limit, payment type, and target products or plans.
3. Treat `stripe_env_id: "1"` as a test-mode coupon setting, not an API sandbox. The coupon is still created in the connected Apps account.
4. Build the smallest body accepted by the MCP schema.
5. Call `apps_create_coupon` with `dry_run: true`.
6. Explain the target scope and whether omitting `product_ids` affects every product or plan in that payment type.
7. Execute with `confirm: true` only after approval.
8. Return the coupon identifier, code, discount, validity, usage limit, and target scope.

## Update and delete

Fetch the coupon first. Respect immutable fields and usage-history restrictions in the reference. Preview the operation, explain revision or deletion behavior, and execute only after approval.

## Boundaries

- Creating a coupon does not automatically attach it to a single page; scope comes from `payment_type` and `product_ids`.
- Do not claim that a coupon is usable on a page unless the returned scope includes that page.
- Do not include purchaser or customer records in the result.
