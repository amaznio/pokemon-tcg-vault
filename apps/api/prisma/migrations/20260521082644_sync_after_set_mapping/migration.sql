-- AlterTable (safe for shadow DB replay ordering)
ALTER TABLE IF EXISTS "CardmarketSetMapping" ALTER COLUMN "updatedAt" DROP DEFAULT;
