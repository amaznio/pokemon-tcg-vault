import type { Card, CardPriceSnapshot } from '@prisma/client';

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

export const getCardmarketPricingUrl = (card: Card): string | null => {
  const raw = (card.raw ?? {}) as Record<string, unknown>;
  const cardmarket = raw.cardmarket as Record<string, unknown> | undefined;
  const url = cardmarket?.url;
  if (typeof url === 'string' && url.trim()) return withEnglishCardmarketLanguage(url.trim());
  return null;
};

export const isFreshSuccessfulSnapshot = (snapshot: CardPriceSnapshot | null, ttlHours: number): boolean => {
  if (!snapshot || snapshot.status !== 'success') return false;
  return Date.now() - snapshot.fetchedAt.getTime() < ttlHours * 60 * 60 * 1000;
};
