# Retold — Architecture Reference

## Directory Structure

```
apps/shortlist/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Marketing landing page (public)
│   ├── layout.tsx                # Root layout
│   ├── auth/signin/              # Sign-in page (NextAuth)
│   ├── dashboard/                # Authenticated app shell
│   │   ├── layout.tsx            # Dashboard layout (sidebar)
│   │   ├── page.tsx              # Dashboard home
│   │   ├── resumes/              # Resume management pages
│   │   └── tailored/             # Tailored resume pages
│   ├── admin/                    # Admin panel (role=admin only)
│   └── api/                      # API routes
│       ├── auth/                 # NextAuth handler
│       ├── resumes/              # Resume CRUD
│       ├── tailor/               # AI tailoring endpoint
│       ├── tailored/             # Tailored resume read/delete/download
│       ├── uploads/              # S3 presign + text extraction
│       ├── user/                 # User settings (consent)
│       └── admin/                # Admin-only routes
├── components/
│   ├── layout/                   # AppSidebar, top nav
│   ├── shared/                   # PageHeader, etc.
│   ├── tailoring/                # Tailoring UI components
│   └── ui/                       # shadcn/ui primitives
├── lib/                          # Server-side utilities
│   ├── auth.ts                   # NextAuth config
│   ├── prisma.ts                 # Prisma client singleton
│   ├── plan.ts                   # Plan tiers + feature gates
│   ├── route-helpers.ts          # requireAuth(), parseBody()
│   ├── admin.ts                  # requireAdmin(), assertAdmin()
│   ├── tailor-resume.ts          # Claude API call
│   ├── keyword-match.ts          # Keyword scoring
│   ├── ats-warnings.ts           # ATS compatibility analysis
│   ├── parse-resume-lines.ts     # Shared resume text parser
│   ├── generate-docx.ts          # DOCX export (uses parse-resume-lines)
│   ├── generate-pdf.ts           # PDF export (uses parse-resume-lines)
│   ├── generate-markdown.ts      # Markdown export
│   ├── generate-cover-letter.ts  # Cover letter Claude call
│   ├── extract-text.ts           # PDF/DOCX text extraction
│   ├── s3.ts                     # S3 presign + get
│   ├── get-user-plan.ts          # React cache()-memoized plan lookup
│   └── posthog.ts                # Analytics event capture
├── types/
│   └── index.ts                  # All Zod schemas + shared TS types
├── prisma/
│   └── schema.prisma             # DB schema
└── __tests__/                    # Vitest tests
```

---

## Data Flow — Resume Tailoring

1. **User fills TailorForm** (`components/tailoring/tailor-form.tsx`)
   - Selects intensity (conservative / moderate / aggressive)
   - Selects variation count (1-3, plan-gated)
   - Optionally adds custom instructions (starter+ only)

2. **POST /api/tailor** (`app/api/tailor/route.ts`)
   - `requireAuth()` → `parseBody(req, tailorResumeSchema)` → plan gate → ownership check
   - Calls `tailorResume()` N times in parallel (one per variation)
   - Creates N `TailoredResume` records with a shared `variationGroup` UUID

3. **`tailorResume()`** (`lib/tailor-resume.ts`)
   - Constructs a system prompt with the base resume, job description, and intensity instructions
   - Calls Claude (Anthropic SDK) with `claude-sonnet-4-6`
   - Returns `{ tailoredText, tokensUsed }`

4. **Redirect to tailored page** (`/dashboard/tailored/[tailoredId]`)
   - Fetches the record + siblings (variation group)
   - Renders `VariationTabs` (multi-variation) or inline view (single)
   - Computes `KeywordMatchCard` scores via `computeKeywordMatch()`

---

## Auth & Role System

**Strategy:** JWT (stateless, no DB sessions)

**Provider:** Google OAuth only

**Session shape** (populated in `auth.ts` callbacks):
```ts
session.user = {
  id: string,       // prisma User.id (cuid)
  email: string,
  name: string,
  image: string,
  role: "user" | "admin",
  plan: "free" | "starter" | "pro",
}
```

**Whitelist:** On first sign-in, `signIn` callback creates the user if their email is in `WHITELISTED_EMAILS` env var. All other accounts are rejected.

**Patterns:**
- `requireAdmin()` — redirects from server components if not admin
- `assertAdmin()` — returns `{ error: NextResponse }` from API routes if not admin
- `requireAuth()` — returns `{ error: NextResponse }` from API routes if not authenticated

---

## Plan Gating

Plans are defined in `lib/plan.ts`:

| Plan | Price | Variations | Downloads | Markdown | PDF | Instructions |
|------|-------|-----------|-----------|----------|-----|-------------|
| free | $0 | 1 | ✗ (copy only) | ✗ | ✗ | ✗ |
| starter | $9.99/mo | 2 | ✓ (docx) | ✓ | ✗ | ✓ |
| pro | $19.99/mo | 3 | ✓ (docx) | ✓ | ✓ | ✓ |

**Gate locations:**
- **API routes** — always the authoritative check (e.g. `/api/tailor`, `/api/tailored/[id]/download`)
- **UI** — mirrors API to avoid showing inaccessible actions (e.g. `DownloadMenu` vs `CopyButton`)

`getUserPlan(userId)` is wrapped with React `cache()` so it's fetched at most once per request even if called from multiple places.

---

## Server vs Client Component Decisions

**Server components** (default):
- Pages that fetch from DB (`app/dashboard/**`)
- Layouts
- Read-only display components

**Client components** (`"use client"`):
- Anything with `useState`, `useRouter`, `usePathname`
- Form components (`TailorForm`, `IntensitySelector`, `VariationsSelector`, `InstructionsField`)
- Interactive UI (`CopyButton`, `TailoredDeleteButton`, `CoverLetterSection`)
- Navigation (`AppSidebar`)

The pattern: server page fetches data and passes it as props to client components.

---

## API Route Conventions

Every API route follows this order:

```
requireAuth() / assertAdmin()
    ↓
parseBody(req, schema)        [if applicable]
    ↓
ownership check               [verify userId matches record]
    ↓
plan gate                     [check canDownload(plan), etc.]
    ↓
business logic + DB write
    ↓
captureEvent()                [PostHog analytics]
    ↓
return NextResponse.json(...)
```

Admin routes use `assertAdmin()` (which also checks role) instead of `requireAuth()`. The `adminUserPatchSchema` schema is defined in `types/index.ts` and imported in the route.

---

## Key Lib Files

| File | What it does |
|------|-------------|
| `auth.ts` | NextAuth config — Google provider, JWT callbacks, whitelist check, user creation |
| `prisma.ts` | Prisma client singleton (avoids hot-reload connection leak) |
| `plan.ts` | Plan constants and `canX()` predicate functions |
| `route-helpers.ts` | `requireAuth()` + `parseBody<T>()` — reduces auth boilerplate |
| `admin.ts` | `requireAdmin()` (redirect) + `assertAdmin()` (API response) |
| `tailor-resume.ts` | Builds Claude prompt, calls Anthropic API, returns tailored text |
| `keyword-match.ts` | Extracts unigrams + bigrams from JD, scores against tailored text |
| `ats-warnings.ts` | Heuristic checks for ATS-hostile formatting (tables, fancy bullets, etc.) |
| `parse-resume-lines.ts` | Classifies resume lines as header/bullet/text/empty — shared by DOCX and PDF exporters |
| `generate-docx.ts` | Builds `.docx` via `docx` library |
| `generate-pdf.ts` | Builds `.pdf` via `@react-pdf/renderer` |
| `extract-text.ts` | Extracts raw text from uploaded PDF/DOCX via S3 |
| `s3.ts` | Presigned PUT URL generation + object retrieval |
| `get-user-plan.ts` | `getUserPlan(userId)` wrapped in React `cache()` |
| `posthog.ts` | Server-side PostHog event capture |

---

## Database Schema

**User**
```
id            cuid (PK)
email         unique
name, image
role          "user" | "admin"
plan          "free" | "starter" | "pro"
marketingConsent  boolean
createdAt
```

**Resume**
```
id            cuid (PK)
userId        FK → User
title         string
rawText       string (extracted from PDF/DOCX or pasted)
s3Key         string? (if uploaded)
fileType      "pdf" | "docx" | null
createdAt, updatedAt
```

**TailoredResume**
```
id              cuid (PK)
userId          FK → User
resumeId        FK → Resume
jobTitle        string
company         string?
jobDescription  string
intensity       "conservative" | "moderate" | "aggressive"
tailoredText    string (Claude output)
tokensUsed      int?
userInstructions  string?
variationGroup  string? (UUID shared by siblings)
variationIndex  int (0-based position within group)
coverLetterText       string? (generated on demand)
coverLetterTokensUsed int?
createdAt
```

Variations: when `variations > 1`, all records share the same `variationGroup` UUID and are ordered by `variationIndex`.

---

## Testing Approach

**Vitest** — unit tests and API route handler tests in `__tests__/`

```sh
pnpm --filter shortlist test          # run all (should be 209 passing)
pnpm --filter shortlist test:watch    # watch mode
```

API tests mock `auth`, `prisma`, and `getUserPlan` with `vi.mock()`. Each test file covers one route file. Auth is mocked to return a test session; DB calls use `mockResolvedValue`.

**Playwright** — e2e tests (if configured) would go in `e2e/`.
