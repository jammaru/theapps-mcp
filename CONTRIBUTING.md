# Contributing

Issues and pull requests are welcome.

## Guidelines

- Keep changes small and focused
- Run `bun run check`, `bun run typecheck`, and `bun test` before opening a PR
- Do not commit secrets (`APPS_APP_ID`, `APPS_APP_SECRET`, tokens)
- Prefer clear names and short docs over clever abstractions
- CI runs `bun run check`, `bun run typecheck`, `bun test`, and `bun run build` on PRs

## Development

```bash
bun install
bun run start
bun test
```
