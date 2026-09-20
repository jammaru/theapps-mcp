---
title: Safety Guide
description: Safe use of Apps-mcp.
---

- No separate API sandbox — test-mode payment settings still write to the connected Apps account
- Do not paste secrets into chat/Git/issues
- Default is read-only
- Writes need allow + `confirm: true`; prefer `dry_run`
- Avoid logging personal data
- Do not invent undocumented installment-schedule or DiscordRule `trigger` keys
- Prefill remarks with `remark_n` on the returned `url_application`; do not reconstruct the path
