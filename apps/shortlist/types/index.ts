import { z } from "zod";

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
});

export const presignUploadSchema = z.object({
  filename: z.string().min(1),
  contentType: z.enum([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]),
});

export type CreateResumeInput = z.infer<typeof createResumeSchema>;
export type UpdateResumeInput = z.infer<typeof updateResumeSchema>;
export type UploadResumeFileInput = z.infer<typeof uploadResumeFileSchema>;
export type TailorResumeInput = z.infer<typeof tailorResumeSchema>;
export type PresignUploadInput = z.infer<typeof presignUploadSchema>;
