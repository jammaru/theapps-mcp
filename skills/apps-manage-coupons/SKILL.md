---
name: apps-manage-coupons
description: Create, inspect, update, or delete an Apps coupon or discount code (クーポン, 割引コード), including percentage, fixed-amount, or 100-percent discounts and scoping to products or plans. Use when the user wants to run or maintain a discount campaign.
---

# Manage Apps coupons

Create and maintain discount codes with an explicit payment scope. Read [references/coupons.md](references/coupons.md) before constructing a body.

## When to load this skill

Read this skill before the first matching `apps_*` MCP call in each task. Read the linked reference before every create, update, or delete operation.

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

Fetch with `apps_get_coupon` first. Respect immutable fields and usage-history restrictions in the reference. Preview `apps_update_coupon` or `apps_delete_coupon`, explain revision or deletion behavior, and execute only after approval.

## Safety and boundaries

- Writes need `APPS_MCP_ALLOW_WRITE=true`. Do not ask the user to paste that value in chat; point them to `configure` or the MCP env.
- Preview with `dry_run: true`, explain the pending effect, then execute with `confirm: true` only after approval.
- Creating a coupon does not automatically attach it to a single page; scope comes from `payment_type` and `product_ids`.
- Do not claim that a coupon is usable on a page unless the returned scope includes that page.
- Do not include purchaser or customer records in the result.
