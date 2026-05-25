CREATE TYPE "CollectionKind" AS ENUM ('owned', 'favorites', 'wishlist', 'binder');
CREATE TYPE "PriceStatus" AS ENUM ('pending', 'success', 'failed', 'blocked', 'not_found', 'missing_url', 'skipped');
CREATE TYPE "PriceRefreshJobStatus" AS ENUM ('queued', 'running', 'completed', 'failed');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "supertype" TEXT,
    "subtypes" TEXT[],
    "hp" TEXT,
    "types" TEXT[],
    "setId" TEXT NOT NULL,
    "setName" TEXT NOT NULL,
    "rarity" TEXT,
    "imageSmall" TEXT,
    "imageLarge" TEXT,
    "raw" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Set" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "series" TEXT,
    "releaseDate" TEXT,
    "total" INTEGER,
    "printedTotal" INTEGER,
    "logo" TEXT,
    "symbol" TEXT,
    "raw" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Set_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CardSearchCache" (
    "id" TEXT NOT NULL,
    "queryHash" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "page" INTEGER NOT NULL,
    "pageSize" INTEGER NOT NULL,
    "orderBy" TEXT,
    "cardIds" TEXT[],
    "count" INTEGER NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CardSearchCache_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SetSearchCache" (
    "id" TEXT NOT NULL,
    "queryHash" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "page" INTEGER NOT NULL,
    "pageSize" INTEGER NOT NULL,
    "orderBy" TEXT,
    "setIds" TEXT[],
    "count" INTEGER NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SetSearchCache_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "CollectionKind" NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CollectionItem" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "condition" TEXT,
    "finish" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "notes" TEXT,
    "purchasePriceCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CardPriceSnapshot" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "pricingUrl" TEXT,
    "status" "PriceStatus" NOT NULL,
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
    "lastError" TEXT,
    "rawExtractedJson" JSONB,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CardPriceSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PriceRefreshJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "status" "PriceRefreshJobStatus" NOT NULL DEFAULT 'queued',
    "total" INTEGER NOT NULL DEFAULT 0,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "succeeded" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PriceRefreshJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PriceRefreshJobItem" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "pricingUrl" TEXT,
    "status" "PriceStatus" NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "snapshotId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PriceRefreshJobItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX "CardSearchCache_queryHash_key" ON "CardSearchCache"("queryHash");
CREATE INDEX "CardSearchCache_expiresAt_idx" ON "CardSearchCache"("expiresAt");
CREATE UNIQUE INDEX "SetSearchCache_queryHash_key" ON "SetSearchCache"("queryHash");
CREATE INDEX "SetSearchCache_expiresAt_idx" ON "SetSearchCache"("expiresAt");
CREATE INDEX "Collection_userId_kind_idx" ON "Collection"("userId", "kind");
CREATE UNIQUE INDEX "Collection_userId_kind_name_key" ON "Collection"("userId", "kind", "name");
CREATE INDEX "CollectionItem_cardId_idx" ON "CollectionItem"("cardId");
CREATE UNIQUE INDEX "CollectionItem_collectionId_cardId_key" ON "CollectionItem"("collectionId", "cardId");
CREATE INDEX "CardPriceSnapshot_cardId_fetchedAt_idx" ON "CardPriceSnapshot"("cardId", "fetchedAt");
CREATE INDEX "CardPriceSnapshot_status_idx" ON "CardPriceSnapshot"("status");
CREATE INDEX "PriceRefreshJob_userId_createdAt_idx" ON "PriceRefreshJob"("userId", "createdAt");
CREATE INDEX "PriceRefreshJob_collectionId_createdAt_idx" ON "PriceRefreshJob"("collectionId", "createdAt");
CREATE INDEX "PriceRefreshJobItem_cardId_idx" ON "PriceRefreshJobItem"("cardId");
CREATE INDEX "PriceRefreshJobItem_status_idx" ON "PriceRefreshJobItem"("status");
CREATE UNIQUE INDEX "PriceRefreshJobItem_jobId_cardId_key" ON "PriceRefreshJobItem"("jobId", "cardId");

ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CardPriceSnapshot" ADD CONSTRAINT "CardPriceSnapshot_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PriceRefreshJob" ADD CONSTRAINT "PriceRefreshJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PriceRefreshJob" ADD CONSTRAINT "PriceRefreshJob_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PriceRefreshJobItem" ADD CONSTRAINT "PriceRefreshJobItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "PriceRefreshJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PriceRefreshJobItem" ADD CONSTRAINT "PriceRefreshJobItem_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PriceRefreshJobItem" ADD CONSTRAINT "PriceRefreshJobItem_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "CardPriceSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
