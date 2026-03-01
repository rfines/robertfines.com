-- Layer 1: keyword match analytics logs (one row per tailored resume)
CREATE TABLE "KeywordMatchLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tailoredResumeId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "missingTerms" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KeywordMatchLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "KeywordMatchLog_tailoredResumeId_key" ON "KeywordMatchLog"("tailoredResumeId");
CREATE INDEX "KeywordMatchLog_createdAt_idx" ON "KeywordMatchLog"("createdAt");

-- Layer 2: admin-curated stop words
CREATE TABLE "CustomStopWord" (
    "word" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedBy" TEXT NOT NULL,
    CONSTRAINT "CustomStopWord_pkey" PRIMARY KEY ("word")
);

-- Layer 3: user feedback on irrelevant missing terms
CREATE TABLE "TermFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tailoredResumeId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TermFeedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TermFeedback_userId_tailoredResumeId_term_key" ON "TermFeedback"("userId", "tailoredResumeId", "term");
CREATE INDEX "TermFeedback_term_idx" ON "TermFeedback"("term");
