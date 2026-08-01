# Contributing

Issues and pull requests are welcome.

## Guidelines

- Keep changes small and focused
- Run `bun run check`, `bun run typecheck`, and `bun test` before opening a PR
- Do not commit secrets (`APPS_APP_ID`, `APPS_APP_SECRET`, tokens)
- Prefer clear names and short docs over clever abstractions
- CI runs `bun run check`, `bun run typecheck`, `bun test`, and `bun run build` on PRs
- Do not commit `bin/theapps-mcp.js` (built on publish / locally as needed)

## Development

```bash
bun install
bun run start
bun test
bun run build
```

End users install with Node only:

```bash
npx -y theapps-mcp configure
```

## Release

1. Ensure `main` is green on CI
2. Bump the version (creates a commit + annotated tag):

```bash
npm version patch   # or minor / major
```

3. Push branch and tag:

```bash
git push origin main --follow-tags
```

4. The **Release** workflow will:
   - run checks / tests / build
   - publish to npm (`theapps-mcp@x.y.z`) if that version is not already published
   - create a GitHub Release for `vx.y.z`

### GitHub secrets

Repository secret **`NPM_TOKEN`** (npm Automation token) is required for publishing.  
Optional: configure [Trusted Publishing](https://docs.npmjs.com/trusted-publishers) for this repo on npmjs.com (workflow uses OIDC `id-token: write`).
