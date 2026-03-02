import type { Plan } from "@/lib/plan";

export type FeatureId =
  | "download"
  | "export-markdown"
  | "export-pdf"
  | "view-diff"
  | "cover-letter"
  | "bullet-rewriter"
  | "linkedin-optimizer"
  | "fix-ats-issues"
  | "custom-instructions"
  | "gap-analysis"
  | "monthly-limit";

export interface FeatureMeta {
  name: string;
  valueProp: string;
  requiredPlan: Exclude<Plan, "free">;
}

export const UPGRADE_FEATURES: Record<FeatureId, FeatureMeta> = {
  download: {
    name: "File Downloads",
    valueProp:
      "Download your tailored resume as a polished Word document, ready to submit to any application.",
    requiredPlan: "starter",
  },
  "export-markdown": {
    name: "Markdown Export",
    valueProp:
      "Export your resume as Markdown for GitHub profiles, portfolios, or developer sites.",
    requiredPlan: "starter",
  },
  "export-pdf": {
    name: "PDF Export",
    valueProp:
      "Get a professionally styled PDF of your tailored resume, ready to attach to any application.",
    requiredPlan: "pro",
  },
  "view-diff": {
    name: "Before/After Diff View",
    valueProp:
      "See exactly what the AI changed — additions in green, removals in red. Full transparency into every edit.",
    requiredPlan: "starter",
  },
  "cover-letter": {
    name: "AI Cover Letter",
    valueProp:
      "Generate a tailored cover letter matched to this specific job — in seconds.",
    requiredPlan: "starter",
  },
  "bullet-rewriter": {
    name: "Bullet Point Rewriter",
    valueProp:
      "Get three AI-powered rewrites for any bullet — stronger verbs, better specificity, more impact.",
    requiredPlan: "starter",
  },
  "linkedin-optimizer": {
    name: "LinkedIn Optimizer",
    valueProp:
      "Generate a compelling LinkedIn headline and About section tailored to your resume and target role.",
    requiredPlan: "pro",
  },
  "fix-ats-issues": {
    name: "ATS Issue Auto-Fix",
    valueProp:
      "Automatically fix formatting issues that ATS systems struggle to parse — tables, fancy bullets, separators, and more.",
    requiredPlan: "pro",
  },
  "custom-instructions": {
    name: "Custom Tailoring Instructions",
    valueProp:
      "Guide the AI with specific instructions like \"Emphasize leadership\" or \"Highlight Python skills\" for more targeted results.",
    requiredPlan: "starter",
  },
  "gap-analysis": {
    name: "Gap Analysis",
    valueProp:
      "AI-powered analysis of what's missing from your resume — with specific, actionable suggestions for each gap.",
    requiredPlan: "starter",
  },
  "monthly-limit": {
    name: "More Tailoring Runs",
    valueProp:
      "You've used all your free tailoring runs this month. Upgrade for more runs — or go unlimited with Pro.",
    requiredPlan: "starter",
  },
};
