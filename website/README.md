# Apps-mcp Website

Official documentation site for [Apps-mcp](https://github.com/jammaru/theapps-mcp).

## Develop

```bash
npm install
npm run dev
```

## Build / Check

```bash
npm run build
npm run typecheck
npm test
```

## Analytics (optional)

Google Analytics 4 is **off by default**. It is enabled only when
`PUBLIC_GOOGLE_ANALYTICS_ID` is set at **build** time (Astro inlines `PUBLIC_*`
variables). Leave it empty when cloning or forking so nothing is sent to the
original property.

```env
# website/.env.example
PUBLIC_GOOGLE_ANALYTICS_ID=
```

Production (Cloudflare Pages → Environment variables, Production) already has
this set. Preview deployments, forks, and GitHub CI do not, so they send nothing
to the original property. After changing the value, trigger a new production
build — runtime-only env vars are not enough.

## Cloudflare Pages (Git)

Connect the `jammaru/theapps-mcp` repository in the Cloudflare Pages dashboard with:

| Setting | Value |
|---|---|
| Project name | `theapps-mcp` |
| Production branch | `main` |
| Root directory | `website` |
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Environment variable | `NODE_VERSION=22` |
| Environment variable | `PUBLIC_GOOGLE_ANALYTICS_ID` (optional, Production only) |

Production: https://theapps-mcp.pages.dev

Manual deploy (optional):

```bash
npm run deploy
```
