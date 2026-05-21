-- Ensure @updatedAt owns this column value without a database-level default.
ALTER TABLE "CardmarketSetMapping" ALTER COLUMN "updatedAt" DROP DEFAULT;
