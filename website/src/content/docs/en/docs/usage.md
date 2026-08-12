---
title: Usage
description: How to use Apps-mcp after setup.
---

Ask in natural language. The agent picks tools.

## Examples

- “List one-time payment pages”
- “Create a 3000 JPY product. dry_run first”
- “Look up this customer_id”

## Read first

1. `apps_auth_status`
2. Read endpoints
3. Enable writes only when needed

## Writes

Production only. Set `APPS_MCP_ALLOW_WRITE=true`, prefer `dry_run: true`, then `confirm: true`.
