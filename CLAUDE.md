# robertfines.com — Claude Context

## Project Overview
Personal brand website for Robert Fines. Goals: resume/CV, blog, and contact/hire me.

## Monorepo Structure
- **Package manager**: pnpm (v10+)
- **Build system**: Turborepo
- **Node**: >=22

```
apps/
  web/    # Next.js 16 frontend (App Router, Tailwind CSS 4, Geist Mono)
  api/    # Express v5 API (TypeScript, tsx)
packages/
  config/ # Shared config
```

## Apps

### `apps/web` — Next.js
- Personal brand frontend
- Dark & technical aesthetic — amber accent (#f59e0b), Geist Mono, terminal motifs
- Routes: `/` (hero), `/resume`, `/blog`, `/blog/[slug]`, `/contact`
- Blog posts: MDX files in `apps/web/content/posts/` with gray-matter frontmatter
- Key deps: `next-mdx-remote`, `gray-matter`

### `apps/api` — Express
- Backend API (Express v5, TypeScript)
- Entry: `src/index.ts`, runs on port 3001
- Health check: `GET /health`

## Dev Workflow
```bash
pnpm dev       # run all apps in parallel (Turborepo)
pnpm build     # build all apps
pnpm lint      # lint all apps
pnpm typecheck # typecheck all apps
pnpm format    # prettier format
```

## GitHub & CI/CD
- **Repo**: https://github.com/rfines/robertfines.com (public)
- **CI** (`.github/workflows/ci.yml`): lint + build on all branches/PRs
- **Deploy** (`.github/workflows/deploy.yml`): triggers after CI passes on `main`, deploys to Railway via CLI
- **Branch protection**: `main` requires `Lint & Build` check to pass

### Railway secrets/vars required in GitHub repo settings
| Name | Type | Value |
|---|---|---|
| `RAILWAY_TOKEN` | Secret | From Railway dashboard → Account Settings → Tokens |
| `RAILWAY_WEB_SERVICE` | Variable | Name of the web service in Railway |
| `RAILWAY_API_SERVICE` | Variable | Name of the API service in Railway |

### Railway service config (set per service in Railway dashboard)
- **Root directory**: `/` (monorepo root)
- **Web build**: `pnpm install --frozen-lockfile && pnpm --filter web build`
- **Web start**: `pnpm --filter web start`
- **API build**: `pnpm install --frozen-lockfile && pnpm --filter api build`
- **API start**: `pnpm --filter api start`

## Status
- [x] Monorepo scaffolded (pnpm + Turborepo)
- [x] `apps/web` — Next.js app scaffolded (TypeScript, Tailwind, App Router)
- [x] `apps/api` — Express app scaffolded (TypeScript, tsx, Express v5)
- [x] Web app UI/design (dark/technical, amber, all pages built)
- [x] Fill in real resume content, bio, email, GitHub/LinkedIn URLs
- [x] GitHub repo created, CI/CD workflows configured, branch protection enabled
- [ ] Railway project created and connected (add secrets to GitHub, configure services)
- [ ] Custom domain pointed to Railway
