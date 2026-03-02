-- Add gapAnalysis cache column to TailoredResume
-- Stores JSON-encoded GapAnalysisResult; null until the user requests gap analysis

ALTER TABLE "TailoredResume" ADD COLUMN "gapAnalysis" TEXT;
