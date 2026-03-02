ALTER TABLE "User" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "User" ADD CONSTRAINT "User_stripeSubscriptionId_key" UNIQUE ("stripeSubscriptionId");
