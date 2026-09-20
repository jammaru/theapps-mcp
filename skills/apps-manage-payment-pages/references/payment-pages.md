# Payment-page rules

Official source: https://theapps.jp/api/endpoints

Product manual for URL prefills: https://theapps.jp/payment/remarks-url-parameters

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

Optional `notes` is the remark-field list (`name`, `require`). After a plan has applications, remark fields cannot be added or removed (rename only). Design `notes` before the first application.

## Update restrictions

- `stripe_env_id` and `platform` cannot be changed after creation.
- Installment `price` and `billing_cycle` cannot be changed.
- Fetch before updating and submit only changed keys.

## Application URL parameters

Create and get responses can contain `url_application`. Return that URL instead of constructing one.

When the user wants prefilled form values, append query parameters to the returned URL (UTF-8 encode values). If the URL already has a query string, join with `&`.

| Parameter | Applies to | Meaning |
|---|---|---|
| `remark_n=value` | One-time, recurring, installment, registration, and plan-selection forms | Prefill remark field `n`. `n` is 1-based and matches the plan-edit table (`notes[0]` → `remark_1`). Max 500 characters before encoding. |
| `quantity=` | Recurring application URLs | Prefill contracted units when the plan accepts a unit count (`contracted_units`). |

Prefills are editable by the customer; they cannot be made read-only. Unknown `remark_n` indexes are ignored. Mail merge tags `${remarks_name_N}` / `${remarks_value_N}` are 0-based (`remark_1` → `${remarks_value_0}`) and also work in cancellation-complete mail.

## Installment amount patterns

The Apps administration screen offers three installment amount patterns: equal split, stepped amounts, and amount-by-range. Official `InstallmentBillingCycle` documents `interval`, `installments_count` (≥2), `manual_payments`, and `sales_count`. Create equal-split plans with `price` (total) and `billing_cycle.installments_count`. Do not invent per-installment schedule keys.

Lump-sum early repayment of remaining installments is an administration-screen action that emails the customer a confirmation URL. Apps-mcp does not provide payment-execution REST.

## Recurring free trial

Official `BillingCycle` includes `trial_end` (unix time). The product UI requires immediate billing for a free-trial period. Repeat applications can skip the trial (match by phone or email) in the administration screen; phone matching requires `use_phone_number` to be required. Official Paid / BillingCycle docs do not list that skip-trial key; do not invent names.

## WaitingList

WaitingList is documented on products and installment plans, not recurring `/v1/client/paid` plans. Do not send `waiting_list` on paid-plan requests unless the official endpoint docs add it.

- When `waiting_list` is sent, `type` is required.
- For installment `type=2`, `interval` is also required.
- `type` values: `0` off, `1` manual approval, `2` automatic approval after `interval` hours, `3` formation conditions.
- For `type=3`, include only the formation fields the official API documents (deadline, minimum participants, and related mail flags). Extra keys pass through; do not invent names.

Formation-condition plans show pending (approval-waiting) applicant counts in parentheses next to the contract count in the administration list. The parenthesis is omitted when the pending count is 0. Do not invent a list-response field if the API payload does not include it.

Official DiscordRule `trigger` values are `auto`, `manual`, and `cancel` (契約解約 / contract cancellation). A live GET of a recurring plan also returned `error` (payment-error timing); do not send `error` unless a GET of that plan already shows it. Formation-condition plans can set waiting-list application and waiting-list withdrawal timings in the administration screen. Those extra waiting-list trigger strings are not listed in the Apps API DiscordRule table; do not invent names. Official `cancel` is not waiting-list withdrawal. If a role should be granted at waiting-list application and removed on withdrawal, tell the user to set both timings in the Apps administration screen — MCP has no documented REST key for them, and without the admin withdrawal rule the role remains.

## Responses

Purchaser and subscriber list tools return personal records; summarize only when the user asked for enrollment.
