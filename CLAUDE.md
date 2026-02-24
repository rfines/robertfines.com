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

## Status
- [x] Monorepo scaffolded (pnpm + Turborepo)
- [x] `apps/web` — Next.js app scaffolded (TypeScript, Tailwind, App Router)
- [x] `apps/api` — Express app scaffolded (TypeScript, tsx, Express v5)
- [x] Web app UI/design (dark/technical, amber, all pages built)
- [x] Fill in real resume content, bio, email, GitHub/LinkedIn URLs
- [ ] Deploy infra (`infra/`)
