-- CreateTable
CREATE TABLE "RateLimitEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "windowKey" INTEGER NOT NULL,

    CONSTRAINT "RateLimitEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RateLimitEntry_userId_action_windowKey_idx" ON "RateLimitEntry"("userId", "action", "windowKey");

-- CreateIndex
CREATE INDEX "RateLimitEntry_action_windowKey_idx" ON "RateLimitEntry"("action", "windowKey");
