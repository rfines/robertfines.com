/**
 * Single source of truth for plan feature display.
 * Used by the landing page pricing section and the dashboard billing page.
 * Update here and both pages stay in sync automatically.
 */

export type FeatureRow = {
  label: string;
  free: boolean | string;
  starter: boolean | string;
  pro: boolean | string;
  agency: boolean | string;
};

export const PLAN_FEATURES: FeatureRow[] = [
  { label: "Tailored resume variations per session", free: "1",          starter: "2",   pro: "3",         agency: "5"         },
  { label: "Monthly tailoring runs",                 free: "10",         starter: "100", pro: "Unlimited", agency: "Unlimited" },
  { label: "Keyword match score vs. job posting",    free: true,         starter: true,  pro: true,        agency: true        },
  { label: "Plain text view + one-click copy",       free: true,         starter: true,  pro: true,        agency: true        },
  { label: "DOCX download",                          free: false,        starter: true,  pro: true,        agency: true        },
  { label: "Markdown export",                        free: false,        starter: true,  pro: true,        agency: true        },
  { label: "Custom tailoring instructions",          free: false,        starter: true,  pro: true,        agency: true        },
  { label: "Before/after diff view",                 free: false,        starter: true,  pro: true,        agency: true        },
  { label: "AI cover letter generation",             free: false,        starter: true,  pro: true,        agency: true        },
  { label: "Bullet point rewriter tool",             free: false,        starter: true,  pro: true,        agency: true        },
  { label: "PDF export",                             free: false,        starter: false, pro: true,        agency: true        },
  { label: "ATS issue detection + auto-fix",         free: false,        starter: false, pro: true,        agency: true        },
  { label: "LinkedIn headline + About generator",    free: false,        starter: false, pro: true,        agency: true        },
  { label: "Label resumes by candidate name",        free: false,        starter: false, pro: false,       agency: true        },
];

/** Key selling points shown on upgrade cards and the landing page CTA area. */
export const PLAN_HIGHLIGHTS: Record<"starter" | "pro" | "agency", string[]> = {
  starter: [
    "2 tailored variations per session",
    "100 tailoring runs/month",
    "AI cover letter generation",
    "Before/after diff view",
    "Bullet point rewriter tool",
    "DOCX + Markdown export",
  ],
  pro: [
    "3 tailored variations per session",
    "Unlimited tailoring runs",
    "ATS issue detection + auto-fix",
    "LinkedIn headline + About generator",
    "PDF export",
    "Everything in Starter",
  ],
  agency: [
    "5 tailored variations per session",
    "Unlimited tailoring runs",
    "Label resumes by candidate name",
    "Everything in Pro",
  ],
};
