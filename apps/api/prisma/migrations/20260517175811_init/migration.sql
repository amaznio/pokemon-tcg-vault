-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "SetSearchCache" (
    "id" TEXT NOT NULL,
    "queryHash" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "page" INTEGER NOT NULL,
    "pageSize" INTEGER NOT NULL,
    "setIds" TEXT[],
    "count" INTEGER NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SetSearchCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CardSearchCache_queryHash_key" ON "CardSearchCache"("queryHash");

-- CreateIndex
CREATE INDEX "CardSearchCache_expiresAt_idx" ON "CardSearchCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "SetSearchCache_queryHash_key" ON "SetSearchCache"("queryHash");

-- CreateIndex
CREATE INDEX "SetSearchCache_expiresAt_idx" ON "SetSearchCache"("expiresAt");
