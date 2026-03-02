-- AlterTable: add plan to User
ALTER TABLE "User" ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'free';

-- AlterTable: add variation fields to TailoredResume
ALTER TABLE "TailoredResume" ADD COLUMN "variationGroup" TEXT;
ALTER TABLE "TailoredResume" ADD COLUMN "variationIndex" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "TailoredResume" ADD COLUMN "userInstructions" TEXT;
