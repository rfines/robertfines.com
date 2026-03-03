# Lead Capture & Waitlist System — Implementation Plan

## Overview

Build a lead capture system that lets the general public express interest in Retold while the app remains in closed beta. Captures email, name, and referral source from two touchpoints (landing page + AccessDenied fallback), stores entries in Postgres, integrates Resend for transactional email, and provides an admin page for composing and sending email campaigns to the waitlist.

## Current State Analysis

- **Beta gate**: `ALLOWED_EMAILS` env var parsed in `lib/auth.ts:10-12`, checked via `isEmailAllowed()` in `lib/auth-helpers.ts:7-12`. Empty list = open signup, populated = closed beta. Currently 5 whitelisted emails.
- **Landing page**: Full marketing page at `app/page.tsx` with hero, features, pricing, CTAs — all CTAs point to `/auth/signin`.
- **AccessDenied UX**: `app/auth/signin/signin-client.tsx:48-49` shows "Access denied. Contact the administrator to request access." Dead end — no capture.
- **Email infrastructure**: None. No email packages, no templates, no send functions.
- **Database**: No lead/waitlist/subscriber tables. `User.marketingConsent` exists but only for authenticated beta users.
- **Admin panel**: Exists at `/admin` with layout, nav, stats, users, and keyword-noise pages. Pattern: server components with server actions and `revalidatePath()`.

### Key Discoveries:
- `lib/route-helpers.ts` provides `requireAuth()` and `parseBody()` helpers for API routes
- `types/index.ts` centralizes all Zod schemas with exported inferred types
- Forms use client components with `fetch()` to API routes (no react-hook-form)
- Admin forms use server actions with `FormData` and `revalidatePath()`
- Toast system available via `useToast()` for client-side feedback

## Desired End State

1. Visitors can submit their email + name + source on the landing page without signing in
2. Non-whitelisted users who get denied at sign-in see a waitlist form instead of a dead end
3. Submitting the form sends a confirmation email via Resend
4. All entries are stored in a `WaitlistEntry` Prisma model with deduplication on email
5. An admin page at `/admin/waitlist` shows all entries with stats and lets the admin compose + send email campaigns
6. PostHog events track waitlist submissions for analytics

### How to verify:
- Visit the landing page, submit interest form, receive confirmation email, see entry in DB
- Sign in with a non-whitelisted email, see waitlist form on AccessDenied, submit, receive email
- Open `/admin/waitlist`, see entries, compose a campaign, send to all or filtered entries

## What We're NOT Doing

- No double opt-in flow (single submission is sufficient for a waitlist)
- No email template builder — campaigns use a simple plaintext + subject admin form
- No unsubscribe management beyond a one-click unsubscribe link in emails
- No automated drip sequences or scheduled sends
- No GDPR consent checkboxes (the form itself is explicit opt-in intent)
- No invite flow (promoting waitlist entries to beta users is a separate feature)

## Implementation Approach

Four phases, each independently testable:
1. **Database + API**: Schema, validation, API route for public submissions
2. **Public UI**: Landing page form + AccessDenied waitlist form
3. **Email integration**: Resend setup, confirmation email on signup
4. **Admin campaign page**: View entries, compose, send bulk email

---

## Phase 1: Database Model + API Route

### Overview
Add the `WaitlistEntry` Prisma model, create the Zod schema, and build a public API route that accepts submissions without authentication.

### Changes Required:

#### 1. Prisma Schema
**File**: `prisma/schema.prisma`
**Changes**: Add `WaitlistEntry` model after the existing `TermFeedback` model

```prisma
model WaitlistEntry {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  source    String?
  createdAt DateTime @default(now())

  @@index([createdAt])
}
```

#### 2. Zod Validation Schema
**File**: `types/index.ts`
**Changes**: Add waitlist schema and exported type at the end of existing schemas

```typescript
export const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().max(100).optional(),
  source: z.string().max(100).optional(),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
```

#### 3. Public API Route
**File**: `app/api/waitlist/route.ts` (new file)
**Changes**: POST endpoint — no auth required, validates with Zod, upserts to avoid duplicates, fires PostHog event

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { waitlistSchema } from "@/types";
import { captureEvent } from "@/lib/posthog";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, name, source } = parsed.data;

  const entry = await prisma.waitlistEntry.upsert({
    where: { email: email.toLowerCase() },
    create: {
      email: email.toLowerCase(),
      name: name?.trim() || null,
      source: source?.trim() || null,
    },
    update: {},
  });

  captureEvent(entry.id, "waitlist_signup", {
    email: entry.email,
    source: entry.source ?? "direct",
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
```

Note: `parseBody()` from `route-helpers.ts` is not used here because this endpoint is public (no `requireAuth()`). We inline the validation to keep it simple.

#### 4. Run Migration
```bash
pnpm prisma migrate dev --name add-waitlist-entry
```

### Success Criteria:

#### Automated Verification:
- [x] Migration runs cleanly: `pnpm prisma migrate dev`
- [x] Type checking passes: `pnpm typecheck`
- [x] Linting passes: `pnpm lint`
- [x] Build succeeds: `pnpm build`

#### Manual Verification:
- [ ] POST to `/api/waitlist` with `{ "email": "test@example.com", "name": "Test", "source": "landing" }` returns 201
- [ ] Duplicate email submission returns 201 without creating a second row
- [ ] Invalid email returns 400 with validation error
- [ ] Entry appears in the database via Prisma Studio

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to Phase 2.

---

## Phase 2: Public-Facing Waitlist Forms

### Overview
Add two UI touchpoints for lead capture: an inline form on the landing page and a waitlist form that appears when a non-whitelisted user gets AccessDenied.

### Changes Required:

#### 1. Waitlist Form Component
**File**: `components/shared/waitlist-form.tsx` (new file)
**Changes**: Reusable client component used on both the landing page and the AccessDenied page. Accepts an optional `source` prop to track where the submission came from.

```typescript
"use client";

import { useState } from "react";

interface WaitlistFormProps {
  source: string;
  compact?: boolean;
}

export function WaitlistForm({ source, compact }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          source,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.fieldErrors?.email?.[0] ?? "Something went wrong");
      }

      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center py-4">
        <p className="text-sm font-medium text-foreground">You're on the list!</p>
        <p className="text-xs text-muted mt-1">We'll reach out when spots open up.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "flex flex-col gap-3" : "space-y-4"}>
      {/* ... inputs for email (required), name (optional), submit button */}
      {/* Error display inline with text-destructive */}
    </form>
  );
}
```

Full implementation will include the `<input>` elements styled to match existing patterns (see `app/admin/keyword-noise/page.tsx:169-174` for input styling), a submit button matching the accent CTA style, and the success/error states.

#### 2. Landing Page — Interest Section
**File**: `app/page.tsx`
**Changes**: Add a waitlist section between the Pricing section and the bottom CTA section (approximately line 370). Wrapped in `RevealOnScroll` for consistency.

```tsx
{/* Waitlist / Early Access */}
<RevealOnScroll>
  <section className="border-t border-border">
    <div className="max-w-lg mx-auto px-6 py-24 text-center">
      <h2 className="text-3xl font-bold mb-4">Get early access</h2>
      <p className="text-muted mb-8">
        Retold is currently in private beta. Drop your email and we'll let you know when spots open up.
      </p>
      <WaitlistForm source="landing" />
    </div>
  </section>
</RevealOnScroll>
```

Also add a "Join waitlist" anchor link in the navbar alongside Features and Pricing.

#### 3. AccessDenied Waitlist Fallback
**File**: `app/auth/signin/signin-client.tsx`
**Changes**: Replace the dead-end AccessDenied error message (lines 48-49) with the waitlist form. When `error === "AccessDenied"`, show the `WaitlistForm` with `source="access-denied"` instead of just text.

```tsx
{error === "AccessDenied" ? (
  <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
    <div className="text-center">
      <p className="text-sm font-medium text-foreground">
        Retold is in private beta
      </p>
      <p className="text-xs text-muted mt-1">
        Join the waitlist and we'll let you know when we're ready for you.
      </p>
    </div>
    <WaitlistForm source="access-denied" />
  </div>
) : error ? (
  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive text-center">
    Something went wrong. Please try again.
  </div>
) : null}
```

### Success Criteria:

#### Automated Verification:
- [ ] Type checking passes: `pnpm typecheck`
- [ ] Linting passes: `pnpm lint`
- [ ] Build succeeds: `pnpm build`

#### Manual Verification:
- [ ] Landing page shows "Get early access" section between pricing and bottom CTA
- [ ] Submitting the landing page form shows success state and creates a DB entry with `source: "landing"`
- [ ] Signing in with a non-whitelisted email shows the waitlist form instead of the old error message
- [ ] Submitting the AccessDenied form shows success state and creates a DB entry with `source: "access-denied"`
- [ ] Duplicate submissions show success without error (upsert behavior)
- [ ] Form validates email client-side (HTML5) and server-side (Zod)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to Phase 3.

---

## Phase 3: Email Integration with Resend

### Overview
Install Resend, configure the API key, and send a confirmation email when someone joins the waitlist. Also build the reusable `sendEmail()` utility that Phase 4 will use for campaigns.

### Changes Required:

#### 1. Install Resend
```bash
pnpm add resend --filter retold
```

#### 2. Email Client
**File**: `lib/email.ts` (new file)
**Changes**: Initialize Resend client and export a generic `sendEmail()` function.

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = process.env.EMAIL_FROM ?? "Retold <noreply@retold.dev>";

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set, skipping send");
    return null;
  }

  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    console.error("[email] Send failed:", error);
    throw new Error(`Email send failed: ${error.message}`);
  }

  return data;
}
```

#### 3. Confirmation Email Template
**File**: `lib/email-templates.ts` (new file)
**Changes**: Simple HTML string functions for the waitlist confirmation email. No React Email dependency — keep it minimal.

```typescript
export function waitlistConfirmationEmail(name?: string | null): {
  subject: string;
  html: string;
  text: string;
} {
  const greeting = name ? `Hi ${name}` : "Hi there";
  return {
    subject: "You're on the Retold waitlist",
    html: `...`, // Simple, clean HTML email
    text: `${greeting}, ...`, // Plain text fallback
  };
}
```

#### 4. Wire Confirmation Email into Waitlist API
**File**: `app/api/waitlist/route.ts`
**Changes**: After the upsert, send the confirmation email. Fire-and-forget (don't block the response on email delivery). Only send on `create`, not on duplicate upsert.

To detect create vs update, check if the entry's `createdAt` is within the last few seconds:

```typescript
const isNew = Date.now() - entry.createdAt.getTime() < 5000;
if (isNew) {
  sendEmail({
    to: entry.email,
    ...waitlistConfirmationEmail(entry.name),
  }).catch((err) => console.error("[waitlist] Confirmation email failed:", err));
}
```

#### 5. Environment Variables
**File**: `.env.local`
**Changes**: Add `RESEND_API_KEY` and `EMAIL_FROM`

**File**: `.env.example`
**Changes**: Document the new variables

```
# Resend (https://resend.com)
RESEND_API_KEY=
EMAIL_FROM=Retold <noreply@retold.dev>
```

### Success Criteria:

#### Automated Verification:
- [ ] Type checking passes: `pnpm typecheck`
- [ ] Linting passes: `pnpm lint`
- [ ] Build succeeds: `pnpm build`

#### Manual Verification:
- [ ] Submitting the waitlist form with a real email triggers a confirmation email via Resend
- [ ] Confirmation email arrives with correct subject and content
- [ ] Duplicate submission does NOT send a second email
- [ ] With `RESEND_API_KEY` unset, the app logs a warning but doesn't crash
- [ ] Check Resend dashboard to confirm email was sent

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to Phase 4.

---

## Phase 4: Admin Waitlist & Campaign Page

### Overview
Build an admin page at `/admin/waitlist` that shows all waitlist entries with stats and provides a form to compose and send a bulk email campaign to all (or filtered) entries.

### Changes Required:

#### 1. Admin Nav Update
**File**: `app/admin/layout.tsx`
**Changes**: Add "Waitlist" link to the nav bar (line 30, after Keyword Noise)

```tsx
<Link href="/admin/waitlist" className="hover:text-foreground transition-colors">
  Waitlist
</Link>
```

#### 2. Campaign API Route
**File**: `app/api/admin/waitlist/campaign/route.ts` (new file)
**Changes**: Admin-only POST endpoint that takes a subject + body and sends to all waitlist entries (or a filtered subset). Uses the `sendEmail()` utility from Phase 3.

```typescript
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { requireAuth, parseBody } from "@/lib/route-helpers";

const campaignSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200),
  body: z.string().min(1, "Body is required").max(5000),
});

export async function POST(req: Request) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  // Check admin role
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error: parseError } = await parseBody(req, campaignSchema);
  if (parseError) return parseError;

  const entries = await prisma.waitlistEntry.findMany({
    select: { email: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  if (entries.length === 0) {
    return NextResponse.json({ error: "No waitlist entries" }, { status: 400 });
  }

  // Send individually for personalization (name) and to avoid BCC exposure
  let sent = 0;
  let failed = 0;
  for (const entry of entries) {
    try {
      await sendEmail({
        to: entry.email,
        subject: data.subject,
        html: buildCampaignHtml(data.body, entry.name),
        text: data.body,
      });
      sent++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, total: entries.length });
}
```

The `buildCampaignHtml()` helper wraps the plaintext body in a minimal HTML layout with the Retold branding and an unsubscribe footer.

#### 3. Admin Waitlist Page (Server Component)
**File**: `app/admin/waitlist/page.tsx` (new file)
**Changes**: Server component that displays waitlist stats, the entries table, and a campaign compose form (client component).

Stats section:
- Total entries
- Entries this week
- Breakdown by source (landing vs access-denied vs other)

Entries table:
- Columns: Email, Name, Source, Joined
- Sorted by most recent first
- Simple table matching the keyword-noise page pattern

#### 4. Campaign Compose Form (Client Component)
**File**: `components/admin/campaign-form.tsx` (new file)
**Changes**: Client component with subject input, body textarea, recipient count display, and send button. Uses `fetch()` to the campaign API route. Shows confirmation dialog before sending. Displays sent/failed counts on completion.

```typescript
"use client";

import { useState } from "react";

interface CampaignFormProps {
  recipientCount: number;
}

export function CampaignForm({ recipientCount }: CampaignFormProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "confirm" | "sending" | "done" | "error">("idle");
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  // Submit flow: idle -> confirm -> sending -> done
  // User clicks "Send" -> shows confirm with recipient count -> clicks "Yes, send" -> sends
}
```

### Success Criteria:

#### Automated Verification:
- [ ] Type checking passes: `pnpm typecheck`
- [ ] Linting passes: `pnpm lint`
- [ ] Build succeeds: `pnpm build`

#### Manual Verification:
- [ ] `/admin/waitlist` page loads with stats and entries table
- [ ] "Waitlist" link appears in admin nav
- [ ] Stats show correct total, weekly, and source breakdown
- [ ] Entries table shows all waitlist entries with correct data
- [ ] Campaign form shows recipient count
- [ ] Clicking "Send" shows confirmation before sending
- [ ] Campaign sends email to all entries (verify in Resend dashboard)
- [ ] Sent/failed counts display after campaign completes
- [ ] Non-admin users cannot access the page or the campaign endpoint

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation.

---

## Testing Strategy

### Unit Tests:
- `waitlistSchema` validation (valid email, invalid email, optional fields, max lengths)
- `isEmailAllowed()` still works correctly (no regression)
- `sendEmail()` with missing API key logs warning and returns null

### Integration Tests:
- POST `/api/waitlist` — happy path, validation error, duplicate email
- POST `/api/admin/waitlist/campaign` — admin only, empty waitlist, successful send

### Manual Testing Steps:
1. Visit landing page as unauthenticated user, submit waitlist form
2. Attempt sign-in with non-whitelisted email, submit waitlist form on AccessDenied
3. Check email inbox for confirmation
4. Submit same email again — verify no duplicate, no second email
5. Open `/admin/waitlist`, verify entry appears
6. Compose and send a test campaign, verify delivery

## Performance Considerations

- Campaign sends are sequential per-entry to respect Resend rate limits (100/day on free tier). For larger lists, batch with delays.
- Waitlist API upsert is indexed on `email` (unique constraint) — fast regardless of table size.
- Landing page form is client-only — no SSR overhead for the form component.
- Confirmation email is fire-and-forget — doesn't block the API response.

## Migration Notes

- Prisma migration adds one table (`WaitlistEntry`) — no changes to existing tables.
- `RESEND_API_KEY` and `EMAIL_FROM` env vars need to be added to Railway production environment.
- Domain verification in Resend required for sending from `@retold.dev` (DNS records: SPF, DKIM, DMARC).

## References

- `lib/auth.ts:10-12` — ALLOWED_EMAILS parsing
- `lib/auth-helpers.ts:7-12` — `isEmailAllowed()` beta gate
- `app/page.tsx` — Landing page (all sections)
- `app/auth/signin/signin-client.tsx:46-52` — AccessDenied error handling
- `app/admin/layout.tsx` — Admin layout with nav
- `app/admin/keyword-noise/page.tsx` — Admin page pattern (server actions, tables, forms)
- `lib/route-helpers.ts` — `requireAuth()`, `parseBody()` helpers
- `types/index.ts` — Centralized Zod schemas
- `components/ui/toast.tsx` — Toast system for client feedback
- `lib/posthog.ts` — `captureEvent()` for analytics
- `.env.example` — Environment variable documentation pattern
