---
name: apps-manage-discord
description: Create, inspect, update, or delete Discord roles and channels through Apps, or prepare role and channel IDs for an Apps plan's Discord automation. Use for Apps-backed Discord access setup, not for general Discord administration outside Apps.
---

# Manage Apps Discord resources

Manage roles and channels through the Apps Discord API. Read [references/discord.md](references/discord.md) before writing permissions or connecting a resource to a plan.

## When to load this skill

Read this skill before the first matching `apps_*` MCP call in each task. Read the linked reference before every create, update, or delete operation.

## Workflow

1. Call `apps_auth_status`.
2. Obtain the exact `guild_id` and any existing role or channel ID. Never infer IDs from names.
3. Fetch an existing resource before updating or deleting it.
4. For creation, establish the name, placement, permissions, and parent category where relevant.
5. Preview create, update, or delete with `dry_run: true` and explain the target guild and resource.
6. Execute with `confirm: true` only after approval.
7. Return the resource ID and settings required for the next Apps plan step.

## Apps plan automation

Role and channel tools manage Discord resources. A payment or registration plan's `discord_rule` controls automatic behavior during sign-up or payment. When the user wants automated access, first ensure the target role exists, then use the relevant payment-page or registration-page workflow to add its ID to `discord_rule`.

## Safety

- Treat deletion as irreversible and verify the exact ID.
- Do not broaden permissions beyond the requested behavior.
- Do not return Discord member lists or unrelated user identifiers.
