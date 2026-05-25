-- CreateEnum
CREATE TYPE "CardMarketEnrichmentStatus" AS ENUM ('pending', 'success', 'failed', 'blocked', 'not_found', 'disabled');

-- CreateTable
CREATE TABLE "CardMarketEnrichment" (
  "id" TEXT NOT NULL,
  "cardId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "productName" TEXT,
  "cardNumber" TEXT,
  "rarity" TEXT,
  "printedInSet" TEXT,
  "availableItems" INTEGER,
  "fromPriceCents" INTEGER,
  "priceTrendCents" INTEGER,
  "avgSellPrice30dCents" INTEGER,
  "avgPrice7dCents" INTEGER,
  "avgPrice1dCents" INTEGER,
  "currency" TEXT,
  "status" "CardMarketEnrichmentStatus" NOT NULL DEFAULT 'pending',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "lastFetchedAt" TIMESTAMP(3),
  "nextRetryAt" TIMESTAMP(3),
  "lastError" TEXT,
  "rawExtractedJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CardMarketEnrichment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CardMarketEnrichment_cardId_key" ON "CardMarketEnrichment"("cardId");
CREATE INDEX "CardMarketEnrichment_status_idx" ON "CardMarketEnrichment"("status");
CREATE INDEX "CardMarketEnrichment_nextRetryAt_idx" ON "CardMarketEnrichment"("nextRetryAt");

-- AddForeignKey
ALTER TABLE "CardMarketEnrichment" ADD CONSTRAINT "CardMarketEnrichment_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
