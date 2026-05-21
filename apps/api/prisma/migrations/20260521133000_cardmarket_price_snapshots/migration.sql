-- CreateTable
CREATE TABLE "CardmarketPriceGuideSnapshot" (
    "id" TEXT NOT NULL,
    "idProduct" INTEGER NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardmarketPriceGuideSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CardmarketPriceGuideSnapshot_idProduct_snapshotDate_key" ON "CardmarketPriceGuideSnapshot"("idProduct", "snapshotDate");

-- CreateIndex
CREATE INDEX "CardmarketPriceGuideSnapshot_idProduct_snapshotDate_idx" ON "CardmarketPriceGuideSnapshot"("idProduct", "snapshotDate");

-- AddForeignKey
ALTER TABLE "CardmarketPriceGuideSnapshot" ADD CONSTRAINT "CardmarketPriceGuideSnapshot_idProduct_fkey" FOREIGN KEY ("idProduct") REFERENCES "CardmarketProduct"("idProduct") ON DELETE CASCADE ON UPDATE CASCADE;
