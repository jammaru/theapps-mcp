---
title: FAQ
description: Frequently asked questions.
---

## Is this official?

No. Unofficial OSS for the Apps API.

## Is Bun required?

Not for `npx` users.

## Why are writes blocked?

Read-only by default. Enable `APPS_MCP_ALLOW_WRITE=true` and pass `confirm: true`.

## Cursor shows an Apps MCP error

Do not use `npx -y github:jammaru/theapps-mcp`. Run `npx -y theapps-mcp configure`. On Windows, `configure` writes `cmd /c npx -y theapps-mcp@latest`. Reload the MCP server and call `apps_auth_status`.

## How do I add Skills in Claude Desktop?

Upload [theapps-mcp-skills.zip](https://github.com/jammaru/theapps-mcp/releases/latest/download/theapps-mcp-skills.zip) once. It includes every workflow skill.
