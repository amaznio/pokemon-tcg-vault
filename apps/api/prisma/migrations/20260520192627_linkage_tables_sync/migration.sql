-- CreateEnum
CREATE TYPE "CardLinkStatus" AS ENUM ('auto_linked', 'needs_review', 'unlinked', 'rejected');

-- CreateEnum
CREATE TYPE "CardLinkConfidenceBand" AS ENUM ('high', 'medium', 'low');

-- CreateTable
CREATE TABLE "CardmarketProduct" (
    "idProduct" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "idCategory" INTEGER,
    "categoryName" TEXT,
    "idExpansion" INTEGER,
    "idMetacard" INTEGER,
    "dateAdded" TEXT,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardmarketProduct_pkey" PRIMARY KEY ("idProduct")
);

-- CreateTable
CREATE TABLE "CardmarketPriceGuide" (
    "idProduct" INTEGER NOT NULL,
    "idCategory" INTEGER,
    "avg" DOUBLE PRECISION,
    "low" DOUBLE PRECISION,
    "trend" DOUBLE PRECISION,
    "avg1" DOUBLE PRECISION,
    "avg7" DOUBLE PRECISION,
    "avg30" DOUBLE PRECISION,
    "avgHolo" DOUBLE PRECISION,
    "lowHolo" DOUBLE PRECISION,
    "trendHolo" DOUBLE PRECISION,
    "avg1Holo" DOUBLE PRECISION,
    "avg7Holo" DOUBLE PRECISION,
    "avg30Holo" DOUBLE PRECISION,
    "raw" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardmarketPriceGuide_pkey" PRIMARY KEY ("idProduct")
);

-- CreateTable
CREATE TABLE "CardLink" (
    "id" TEXT NOT NULL,
    "idProduct" INTEGER NOT NULL,
    "cardId" TEXT,
    "status" "CardLinkStatus" NOT NULL,
    "score" DOUBLE PRECISION,
    "confidenceBand" "CardLinkConfidenceBand",
    "provenance" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardLinkHistory" (
    "id" TEXT NOT NULL,
    "cardLinkId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardLinkHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CardmarketProduct_name_idx" ON "CardmarketProduct"("name");

-- CreateIndex
CREATE INDEX "CardmarketProduct_idExpansion_idx" ON "CardmarketProduct"("idExpansion");

-- CreateIndex
CREATE INDEX "CardmarketPriceGuide_idCategory_idx" ON "CardmarketPriceGuide"("idCategory");

-- CreateIndex
CREATE UNIQUE INDEX "CardLink_idProduct_key" ON "CardLink"("idProduct");

-- CreateIndex
CREATE INDEX "CardLink_status_idx" ON "CardLink"("status");

-- CreateIndex
CREATE INDEX "CardLink_confidenceBand_idx" ON "CardLink"("confidenceBand");

-- CreateIndex
CREATE INDEX "CardLink_cardId_idx" ON "CardLink"("cardId");

-- CreateIndex
CREATE INDEX "CardLinkHistory_cardLinkId_idx" ON "CardLinkHistory"("cardLinkId");

-- AddForeignKey
ALTER TABLE "CardmarketPriceGuide" ADD CONSTRAINT "CardmarketPriceGuide_idProduct_fkey" FOREIGN KEY ("idProduct") REFERENCES "CardmarketProduct"("idProduct") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardLink" ADD CONSTRAINT "CardLink_idProduct_fkey" FOREIGN KEY ("idProduct") REFERENCES "CardmarketProduct"("idProduct") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardLink" ADD CONSTRAINT "CardLink_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardLinkHistory" ADD CONSTRAINT "CardLinkHistory_cardLinkId_fkey" FOREIGN KEY ("cardLinkId") REFERENCES "CardLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
