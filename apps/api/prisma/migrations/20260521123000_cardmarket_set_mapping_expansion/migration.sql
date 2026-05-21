-- AlterTable
ALTER TABLE "CardmarketSetMapping"
ADD COLUMN "cardmarketIdExpansion" INTEGER;

-- CreateIndex
CREATE INDEX "CardmarketSetMapping_cardmarketIdExpansion_idx" ON "CardmarketSetMapping"("cardmarketIdExpansion");
