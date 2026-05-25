import type { Card } from '@prisma/client';
import { env } from '../../infrastructure/env';
import { prisma } from '../../infrastructure/prisma';
import { extractCardmarketProductWithFirecrawl } from '../../infrastructure/firecrawl-client';
import { normalizeCardmarketExtraction } from './cardmarket-normalizers';
import { getCardmarketUrl, shouldEnrichCardmarket, withEnglishCardmarketLanguage } from './cardmarket-enrichment-policy';

const db = prisma as any;

export type CardmarketEnrichmentPublicStatus = 'pending' | 'success' | 'failed' | 'blocked' | 'not_found' | 'disabled' | 'missing';

export type CardmarketEnrichmentView = {
  status: CardmarketEnrichmentPublicStatus;
  url: string | null;
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
  attemptCount: number;
  fetchedAt: string | null;
  updatedAt: string | null;
};

const runningCards = new Set<string>();
const logPrefix = '[cardmarket.firecrawl]';

const nowPlusHours = (hours: number): Date => new Date(Date.now() + hours * 60 * 60 * 1000);

const decideShouldEnrich = (card: Card, enrichment: any | null) =>
  shouldEnrichCardmarket(card, enrichment, {
    enabled: env.CARDMARKET_ENRICHMENT_ENABLED,
    ttlHours: env.CARDMARKET_ENRICHMENT_TTL_HOURS,
    maxAttempts: env.CARDMARKET_ENRICHMENT_MAX_ATTEMPTS,
    now: new Date(),
  });

const toView = (enrichment: any | null, card: Card): CardmarketEnrichmentView => {
  if (!env.CARDMARKET_ENRICHMENT_ENABLED) {
    return {
      status: 'disabled',
      url: getCardmarketUrl(card),
      productName: null,
      cardNumber: null,
      rarity: null,
      printedInSet: null,
      availableItems: null,
      fromPriceCents: null,
      priceTrendCents: null,
      avgSellPrice30dCents: null,
      avgPrice7dCents: null,
      avgPrice1dCents: null,
      currency: null,
      attemptCount: enrichment?.attemptCount ?? 0,
      fetchedAt: enrichment?.lastFetchedAt?.toISOString() ?? null,
      updatedAt: enrichment?.updatedAt?.toISOString() ?? null,
    };
  }

  if (!enrichment) {
    return {
      status: 'missing',
      url: getCardmarketUrl(card),
      productName: null,
      cardNumber: null,
      rarity: null,
      printedInSet: null,
      availableItems: null,
      fromPriceCents: null,
      priceTrendCents: null,
      avgSellPrice30dCents: null,
      avgPrice7dCents: null,
      avgPrice1dCents: null,
      currency: null,
      attemptCount: 0,
      fetchedAt: null,
      updatedAt: null,
    };
  }

  return {
    status: enrichment.status,
    url: withEnglishCardmarketLanguage(enrichment.url),
    productName: enrichment.productName,
    cardNumber: enrichment.cardNumber,
    rarity: enrichment.rarity,
    printedInSet: enrichment.printedInSet,
    availableItems: enrichment.availableItems,
    fromPriceCents: enrichment.fromPriceCents,
    priceTrendCents: enrichment.priceTrendCents,
    avgSellPrice30dCents: enrichment.avgSellPrice30dCents,
    avgPrice7dCents: enrichment.avgPrice7dCents,
    avgPrice1dCents: enrichment.avgPrice1dCents,
    currency: enrichment.currency,
    attemptCount: enrichment.attemptCount,
    fetchedAt: enrichment.lastFetchedAt?.toISOString() ?? null,
    updatedAt: enrichment.updatedAt?.toISOString() ?? null,
  };
};

const markDisabledIfNeeded = async (cardId: string, url: string | null) => {
  if (!url) return;
  console.info(`${logPrefix} mark-disabled`, { cardId, url });
  await db.cardMarketEnrichment.upsert({
    where: { cardId },
    create: {
      cardId,
      url,
      status: 'disabled',
    },
    update: {
      url,
      status: 'disabled',
      lastError: null,
      nextRetryAt: null,
    },
  });
};

export const enrichCardmarketForCard = async (cardId: string): Promise<void> => {
  if (runningCards.has(cardId)) {
    console.info(`${logPrefix} skip-already-running`, { cardId });
    return;
  }
  console.info(`${logPrefix} start`, { cardId });
  runningCards.add(cardId);

  try {
    const card = await db.card.findUnique({ where: { id: cardId } });
    if (!card) {
      console.warn(`${logPrefix} card-not-found`, { cardId });
      return;
    }

    const existing = await db.cardMarketEnrichment.findUnique({ where: { cardId } });
    const decision = decideShouldEnrich(card, existing);
    console.info(`${logPrefix} decision`, {
      cardId,
      shouldRun: decision.shouldRun,
      reason: decision.reason,
      url: decision.url,
      existingStatus: existing?.status ?? null,
      existingAttemptCount: existing?.attemptCount ?? 0,
      existingNextRetryAt: existing?.nextRetryAt?.toISOString?.() ?? null,
    });
    if (!decision.shouldRun || !decision.url) {
      if (decision.reason === 'disabled') {
        await markDisabledIfNeeded(cardId, getCardmarketUrl(card));
      }
      console.info(`${logPrefix} skip`, { cardId, reason: decision.reason });
      return;
    }

    const now = new Date();

    if (!existing) {
      try {
        console.info(`${logPrefix} lock-create-pending`, { cardId, url: decision.url });
        await db.cardMarketEnrichment.create({
          data: {
            cardId,
            url: decision.url,
            status: 'pending',
            lastError: null,
          },
        });
      } catch {
        console.info(`${logPrefix} lock-create-conflict-skip`, { cardId });
        return;
      }
    } else {
      console.info(`${logPrefix} lock-update-pending-attempt`, {
        cardId,
        existingStatus: existing.status,
        existingAttemptCount: existing.attemptCount,
      });
      const lockResult = await db.cardMarketEnrichment.updateMany({
        where: {
          cardId,
          status: { not: 'pending' },
          OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
          NOT: { attemptCount: { gte: env.CARDMARKET_ENRICHMENT_MAX_ATTEMPTS } },
        },
        data: {
          status: 'pending',
          url: decision.url,
          lastError: null,
        },
      });

      if (lockResult.count === 0) {
        console.info(`${logPrefix} lock-update-pending-skip`, { cardId });
        return;
      }
      console.info(`${logPrefix} lock-update-pending-ok`, { cardId, updatedRows: lockResult.count });
    }

    console.info(`${logPrefix} firecrawl-request-start`, {
      cardId,
      url: decision.url,
      timeoutMs: env.CARDMARKET_ENRICHMENT_REQUEST_TIMEOUT_MS,
    });
    const result = await extractCardmarketProductWithFirecrawl(decision.url, env.CARDMARKET_ENRICHMENT_REQUEST_TIMEOUT_MS);
    console.info(`${logPrefix} firecrawl-request-finished`, {
      cardId,
      ok: result.ok,
      reason: result.ok ? 'success' : result.reason,
    });

    if (!result.ok) {
      const terminalStatus = result.reason === 'blocked' ? 'blocked' : result.reason === 'not_found' ? 'not_found' : 'failed';
      const nextRetryAt = nowPlusHours(env.CARDMARKET_ENRICHMENT_FAILURE_COOLDOWN_HOURS);
      await db.cardMarketEnrichment.update({
        where: { cardId },
        data: {
          status: terminalStatus,
          attemptCount: { increment: 1 },
          lastError: result.error,
          lastFetchedAt: new Date(),
          nextRetryAt,
        },
      });
      console.warn(`${logPrefix} terminal-failure-saved`, {
        cardId,
        status: terminalStatus,
        error: result.error,
        nextRetryAt: nextRetryAt.toISOString(),
      });
      return;
    }

    const normalized = normalizeCardmarketExtraction(result.data);
    console.info(`${logPrefix} normalize-success`, {
      cardId,
      normalizedUrl: normalized.url ?? decision.url,
      hasFromPrice: normalized.fromPriceCents !== null,
      hasTrend: normalized.priceTrendCents !== null,
      currency: normalized.currency,
    });

    await db.cardMarketEnrichment.update({
      where: { cardId },
      data: {
        url: withEnglishCardmarketLanguage(normalized.url ?? decision.url),
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
        status: 'success',
        attemptCount: { increment: 1 },
        lastFetchedAt: new Date(),
        nextRetryAt: null,
        lastError: null,
        rawExtractedJson: result.raw,
      },
    });
    console.info(`${logPrefix} success-saved`, { cardId, status: 'success' });
  } catch (error) {
    console.error(`${logPrefix} enrich failed`, {
      cardId,
      message: error instanceof Error ? error.message : String(error),
    });
  } finally {
    runningCards.delete(cardId);
    console.info(`${logPrefix} finish`, { cardId });
  }
};

export const enqueueOrRunCardmarketEnrichment = async (cardId: string): Promise<void> => {
  console.info(`${logPrefix} enqueue`, { cardId });
  void enrichCardmarketForCard(cardId);
};

export const resetCardmarketEnrichment = async (cardId: string): Promise<void> => {
  console.info(`${logPrefix} reset`, { cardId });
  await db.cardMarketEnrichment.deleteMany({ where: { cardId } });
};

export const getCardmarketEnrichmentForCard = async (card: Card): Promise<CardmarketEnrichmentView> => {
  const enrichment = await db.cardMarketEnrichment.findUnique({ where: { cardId: card.id } });
  const decision = decideShouldEnrich(card, enrichment);
  console.info(`${logPrefix} read`, {
    cardId: card.id,
    status: enrichment?.status ?? 'missing',
    attemptCount: enrichment?.attemptCount ?? 0,
    shouldRun: decision.shouldRun,
    reason: decision.reason,
  });
  if (decision.shouldRun) {
    void enqueueOrRunCardmarketEnrichment(card.id);
  }
  if (!env.CARDMARKET_ENRICHMENT_ENABLED && getCardmarketUrl(card)) {
    void markDisabledIfNeeded(card.id, getCardmarketUrl(card));
  }
  return toView(enrichment, card);
};
