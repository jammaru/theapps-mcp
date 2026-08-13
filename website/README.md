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

## Lighthouse (local)

GitHub CI does not run Lighthouse. After website changes that can affect load
(fonts, CSS, JS, layout), measure locally with Chrome installed:

```bash
npm run build
npm run lighthouse
```

`npm run lhci` uses the same URLs and assertions in `lighthouserc.cjs`
(Performance ≥ 85, Accessibility/SEO/Best Practices ≥ 90, CLS ≤ 0.1).
Reports are written to `.lighthouse/` and `.lighthouseci/` (gitignored).

## Analytics (optional)

Google Analytics 4 is **off by default**. It is enabled only when
`PUBLIC_GOOGLE_ANALYTICS_ID` is set at **build** time (Astro inlines `PUBLIC_*`
variables). Leave it empty when cloning or forking so nothing is sent to the
original property.

```env
# website/.env.example
PUBLIC_GOOGLE_ANALYTICS_ID=
```

Production uses a Cloudflare Pages **Secret** named
`PUBLIC_GOOGLE_ANALYTICS_ID` (not a plaintext dashboard var). This project has
`wrangler.jsonc`, so Pages ignores plaintext build env vars — that is why an
earlier dashboard value never reached `astro build`. Preview, forks, and local
builds without the secret send nothing. After changing the secret, trigger a
new production build.

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
| Secret (Production) | `PUBLIC_GOOGLE_ANALYTICS_ID` |

Production: https://theapps-mcp.pages.dev

Manual deploy (optional):

```bash
npm run deploy
```
