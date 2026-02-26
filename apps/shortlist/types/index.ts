import { z } from "zod";

export const INTENSITIES = ["conservative", "moderate", "aggressive"] as const;
export type Intensity = (typeof INTENSITIES)[number];

export const createResumeSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  rawText: z.string().min(1, "Resume text is required"),
});

export const updateResumeSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  rawText: z.string().min(1).optional(),
});

export const uploadResumeFileSchema = z.object({
  s3Key: z.string().min(1),
  fileType: z.enum(["pdf", "docx"]),
});

export const tailorResumeSchema = z.object({
  resumeId: z.string().cuid("Invalid resume ID"),
  jobTitle: z.string().min(1, "Job title is required").max(200),
  company: z.string().max(200).optional(),
  jobDescription: z.string().min(1, "Job description is required"),
  intensity: z.enum(["conservative", "moderate", "aggressive"]).default("moderate"),
  variations: z.number().int().min(1).max(5).default(1),
  userInstructions: z.string().max(500).optional(),
});

export const presignUploadSchema = z.object({
  filename: z.string().min(1),
  contentType: z.enum([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]),
});

export const extractResumeSchema = z.object({
  s3Key: z.string().min(1),
  fileType: z.enum(["pdf", "docx"]),
});

export const adminUserPatchSchema = z
  .object({
    plan: z.enum(["free", "starter", "pro"]).optional(),
    role: z.enum(["user", "admin"]).optional(),
  })
  .refine((d) => d.plan !== undefined || d.role !== undefined, {
    message: "At least one of plan or role must be provided",
  });

export const checkoutSessionSchema = z.object({
  priceId: z.string().min(1),
});

export type CreateResumeInput = z.infer<typeof createResumeSchema>;
export type UpdateResumeInput = z.infer<typeof updateResumeSchema>;
export type UploadResumeFileInput = z.infer<typeof uploadResumeFileSchema>;
export type TailorResumeInput = z.infer<typeof tailorResumeSchema>;
export type PresignUploadInput = z.infer<typeof presignUploadSchema>;
export type ExtractResumeInput = z.infer<typeof extractResumeSchema>;
export type AdminUserPatchInput = z.infer<typeof adminUserPatchSchema>;
export type CheckoutSessionInput = z.infer<typeof checkoutSessionSchema>;

// Re-exported from lib files for single-import convenience
export type { KeywordMatchResult } from "@/lib/keyword-match";
export type { AtsWarning } from "@/lib/ats-warnings";
export type { ParsedLine } from "@/lib/parse-resume-lines";
