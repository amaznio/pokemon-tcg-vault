import type { Prisma } from '@prisma/client';

export const isFresh = (expiresAt: Date): boolean => expiresAt.getTime() > Date.now();

export const mapCardUpsertInput = (rawCard: any, ttlSeconds: number): Prisma.CardUncheckedCreateInput => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

  return {
    id: rawCard.id,
    name: rawCard.name ?? '',
    supertype: rawCard.supertype ?? null,
    subtypes: Array.isArray(rawCard.subtypes) ? rawCard.subtypes : [],
    hp: rawCard.hp ?? null,
    types: Array.isArray(rawCard.types) ? rawCard.types : [],
    setId: rawCard.set?.id ?? '',
    setName: rawCard.set?.name ?? '',
    rarity: rawCard.rarity ?? null,
    imageSmall: rawCard.images?.small ?? null,
    imageLarge: rawCard.images?.large ?? null,
    raw: (rawCard ?? {}) as Prisma.InputJsonValue,
    fetchedAt: now,
    expiresAt,
  };
};

export const mapSetUpsertInput = (rawSet: any, ttlSeconds: number): Prisma.SetUncheckedCreateInput => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

  return {
    id: rawSet.id,
    name: rawSet.name ?? '',
    series: rawSet.series ?? null,
    releaseDate: rawSet.releaseDate ?? null,
    total: rawSet.total ?? null,
    printedTotal: rawSet.printedTotal ?? null,
    logo: rawSet.images?.logo ?? null,
    symbol: rawSet.images?.symbol ?? null,
    raw: (rawSet ?? {}) as Prisma.InputJsonValue,
    fetchedAt: now,
    expiresAt,
  };
};