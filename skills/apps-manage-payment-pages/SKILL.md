---
name: apps-manage-payment-pages
description: Create, inspect, update, or delete an Apps payment page for a one-time product, recurring subscription, or limited-count installment plan. Use when the user wants to publish or maintain a checkout page (決済ページ, 一回払い, 月額プラン, 申込URL), not for checking whether a transaction succeeded.
---

# Manage Apps payment pages

Build the requested checkout page using the correct Apps plan family. Read [references/payment-pages.md](references/payment-pages.md) before constructing a create or update body.

## When to load this skill

Read this skill before the first matching `apps_*` MCP call in each task. Read the linked reference before every create, update, or delete operation.

## Choose the plan family

- One-time payment: `apps_*_product`
- Recurring payment without a fixed final count: `apps_*_paid_plan`
- Recurring payment with a fixed number of installments: `apps_*_installment_plan`

Do not choose a family from the price or name alone. Use the intended billing behavior.

## Create

1. Call `apps_auth_status` and list existing plans in the selected family.
2. Establish the plan name, amount, billing behavior, payment mode, language, and enabled payment platform.
3. Treat `stripe_env_id: "1"` as a test-mode payment setting, not an API sandbox. The resource is still created in the connected Apps account.
4. Build the smallest valid body. Follow the MCP input schema for required and conditional fields.
5. Call the create tool with `dry_run: true`.
6. Check the method, `/v1/client/...` path, body, payment mode, price, and billing cycle. Explain the pending effect.
7. Call the same tool with `confirm: true` only after the user approves that preview.
8. Return the created identifier, `url_application` when present, and a concise settings summary.

## Update

1. Fetch the existing plan (`apps_get_product`, `apps_get_paid_plan`, or `apps_get_installment_plan`).
2. Send only fields that should change.
3. Do not change immutable fields. For installment plans, do not change `price` or `billing_cycle`.
4. Preview with `dry_run: true`, explain the difference, then execute with `confirm: true` after approval.

## Delete

Fetch the plan, identify the application URL that will stop working, preview the delete, and execute only after explicit approval. Treat deletion as irreversible.

## Purchaser and subscriber lists

Use `apps_list_product_purchasers`, `apps_list_paid_plan_subscribers`, or `apps_list_installment_plan_subscribers` only when the user asks for enrollment. Summarize counts or the requested fields. Do not save or reproduce raw rows.

## Safety and result

- Writes need `APPS_MCP_ALLOW_WRITE=true`. Do not ask the user to paste that value in chat; point them to `configure` or the MCP env.
- Preview with `dry_run: true`, explain the pending effect, then execute with `confirm: true` only after approval.
- Apps API has no separate sandbox; all writes target the connected account.
- Report exactly what changed, the plan family, mode, identifier, and application URL. Do not claim that the page accepts payments until the returned configuration supports that conclusion.
