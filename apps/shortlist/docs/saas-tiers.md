# SaaS Tier Planning

> Planning document — no implementation decisions are final.

---

## Cost Structure

The dominant variable cost is Claude API usage. All other infrastructure (DOCX generation, S3, PostgreSQL, Railway) is negligible by comparison.

| Model | Cost per tailoring request (typical) | Cost per request (worst case) |
|---|---|---|
| claude-haiku-4-5 | ~$0.003–0.006 | ~$0.010 |
| claude-sonnet-4-6 | ~$0.025–0.060 | ~$0.075 |

Typical request assumptions: ~1,500 input tokens (system prompt + JD + base resume) + ~1,500 output tokens.

**Output format cost:**
- Plain text (display on screen, copy button): $0
- DOCX (already implemented, CPU-only via `docx` library): negligible
- PDF (not yet implemented — would require Puppeteer or `@react-pdf/renderer`): marginally more

The cheapest output for the application is plain text — no file generation, no download, just display and copy. DOCX is effectively free too, but restricting it to paid tiers creates a meaningful upgrade hook.

---

## Tier Design

### Free Trial — no credit card required, one-time per account

| Dimension | Value |
|---|---|
| Requests | **1 total** (not per month — ever) |
| Model | Haiku |
| `max_tokens` | 1,024 |
| Output | Plain text only (copy button, no download) |
| Base résumé storage | 1 |

**Goal:** Prove the concept works. The deliberately shorter output and lower model quality surface the quality gap with Sonnet, motivating conversion to a paid plan.

---

### Starter — $9/month ($72/year, ~$6/month)

| Dimension | Value |
|---|---|
| Requests | **15/month** |
| Model | Sonnet |
| `max_tokens` | 2,048 |
| Output | Plain text only |
| Base résumé storage | 3 |

**Target user:** Casual job seekers, people exploring the tool before committing, low-volume use.

**COGS estimate:** ~$0.90/month at full usage. Margin ~90%.

> **Open question:** Whether Starter uses Haiku or Sonnet. Using Haiku keeps costs lower but muddies the value proposition — paid users would still be getting a degraded experience. Using Sonnet for all paid tiers makes the upgrade message cleaner: free trial = Haiku preview, everything paid = real Sonnet quality.

---

### Pro — $19/month ($152/year, ~$12.67/month) *(target most popular)*

| Dimension | Value |
|---|---|
| Requests | **50/month** |
| Model | Sonnet |
| `max_tokens` | 4,096 |
| Output | **DOCX download** |
| Base résumé storage | 10 |

**Target user:** Active job seekers running a real campaign — applying to multiple roles per week, customizing each application.

**COGS estimate:** ~$3.00/month at full usage. Margin ~84%.

---

### Unlimited — $39/month ($312/year, ~$26/month)

| Dimension | Value |
|---|---|
| Requests | **Unlimited** |
| Model | Sonnet |
| `max_tokens` | 4,096 |
| Output | DOCX download + any future formats |
| Base résumé storage | Unlimited |

**Target user:** Power users running aggressive campaigns (20+ applications/month), people using Shortlist professionally (career coaches, recruiters tailoring on behalf of clients).

**COGS estimate:** ~$8/month at heavy usage (200 requests). Margin ~79% at heavy use, higher for typical use.

---

## Pricing Rationale

The competitive set — Jobscan ($30–50/month), Resume.io ($25–50/month), Kickresume ($20–30/month) — targets broader resume building. Shortlist is more focused, so positioning slightly below makes sense while offering a meaningfully different value prop (AI tailoring vs. templates).

The $9 → $19 → $39 ladder follows a roughly 2x step pattern. Each step should feel justified:
- **Free → Starter:** Credit card commitment, more requests, Sonnet quality
- **Starter → Pro:** DOCX download is the primary unlock — submittable file, not just screen text
- **Pro → Unlimited:** Volume. The user already knows the product works; they just need more of it

---

## What Needs to Be Built

### Data model changes
- Add `plan` enum to `User`: `free_trial | starter | pro | unlimited`
- Add `tailoringsUsedThisMonth: Int` to `User`
- Add `billingPeriodStart: DateTime` to `User`
- Add `stripeCustomerId: String?` and `stripeSubscriptionId: String?` to `User`

### API changes
- `/api/tailor` — check plan limits before calling Claude; return `402` with upgrade prompt if exceeded; select model and `max_tokens` from plan config
- `/api/tailored/[id]/download` — return `403` for free trial and Starter; include upgrade prompt in response body
- New `/api/billing/checkout` — create Stripe Checkout session for plan selection
- New `/api/billing/portal` — create Stripe Customer Portal session for plan management
- New `/api/webhooks/stripe` — handle `customer.subscription.updated`, `customer.subscription.deleted`, `checkout.session.completed`

### Background work
- Monthly usage reset — either a cron job or triggered by billing period start date check on each request

### UI changes
- Pricing page (public, pre-auth)
- Plan badge + usage meter in dashboard
- Upgrade prompts at limit (inline in the tailor form, on the download button)
- Billing settings page (link to Stripe Customer Portal)

### Configuration
- Plan config object centralizing model, max_tokens, request limit, allowed output formats per plan — single source of truth, not scattered conditionals

---

## Open Questions

1. **Starter model:** Haiku (lower cost, lower quality) or Sonnet (same as higher tiers)? Sonnet for all paid makes the value story cleaner.
2. **Annual billing:** Offer upfront annual discount (~20%)? Reduces churn, improves cash flow. Probably yes once there's a meaningful user base.
3. **Overage vs. hard limit:** At the monthly limit, hard-block with upgrade prompt, or offer pay-as-you-go overage ($X per additional request)? Hard block is simpler to implement and creates clearer upgrade pressure.
4. **Team/recruiter tier:** If career coaches or recruiters become a real segment, a separate higher-priced tier with multi-resume management per client could make sense. Not for v1.
5. **Free trial eligibility:** Tied to Google account. Abuse vector is creating multiple accounts — not worth solving until it's an actual problem.
