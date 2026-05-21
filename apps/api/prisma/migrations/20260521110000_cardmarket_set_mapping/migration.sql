-- CreateEnum
CREATE TYPE "CardmarketSetMappingConfidence" AS ENUM ('low', 'medium', 'high');

-- CreateTable
CREATE TABLE "CardmarketSetMapping" (
  "id" TEXT NOT NULL,
  "ourSetId" TEXT NOT NULL,
  "cardmarketSetCode" TEXT,
  "cardmarketSetSlug" TEXT,
  "confidence" "CardmarketSetMappingConfidence" NOT NULL DEFAULT 'low',
  "evidenceCount" INTEGER NOT NULL DEFAULT 0,
  "conflictCount" INTEGER NOT NULL DEFAULT 0,
  "lastScore" DOUBLE PRECISION,
  "lastMatchedCardId" TEXT,
  "source" TEXT NOT NULL DEFAULT 'derived_auto',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CardmarketSetMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CardmarketSetMapping_ourSetId_key" ON "CardmarketSetMapping"("ourSetId");
CREATE INDEX "CardmarketSetMapping_cardmarketSetCode_idx" ON "CardmarketSetMapping"("cardmarketSetCode");
CREATE INDEX "CardmarketSetMapping_cardmarketSetSlug_idx" ON "CardmarketSetMapping"("cardmarketSetSlug");
CREATE INDEX "CardmarketSetMapping_confidence_idx" ON "CardmarketSetMapping"("confidence");
