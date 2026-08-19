# Registration-page rules

Official sources:

- https://theapps.jp/api/advance
- https://theapps.jp/api/endpoints

## API

Registration pages use `/v1/advance` and `plan_id`. Create responses include `plan_id`, `url_application`, and the resulting `plan`.

The minimum create fields are:

- `contract_type`: `email`, `discord`, or `line`
- `plan_name`
- `language`: `ja`, `en`, or `pt`

`contract_type=discord` requires `discord_rule`. `contract_type=line` requires a `line` object with the fields required by the MCP schema.

## WaitingList

When approval or formation conditions are enabled, add `waiting_list` with `type`:

- `1`: manual approval
- `2`: automatic approval after the configured interval
- `3`: formation conditions

When the feature is unused, omit the entire `waiting_list` object. Do not send `{ "type": 0 }` as a substitute for omission on registration-page requests.

## Contractor status

`apps_list_advance_plan_contractors` maps official status values as follows:

- `2`: contracted
- `3`: canceled
- `5`: waiting
- `30`: not formed

The response contains personal data. Return only the fields needed for the user's stated purpose.
