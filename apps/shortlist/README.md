# Shortlist

> **Work in progress** — core features are live, more on the way.

Stop sending the same résumé to every job. Shortlist tailors your résumé to each role in seconds using Claude AI — rewriting, reordering, and reframing your experience to match the job description without fabricating a single fact.

Live at **[shortlist.robertfines.me](https://shortlist.robertfines.me)**

---

## What It Does

**Upload your résumé once.** Paste it as plain text or upload a PDF or DOCX. Shortlist stores it as your base — the source of truth you'll tailor from every time.

**Paste a job description.** Drop in the full JD from any job posting. Add the job title and company if you want them in the output.

**Get a tailored résumé in 15–30 seconds.** Claude rewrites your base résumé to match the role — mirroring keywords from the JD, surfacing your most relevant experience, and optimizing for ATS parsing. Your facts stay your facts; only the framing changes.

**Download as DOCX.** Every tailored version is saved to your dashboard and available for download as a formatted Word document, ready to submit or refine further.

---

## How to Use It

1. **Sign in** with Google (access is invite-only)
2. **Add a base résumé** — go to Résumés → New, paste your content or upload a file
3. **Tailor it** — open a résumé, hit Tailor, fill in the role and paste the JD
4. **Download** — your tailored résumé appears in the dashboard; download as DOCX anytime

You can manage multiple base résumés (e.g. one focused on backend engineering, one on leadership) and generate as many tailored versions as you need.

---

## Tech Stack

- **Next.js 16** — App Router, server components, API routes
- **Auth.js v5** — Google OAuth, JWT sessions, invite-only email allowlist
- **PostgreSQL + Prisma** — Résumé and tailoring history, hosted on Railway
- **AWS S3** — Private file storage for uploaded PDFs and DOCXs
- **Anthropic Claude** (`claude-sonnet-4-6`) — The AI tailoring engine
- **Tailwind CSS v4** — Custom dark theme distinct from the main site
- **Vitest + RTL + MSW + Playwright** — 127 tests across unit, API, component, and E2E layers

---

## Local Development

Requires Node 22+, pnpm 10+, and a `.env.local` with the variables listed in [`.env.example`](.env.example).

```bash
# From the repo root
pnpm install

# Run just this app
pnpm --filter shortlist dev
```

Open [http://localhost:3000](http://localhost:3000).

You'll need a PostgreSQL database URL, Google OAuth credentials, an AWS S3 bucket, and an Anthropic API key to run the full stack locally. See `.env.example` for the full list.

---

## Running Tests

```bash
# Unit, API integration, and component tests (no external services needed)
pnpm --filter shortlist test

# With coverage report
pnpm --filter shortlist test:coverage

# E2E tests (requires dev server running)
pnpm --filter shortlist test:e2e
```

---

## Deployment

Pushes to `main` deploy automatically via GitHub Actions → Railway. The CI pipeline runs lint, build, and the full test suite before deploying. Database migrations run as part of the build step (`prisma migrate deploy`).
