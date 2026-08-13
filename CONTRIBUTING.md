# Contributing

Issues and pull requests are welcome.

## Guidelines

- Keep changes small and focused
- Run `bun run check`, `bun run typecheck`, and `bun test` before opening a PR
- Website changes: `cd website`; `npm run typecheck`; `npm test`; `npm run build`; `npm run lighthouse`
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

Publishing uses **npm Trusted Publishing** (OIDC from GitHub Actions). No long-lived npm publish token.

### First-time only (package does not exist on npm yet)

Trusted Publishing can only be configured after the package exists. Publish `0.1.0` once from your machine with a 2FA OTP (no bypass-token needed):

```bash
bun run build
npm publish --access public --otp=123456
```

Replace `123456` with the current code from your authenticator app.

Then on npmjs.com:

1. Open https://www.npmjs.com/package/theapps-mcp → **Settings** → **Trusted Publisher**
2. Choose **GitHub Actions**
3. Fill exactly:

| Field | Value |
|-------|--------|
| Organization or user | `jammaru` |
| Repository | `theapps-mcp` |
| Workflow filename | `release.yml` |
| Environment name | _(leave empty)_ |
| Allowed actions | **npm publish** (check this) |

### Later releases

1. Ensure `main` is green on CI
2. Bump version (commit + tag):

```bash
npm version patch   # or minor / major
git push origin main --follow-tags
```

3. The **Release** workflow publishes to npm via OIDC, packs `apps-api-skill.zip`, and creates the GitHub Release with that asset.

Locally pack the skill zip:

```bash
bun run pack:skill   # or: node ./scripts/pack-skill.mjs
```
