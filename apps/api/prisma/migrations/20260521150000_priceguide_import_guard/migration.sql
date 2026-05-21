-- CreateTable
CREATE TABLE "CardmarketPriceGuideImport" (
  "id" TEXT NOT NULL,
  "sourceCreatedAt" TIMESTAMP(3) NOT NULL,
  "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "guideCount" INTEGER NOT NULL,
  CONSTRAINT "CardmarketPriceGuideImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CardmarketPriceGuideImport_sourceCreatedAt_key" ON "CardmarketPriceGuideImport"("sourceCreatedAt");
