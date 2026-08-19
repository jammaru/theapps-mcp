# Payment-page rules

Official source: https://theapps.jp/api/endpoints

## Endpoint and identifier map

| Billing behavior | Base path | ID | MCP prefix |
|---|---|---|---|
| One-time | `/v1/client/product` | `product_id` | `apps_*_product` |
| Recurring | `/v1/client/paid` | `paid_id` | `apps_*_paid_plan` |
| Fixed-count installment | `/v1/client/installments` | `paid_id` | `apps_*_installment_plan` |

The transaction paths `/v1/charge`, `/v1/paid`, and `/v1/installments` inspect payments; they do not manage page configuration.

## Create bodies

The MCP schema enforces the fields it needs for a reliable create request.

- Product: `product_name`, `stripe_env_id`, `price`, and at least one enabled `platform` entry.
- Recurring: `plan_name`, `stripe_env_id`, `price`, `billing_cycle.interval`, and at least one enabled `platform` entry.
- Installment: `plan_name`, `stripe_env_id`, `price`, `billing_cycle.interval`, `billing_cycle.installments_count` of at least 2, and at least one enabled `platform` entry.

The official API marks `platform` optional and immutable after creation. Apps-mcp requires an enabled platform on creation so the intended payment method is explicit.

`stripe_env_id` is required on creation and immutable on update. Values used by Apps are `"0"` for live payments and `"1"` for test-mode payments. This mode does not change the API base URL or create a separate account sandbox.

Optional `discord_rule` attaches automatic Discord access after payment. Create the role with `apps-manage-discord` first, then put its ID here.

## Update restrictions

- `stripe_env_id` and `platform` cannot be changed after creation.
- Installment `price` and `billing_cycle` cannot be changed.
- Fetch before updating and submit only changed keys.

## WaitingList

WaitingList is supported for products and installment plans, not recurring `/v1/client/paid` plans.

- When `waiting_list` is sent, `type` is required.
- For installment `type=2`, `interval` is also required.
- `type` values: `0` off, `1` manual approval, `2` automatic approval after `interval` hours, `3` formation conditions.
- For `type=3`, include only the formation fields the official API documents (deadline, minimum participants, and related mail flags). Extra keys pass through; do not invent names.

## Responses

Create and get responses can contain `url_application`. Return that URL instead of constructing one. Purchaser and subscriber list tools return personal records; summarize only when the user asked for enrollment.
