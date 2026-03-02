-- CreateTable
CREATE TABLE "LinkedInConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "linkedInId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "cachedName" TEXT,
    "cachedHeadline" TEXT,
    "cachedPictureUrl" TEXT,
    "lastImportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkedInConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LinkedInConnection_userId_key" ON "LinkedInConnection"("userId");

-- CreateIndex
CREATE INDEX "LinkedInConnection_userId_idx" ON "LinkedInConnection"("userId");

-- AddForeignKey
ALTER TABLE "LinkedInConnection" ADD CONSTRAINT "LinkedInConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
