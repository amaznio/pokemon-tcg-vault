import type { Card, Prisma } from '@prisma/client';
import { env } from '../infrastructure/env';
import { prisma } from '../infrastructure/prisma';
import { extractCardPricingWithFirecrawl } from '../infrastructure/firecrawl-client';
import { normalizeFirecrawlPriceExtraction } from '../features/pricing/pricing-normalizers';
import { getCardmarketPricingUrl, isFreshSuccessfulSnapshot, withEnglishCardmarketLanguage } from '../features/pricing/pricing-policy';
import { collectionService } from './collection-service';

const latestSnapshotForCard = (cardId: string) =>
  prisma.cardPriceSnapshot.findFirst({
    where: { cardId },
    orderBy: { fetchedAt: 'desc' },
  });

const snapshotSelect = {
  id: true,
  cardId: true,
  pricingUrl: true,
  status: true,
  productName: true,
  cardNumber: true,
  rarity: true,
  printedInSet: true,
  availableItems: true,
  fromPriceCents: true,
  priceTrendCents: true,
  avgSellPrice30dCents: true,
  avgPrice7dCents: true,
  avgPrice1dCents: true,
  currency: true,
  lastError: true,
  fetchedAt: true,
} satisfies Prisma.CardPriceSnapshotSelect;

const saveFailureSnapshot = async (card: Card, status: 'failed' | 'blocked' | 'not_found' | 'missing_url', error: string | null, pricingUrl: string | null) =>
  prisma.cardPriceSnapshot.create({
    data: {
      cardId: card.id,
      pricingUrl,
      status,
      lastError: error,
    },
  });

const refreshCard = async (card: Card) => {
  const pricingUrl = getCardmarketPricingUrl(card);
  if (!pricingUrl) {
    return saveFailureSnapshot(card, 'missing_url', 'Card has no Cardmarket URL in the Pokemon TCG payload.', null);
  }

  const result = await extractCardPricingWithFirecrawl(pricingUrl, env.PRICE_REFRESH_REQUEST_TIMEOUT_MS);
  if (!result.ok) {
    const status = result.reason === 'blocked' ? 'blocked' : result.reason === 'not_found' ? 'not_found' : 'failed';
    return saveFailureSnapshot(card, status, result.error, pricingUrl);
  }

  const normalized = normalizeFirecrawlPriceExtraction(result.data);
  return prisma.cardPriceSnapshot.create({
    data: {
      cardId: card.id,
      pricingUrl: withEnglishCardmarketLanguage(normalized.pricingUrl ?? pricingUrl),
      status: 'success',
      productName: normalized.productName,
      cardNumber: normalized.cardNumber,
      rarity: normalized.rarity,
      printedInSet: normalized.printedInSet,
      availableItems: normalized.availableItems,
      fromPriceCents: normalized.fromPriceCents,
      priceTrendCents: normalized.priceTrendCents,
      avgSellPrice30dCents: normalized.avgSellPrice30dCents,
      avgPrice7dCents: normalized.avgPrice7dCents,
      avgPrice1dCents: normalized.avgPrice1dCents,
      currency: normalized.currency,
      rawExtractedJson: result.raw as Prisma.InputJsonValue,
    },
  });
};

const processJob = async (jobId: string) => {
  const job = await prisma.priceRefreshJob.findUnique({
    where: { id: jobId },
    include: { items: { include: { card: true }, orderBy: { createdAt: 'asc' } } },
  });
  if (!job) return;

  await prisma.priceRefreshJob.update({
    where: { id: jobId },
    data: { status: 'running', startedAt: new Date() },
  });

  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  try {
    for (const item of job.items) {
      const latest = await latestSnapshotForCard(item.cardId);
      if (latest && isFreshSuccessfulSnapshot(latest, env.PRICE_REFRESH_TTL_HOURS)) {
        skipped += 1;
        processed += 1;
        await prisma.priceRefreshJobItem.update({
          where: { id: item.id },
          data: { status: 'skipped', snapshotId: latest.id, pricingUrl: latest.pricingUrl },
        });
      } else {
        const snapshot = await refreshCard(item.card);
        processed += 1;
        if (snapshot.status === 'success') succeeded += 1;
        else failed += 1;
        await prisma.priceRefreshJobItem.update({
          where: { id: item.id },
          data: {
            status: snapshot.status,
            snapshotId: snapshot.id,
            pricingUrl: snapshot.pricingUrl,
            error: snapshot.lastError,
          },
        });
      }

      await prisma.priceRefreshJob.update({
        where: { id: jobId },
        data: { processed, succeeded, failed, skipped },
      });
    }

    await prisma.priceRefreshJob.update({
      where: { id: jobId },
      data: { status: 'completed', processed, succeeded, failed, skipped, finishedAt: new Date() },
    });
  } catch (error) {
    await prisma.priceRefreshJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        processed,
        succeeded,
        failed,
        skipped,
        error: error instanceof Error ? error.message : 'Price refresh failed.',
        finishedAt: new Date(),
      },
    });
  }
};

export const pricingService = {
  async latestForCard(cardId: string) {
    return prisma.cardPriceSnapshot.findMany({
      where: { cardId },
      orderBy: { fetchedAt: 'desc' },
      take: 30,
      select: snapshotSelect,
    });
  },

  async createCollectionRefreshJob(userId: string, collectionId: string) {
    await collectionService.getOwnedCollection(userId, collectionId);
    const items = await prisma.collectionItem.findMany({
      where: { collectionId },
      include: { card: true },
      take: env.PRICE_REFRESH_MAX_CARDS_PER_JOB,
      orderBy: { createdAt: 'asc' },
    });

    const job = await prisma.priceRefreshJob.create({
      data: {
        userId,
        collectionId,
        total: items.length,
        items: {
          create: items.map((item) => ({
            cardId: item.cardId,
            pricingUrl: getCardmarketPricingUrl(item.card),
          })),
        },
      },
      include: { items: true },
    });

    void processJob(job.id);
    return job;
  },

  async getJob(userId: string, jobId: string) {
    return prisma.priceRefreshJob.findFirst({
      where: { id: jobId, userId },
      include: {
        items: {
          include: {
            card: {
              select: {
                id: true,
                name: true,
                setName: true,
                imageSmall: true,
                imageLarge: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  },
};
