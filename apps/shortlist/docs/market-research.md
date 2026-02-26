# Competitive Market Research

> Research snapshot — February 2026. Informs feature roadmap; no implementation decisions are final.

---

## Competitive Landscape

### Primary Competitors

| Product | Pricing | Key Differentiator | Weakness |
|---|---|---|---|
| **Jobscan** | $50/mo | Deep ATS keyword scoring, LinkedIn optimization | Expensive, clunky UI, no tailored text output |
| **Teal HQ** | $29/mo (free tier) | Job tracker + resume builder + cover letters bundled | PDF-only output, AI tailoring feels generic |
| **Rezi** | $29/mo | ATS formatting engine, strong bullet rewriting | Template-heavy, less flexible for custom formats |
| **Kickresume** | $8/mo | Cheapest option, templates, AI writing | Template-first, not tailoring-first |
| **Resume Worded** | $49/mo | Detailed scoring rubric, section-by-section feedback | No AI generation, just analysis/scoring |
| **Enhancv** | $25/mo | Visual resume builder, narrative-focused | Not ATS-optimized, no tailoring workflow |
| **LazyApply** | $50–100/mo | Auto-applies to jobs at scale | 1.9/5 on Trustpilot — widely hated, perceived as spam |

### Adjacent Tools (lower threat)
- **Careerflow** — Chrome extension, LinkedIn-focused
- **Resume Matcher** — Open-source keyword gap tool, no AI generation
- **SkillSyncer** — Basic keyword matching, no output
- **Huntr** — Job tracker with light resume features
- **Wobo** — Resume builder, no tailoring focus

---

## Shortlist's Current Positioning

Shortlist occupies a defensible niche: **tailoring-first, ATS-optimized, plain-text AI output from a master resume**. The workflow (one base résumé → many tailored versions) is cleaner than template-focused competitors. Claude Sonnet quality is meaningfully better than GPT-3.5-era models most competitors use. DOCX download is a real differentiator — most competitors are PDF-only or web-only.

**Gap vs. competitors:** No keyword scoring/gap analysis, no cover letter generation, no version history, no JD URL import, no ATS formatting checker.

---

## Feature Recommendations

Prioritized by implementation effort vs. user/conversion impact.

| # | Feature | Effort | Impact | Notes |
|---|---|---|---|---|
| 1 | **Keyword Gap / Match Score** | Low | Very High | Show which JD keywords appear/missing in tailored output. Pure text analysis — no AI call, no external dep. Visible proof of value. |
| 2 | **Cover Letter Generation** | Low | Very High | Same prompt pattern as resume tailoring. Reuse existing Claude call infrastructure. Single biggest "we do that too" unlock. |
| 3 | **Tailoring History / Version Log** | Low | High | Already stored in DB. Surface as a timeline view on each base resume — "tailored 6x, last for [company]". Drives retention. |
| 4 | **Before / After Diff View** | Low–Med | High | Side-by-side diff of base vs. tailored. Shows the AI's work visually. Reinforces quality and encourages iterating. |
| 5 | **ATS Formatting Warnings** | Very Low | Med–High | Flag known ATS hazards: tables, text boxes, special characters, columns. Static rules, no AI needed. Credibility booster. |
| 6 | **Bullet Point Rewriter** | Low | High | Standalone tool: paste a weak bullet → get 3 improved versions. Drives standalone engagement, shareable moment. |
| 7 | **Tailoring Intensity Selector** | Very Low | Med–High | Slider: Conservative → Moderate → Aggressive. Maps to prompt instruction variation. Zero infrastructure cost. |
| 8 | **JD URL Scraper** | Low–Med | High | Paste a job posting URL → scrape JD text automatically. Removes manual copy/paste friction. Requires server-side scraping (Cheerio or similar). |

---

## Strategic Notes

### Cover letter ROI
Cover letter generation is the single highest-leverage addition. Users who need a tailored résumé almost always need a cover letter too. It can be offered as a natural next step in the post-tailoring flow ("Now generate a cover letter for this role") with no new UI pages required — just a new modal and a parallel Claude call.

### Keyword score as conversion proof
A keyword match score displayed on the tailored résumé page (e.g., "83% keyword match — up from 41% on your base") is visceral proof-of-value. It directly addresses the question "did the AI actually do anything?" and creates a screenshot-able moment users share. Jobscan charges $50/month largely for this feature — it's technically trivial (string matching against extracted JD terms).

### Tailoring history as retention
Version history is the stickiest feature that requires zero AI usage. Once a user has 10+ tailored résumés for different companies in their account, they will not leave — the data lock-in is real. Surfacing this prominently on the dashboard ("Your tailoring history") should be high priority for retention even before acquisition.

### DOCX as a genuine moat
Most competitors output PDFs or web previews. DOCX lets users refine in Word, which is what recruiters and career coaches actually use. Keeping DOCX as a Pro+ unlock is correct; it's the tangible deliverable that justifies the upgrade.

### LazyApply gap
LazyApply's 1.9/5 reputation reflects a real user sentiment: spray-and-pray is harmful to a job search. Shortlist's explicit positioning ("tailored, not spammed") is a meaningful counter-narrative. Lean into this in marketing copy.

### Pricing positioning
Current competitive set clusters at $25–50/month. Shortlist's $9/$19/$39 ladder sits below the main players while delivering better AI quality. This is a strong launch position — room to raise prices once there's a user base and testimonials. Don't compete on price forever; compete on tailoring quality.

---

## Recommended v1 SaaS Launch Features (in order)

1. Keyword match score on tailored résumé view
2. Cover letter generation as a post-tailoring step
3. Tailoring history view on base résumé pages
4. Tailoring intensity selector in the tailor form
5. ATS formatting warnings (static rules only)

Features 6–8 (diff view, bullet rewriter, JD URL scraper) are strong v2 additions once the core SaaS tier mechanics are proven.
