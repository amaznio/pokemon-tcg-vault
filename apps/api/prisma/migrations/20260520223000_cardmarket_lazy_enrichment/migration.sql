-- CreateEnum
CREATE TYPE "CardmarketEnrichmentStatus" AS ENUM ('pending', 'success', 'failed', 'rate_limited', 'forbidden');

-- AlterTable
ALTER TABLE "CardmarketProduct"
ADD COLUMN "finalUrl" TEXT,
ADD COLUMN "setSlug" TEXT,
ADD COLUMN "cardSlug" TEXT,
ADD COLUMN "parsedSetCode" TEXT,
ADD COLUMN "parsedCollectorNumber" TEXT,
ADD COLUMN "enrichedAt" TIMESTAMP(3),
ADD COLUMN "enrichmentStatus" "CardmarketEnrichmentStatus",
ADD COLUMN "enrichmentError" TEXT,
ADD COLUMN "enrichmentAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "nextRetryAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CardLink"
ADD COLUMN "matchMethod" TEXT,
ADD COLUMN "reviewedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "CardmarketProduct_enrichmentStatus_idx" ON "CardmarketProduct"("enrichmentStatus");

-- CreateIndex
CREATE INDEX "CardmarketProduct_nextRetryAt_idx" ON "CardmarketProduct"("nextRetryAt");

-- CreateIndex
CREATE INDEX "CardmarketProduct_parsedSetCode_idx" ON "CardmarketProduct"("parsedSetCode");

-- CreateIndex
CREATE INDEX "CardmarketProduct_parsedCollectorNumber_idx" ON "CardmarketProduct"("parsedCollectorNumber");
