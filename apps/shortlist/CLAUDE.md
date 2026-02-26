# Retold — CLAUDE.md

Auto-loaded context for Claude Code sessions. Keep this concise.

## Stack
- **Next.js 15 App Router** — server + client components, API routes
- **Prisma ORM** + PostgreSQL on Railway
- **NextAuth v5** — JWT strategy, Google OAuth
- **Tailwind CSS v4** — CSS custom properties via `@theme inline`, no `tailwind.config.ts`
- **Vitest** — unit + API tests; **Playwright** — e2e

## Plans
`free | starter | pro` — defined in `lib/plan.ts` with predicate functions:
- `canDownload(plan)` — starter+
- `canExportMarkdown(plan)` — starter+
- `canExportPdf(plan)` — pro only
- `canUseInstructions(plan)` — starter+

## Auth Patterns
| Context | Use |
|---------|-----|
| Server component / layout | `auth()` from `@/lib/auth` |
| API route (regular user) | `requireAuth()` from `@/lib/route-helpers` |
| API route (admin only) | `assertAdmin()` from `@/lib/admin` |
| Server component (admin) | `requireAdmin()` from `@/lib/admin` |

All return a discriminated union: `{ session, error: null } | { session: null, error: NextResponse }`.

## API Route Pattern
```ts
const { session, error: authError } = await requireAuth();
if (authError) return authError;

const { data, error: parseError } = await parseBody(req, mySchema);
if (parseError) return parseError;

// ownership check → plan gate → process
```

## Key Files
| File | Purpose |
|------|---------|
| `lib/plan.ts` | Plan tiers, limits, feature gate functions |
| `lib/route-helpers.ts` | `requireAuth()`, `parseBody()` |
| `lib/admin.ts` | `assertAdmin()`, `requireAdmin()` |
| `lib/tailor-resume.ts` | Claude API call for tailoring |
| `lib/keyword-match.ts` | Keyword match scoring |
| `lib/parse-resume-lines.ts` | Shared resume text parser (used by docx + pdf export) |
| `types/index.ts` | All Zod schemas + shared TS types |
| `prisma/schema.prisma` | DB schema |

## Component Conventions
- **Server components by default** — use `"use client"` only for event handlers / hooks
- Forms and interactive UI live in `components/tailoring/` or `components/shared/`
- Plan-gated UI: show `CopyButton` (free) or `DownloadMenu` (starter+) based on `canDownload(plan)`

## Commands
```sh
pnpm --filter shortlist test        # run tests (should be 209 passing)
pnpm --filter shortlist test:watch  # watch mode
pnpm --filter shortlist build       # TypeScript check + build
```

## DB (Production)
Use `/set-shortlist-role` skill to update user roles in production.
Requires public Railway DATABASE_URL (internal hostname unreachable locally).
