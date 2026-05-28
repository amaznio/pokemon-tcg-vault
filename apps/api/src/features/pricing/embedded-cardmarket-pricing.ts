import type { CardDefaultPricing } from '@repo/shared';

const CARDMARKET_CURRENCY = 'EUR';

const toCents = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.round(value * 100);
};

const toTrimmedString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const hasAnyPrice = (pricing: CardDefaultPricing): boolean =>
  [
    pricing.fromPriceCents,
    pricing.priceTrendCents,
    pricing.avgSellPrice30dCents,
    pricing.avgPrice7dCents,
    pricing.avgPrice1dCents,
  ].some((value) => typeof value === 'number');

export const mapEmbeddedCardmarketPricing = (rawCard: unknown): CardDefaultPricing | null => {
  if (!rawCard || typeof rawCard !== 'object') return null;

  const cardmarket = (rawCard as { cardmarket?: unknown }).cardmarket;
  if (!cardmarket || typeof cardmarket !== 'object') return null;

  const payload = cardmarket as { url?: unknown; updatedAt?: unknown; prices?: unknown };
  const prices = payload.prices;
  if (!prices || typeof prices !== 'object') return null;

  const pricePayload = prices as Record<string, unknown>;
  const pricing: CardDefaultPricing = {
    pricingUrl: toTrimmedString(payload.url),
    fromPriceCents: toCents(pricePayload.lowPrice),
    priceTrendCents: toCents(pricePayload.trendPrice),
    avgSellPrice30dCents: toCents(pricePayload.avg30),
    avgPrice7dCents: toCents(pricePayload.avg7),
    avgPrice1dCents: toCents(pricePayload.avg1),
    currency: CARDMARKET_CURRENCY,
    updatedAt: toTrimmedString(payload.updatedAt),
  };

  return hasAnyPrice(pricing) ? pricing : null;
};
