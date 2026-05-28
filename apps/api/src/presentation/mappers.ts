import type { CardDetail, CardPriceSnapshot, CardSummary, CollectionItem, CollectionSummary, PaginatedResponse, PriceRefreshJob, PriceRefreshJobItem, SetDetail, SetSummary } from '@repo/shared';
import type { Card, Collection, CollectionItem as DbCollectionItem, Set } from '@prisma/client';
import { mapEmbeddedCardmarketPricing } from '../features/pricing/embedded-cardmarket-pricing';

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

export const toCardDetail = (card: Card): CardDetail => ({
  ...toCardSummary(card),
  raw: card.raw,
  defaultPricing: mapEmbeddedCardmarketPricing(card.raw),
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

export const toCollectionSummary = (collection: Collection & { _count?: { items: number } }): CollectionSummary => ({
  id: collection.id,
  userId: collection.userId,
  kind: collection.kind,
  name: collection.name,
  itemCount: collection._count?.items ?? 0,
  createdAt: collection.createdAt.toISOString(),
  updatedAt: collection.updatedAt.toISOString(),
});

export const toCollectionItem = (item: DbCollectionItem & { card: Card }): CollectionItem => ({
  id: item.id,
  collectionId: item.collectionId,
  cardId: item.cardId,
  quantity: item.quantity,
  condition: item.condition,
  finish: item.finish,
  language: item.language,
  notes: item.notes,
  purchasePriceCents: item.purchasePriceCents,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
  card: toCardSummary(item.card),
});

export const toPriceSnapshot = (snapshot: {
  id: string;
  cardId: string;
  pricingUrl: string | null;
  status: CardPriceSnapshot['status'];
  productName: string | null;
  cardNumber: string | null;
  rarity: string | null;
  printedInSet: string | null;
  availableItems: number | null;
  fromPriceCents: number | null;
  priceTrendCents: number | null;
  avgSellPrice30dCents: number | null;
  avgPrice7dCents: number | null;
  avgPrice1dCents: number | null;
  currency: string | null;
  lastError: string | null;
  fetchedAt: Date;
}): CardPriceSnapshot => ({
  ...snapshot,
  fetchedAt: snapshot.fetchedAt.toISOString(),
});

export const toPriceJob = (job: any): PriceRefreshJob => ({
  id: job.id,
  userId: job.userId,
  collectionId: job.collectionId,
  status: job.status,
  total: job.total,
  processed: job.processed,
  succeeded: job.succeeded,
  failed: job.failed,
  skipped: job.skipped,
  startedAt: job.startedAt?.toISOString?.() ?? null,
  finishedAt: job.finishedAt?.toISOString?.() ?? null,
  error: job.error,
  createdAt: job.createdAt.toISOString(),
  updatedAt: job.updatedAt.toISOString(),
  ...(job.items
    ? {
        items: job.items.map((item: any): PriceRefreshJobItem => ({
          id: item.id,
          jobId: item.jobId,
          cardId: item.cardId,
          pricingUrl: item.pricingUrl,
          status: item.status,
          error: item.error,
          snapshotId: item.snapshotId,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
          ...(item.card
            ? {
                card: {
                  id: item.card.id,
                  name: item.card.name,
                  setName: item.card.setName,
                  imageSmall: item.card.imageSmall,
                  imageLarge: item.card.imageLarge,
                },
              }
            : {}),
        })),
      }
    : {}),
});

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
