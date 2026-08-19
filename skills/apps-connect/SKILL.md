---
name: apps-connect
description: Connect Apps (theapps.jp) to a supported MCP client, configure Apps-mcp, check authentication, or troubleshoot missing Apps credentials and tools. Use for setup and connection requests, not for managing payments or plans after the connection works.
---

# Connect Apps-mcp

Set up the local Apps-mcp connection without exposing credentials.

## When to load this skill

Read this skill before the first matching `apps_*` MCP call in each task. Once setup succeeds, switch to the skill for the user's next goal instead of treating this as an API-wide guide.

## Workflow

1. Confirm Node.js 20 or later and `npx` are available.
2. Direct the user to prepare the app ID and app secret in the Apps administration screen.
3. Run `npx -y theapps-mcp configure` in an interactive terminal. Enter credentials only in that prompt; never request or repeat them in chat, files, logs, or command arguments.
4. Register the MCP server for the selected client when prompted.
5. Tell the user to reload the MCP client if it does not detect the new server immediately.
6. Call `apps_auth_status` and report only whether credentials are configured.

## Safety

- Treat the app ID, app secret, and access token as secrets.
- Do not print configuration files that contain credential values.
- Keep writes disabled unless the user needs create, update, or delete operations.
- Apps API connects to `https://api.theapps.jp`; it has no separate API sandbox.

## Result

Report the configured client, whether Apps-mcp is detected, whether authentication is configured, and the exact unresolved setup step when connection fails.
