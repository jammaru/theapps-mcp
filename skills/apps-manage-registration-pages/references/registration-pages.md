# Registration-page rules

Official sources:

- https://theapps.jp/api/advance
- https://theapps.jp/api/endpoints

Product manual for URL prefills: https://theapps.jp/payment/remarks-url-parameters

## API

Registration pages use `/v1/advance` and `plan_id`. Create responses include `plan_id`, `url_application`, and the resulting `plan`.

The minimum create fields are:

- `contract_type`: `email`, `discord`, or `line`
- `plan_name`
- `language`: `ja`, `en`, or `pt`

`contract_type=discord` requires `discord_rule`. `contract_type=line` requires `line.channel_id` and `line.channel_secret`.

Optional `notes` is the remark-field list (`name`, `require`). After a plan has applications, remark fields cannot be added or removed (rename only).

## Application URL parameters

Return `url_application` instead of constructing one. Registration forms accept `remark_n=value` query parameters (1-based, matching the plan-edit table; `notes[0]` → `remark_1`). UTF-8 encode the value (max 500 characters before encoding). Prefills are editable by the customer. If the URL already has a query string, join with `&`.

## WaitingList

When approval or formation conditions are enabled, add `waiting_list` with `type`:

- `1`: manual approval
- `2`: automatic approval after the configured interval
- `3`: formation conditions. Include only official formation fields; extra keys pass through.

When the feature is unused, omit the entire `waiting_list` object. Do not send `{ "type": 0 }` as a substitute for omission on registration-page requests.

Formation-condition plans show pending (approval-waiting) applicant counts in parentheses next to the contract count in the administration list. The parenthesis is omitted when the pending count is 0. Do not invent a list-response field if the API payload does not include it.

Official DiscordRule `trigger` values are `auto`, `manual`, and `cancel`. A live GET of a recurring plan also returned `error` (payment-error timing). Formation-condition plans can also set administration-screen timings for waiting-list application and waiting-list cancellation. Those extra waiting-list trigger strings are not listed in the Apps API DiscordRule table; do not invent names. If a role is granted at waiting-list application, add a matching cancellation rule or the role remains after the application is withdrawn.

## Contractor status

`apps_list_advance_plan_contractors` maps official status values as follows:

- `2`: contracted
- `3`: canceled
- `5`: waiting
- `30`: not formed

The response contains personal data. Return only the fields needed for the user's stated purpose.
