---
name: apps-manage-registration-pages
description: Create, inspect, update, or delete an Apps registration page for email, Discord, or LINE sign-up, including approval or formation conditions. Use when the user wants an opt-in or registration application URL rather than a paid checkout page.
---

# Manage Apps registration pages

Create or maintain `/v1/advance` registration plans. Read [references/registration-pages.md](references/registration-pages.md) before constructing a body.

## When to load this skill

Read this skill before the first matching `apps_*` MCP call in each task. Read the linked reference before every create, update, or delete operation.

## Create

1. Call `apps_auth_status` and `apps_list_advance_plans`.
2. Determine the registration channel: `email`, `discord`, or `line`.
3. Establish the plan name, language, registration period, redirect behavior, and whether approval or formation conditions are required.
4. Build the smallest valid body. Add `discord_rule` for Discord and `line` for LINE as required by the MCP schema.
5. Omit `waiting_list` entirely when the feature is not used.
6. Call `apps_create_advance_plan` with `dry_run: true`.
7. Explain the path, channel, and registration behavior. Execute with `confirm: true` only after approval.
8. Return `plan_id`, `url_application`, and a concise summary.

## Update and delete

- Fetch the current plan before changing it and send only changed keys.
- Preview every update or delete with `dry_run: true`.
- Before deletion, identify the application URL that will stop working and execute only after explicit approval.

## Contractor lists

Use `apps_list_advance_plan_contractors` only when the user requests enrollment status. Summarize counts or the requested record and omit unrelated personal fields. Do not save or reproduce the raw list.

## Result

Report the registration channel, approval behavior, plan identifier, application URL, and exact changed settings.
