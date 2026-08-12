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
```

## Cloudflare Pages (Git)

Connect the `jammaru/theapps-mcp` repository in the Cloudflare Pages dashboard with:

| Setting | Value |
|---|---|
| Production branch | `main` |
| Root directory | `website` |
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Environment variable | `NODE_VERSION=22` |

Production: https://apps-mcp.pages.dev

Manual deploy (optional):

```bash
npm run deploy
```
