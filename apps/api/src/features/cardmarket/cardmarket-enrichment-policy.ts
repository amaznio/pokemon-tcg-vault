import type { Card } from '@prisma/client';

export type CardMarketEnrichmentLike = {
  status: 'pending' | 'success' | 'failed' | 'blocked' | 'not_found' | 'disabled';
  url?: string | null;
  attemptCount: number;
  lastFetchedAt: Date | null;
  nextRetryAt: Date | null;
};

export type EnrichmentDecision = { shouldRun: boolean; reason: string; url: string | null };

const CARDMARKET_ENGLISH_LANGUAGE_ID = '1';

export const withEnglishCardmarketLanguage = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    parsedUrl.searchParams.set('language', CARDMARKET_ENGLISH_LANGUAGE_ID);
    return parsedUrl.toString();
  } catch {
    return url;
  }
};

export const hasEnglishCardmarketLanguage = (url: string | null | undefined): boolean => {
  if (!url?.trim()) return false;
  try {
    return new URL(url).searchParams.get('language') === CARDMARKET_ENGLISH_LANGUAGE_ID;
  } catch {
    return false;
  }
};

export const getCardmarketUrl = (card: Card): string | null => {
  const raw = (card.raw ?? {}) as Record<string, unknown>;
  const cardmarket = raw.cardmarket as Record<string, unknown> | undefined;
  const url = cardmarket?.url;
  if (typeof url === 'string' && url.trim()) return withEnglishCardmarketLanguage(url.trim());
  return null;
};

export const isFreshSuccess = (enrichment: CardMarketEnrichmentLike, ttlHours: number): boolean => {
  if (enrichment.status !== 'success' || !enrichment.lastFetchedAt) return false;
  const ttlMs = ttlHours * 60 * 60 * 1000;
  return Date.now() - enrichment.lastFetchedAt.getTime() < ttlMs;
};

export const shouldEnrichCardmarket = (
  card: Card,
  enrichment: CardMarketEnrichmentLike | null,
  options: {
    enabled: boolean;
    ttlHours: number;
    maxAttempts: number;
    now: Date;
  },
): EnrichmentDecision => {
  if (!options.enabled) return { shouldRun: false, reason: 'disabled', url: null };

  const url = getCardmarketUrl(card);
  if (!url) return { shouldRun: false, reason: 'missing_url', url: null };

  if (!enrichment) return { shouldRun: true, reason: 'missing', url };

  if (enrichment.status === 'pending') return { shouldRun: false, reason: 'pending', url };

  if (!hasEnglishCardmarketLanguage(enrichment.url)) {
    return { shouldRun: true, reason: 'language_refresh', url };
  }

  if (enrichment.nextRetryAt && enrichment.nextRetryAt.getTime() > options.now.getTime()) {
    return { shouldRun: false, reason: 'cooldown', url };
  }

  if (enrichment.attemptCount >= options.maxAttempts && enrichment.status !== 'success') {
    return { shouldRun: false, reason: 'max_attempts', url };
  }

  if (isFreshSuccess(enrichment, options.ttlHours)) return { shouldRun: false, reason: 'fresh', url };

  return { shouldRun: true, reason: 'stale_or_retry', url };
};
