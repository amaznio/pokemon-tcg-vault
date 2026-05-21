import type { CardDetail, CardSummary, PaginatedResponse, SetDetail, SetSummary } from '@repo/shared';
import type { Card, Set } from '@prisma/client';

export const toCardSummary = (card: Card): CardSummary => ({
  id: card.id,
  name: card.name,
  supertype: card.supertype,
  subtypes: card.subtypes,
  hp: card.hp,
  types: card.types,
  setId: card.setId,
  setName: card.setName,
  rarity: card.rarity,
  imageSmall: card.imageSmall,
  imageLarge: card.imageLarge,
  updatedAt: card.updatedAt.toISOString(),
});

export const toCardDetail = (
  card: Card,
  cardmarket?: CardDetail['cardmarket'],
): CardDetail => ({
  ...toCardSummary(card),
  raw: card.raw,
  ...(cardmarket ? { cardmarket } : {}),
});

export const toSetSummary = (set: Set): SetSummary => ({
  id: set.id,
  name: set.name,
  series: set.series,
  releaseDate: set.releaseDate,
  total: set.total,
  printedTotal: set.printedTotal,
  logo: set.logo,
  symbol: set.symbol,
  updatedAt: set.updatedAt.toISOString(),
});

export const toSetDetail = (set: Set): SetDetail => ({ ...toSetSummary(set), raw: set.raw });

export const paginated = <T>(
  data: T[],
  page: number,
  pageSize: number,
  count: number,
  totalCount: number,
  stale?: boolean,
): PaginatedResponse<T> => ({
  data,
  page,
  pageSize,
  count,
  totalCount,
  ...(stale === undefined ? {} : { stale }),
});
