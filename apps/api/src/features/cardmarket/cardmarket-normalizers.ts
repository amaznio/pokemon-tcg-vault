import type { CardmarketFirecrawlExtract } from './cardmarket.schema';

export type NormalizedPrice = {
  cents: number;
  currency: string;
};

const currencyBySymbol: Record<string, string> = {
  '€': 'EUR',
  '$': 'USD',
  '£': 'GBP',
};

const normalizeCurrency = (value?: string | null): string | null => {
  if (!value) return null;
  const code = value.trim().toUpperCase();
  if (code.length === 3) return code;
  return currencyBySymbol[value.trim()] ?? null;
};

export const parseLocalizedPriceToCents = (value: string | number | null | undefined): NormalizedPrice | null => {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const currencyMatch = raw.match(/(EUR|USD|GBP|€|\$|£)/i);
  const currency = normalizeCurrency(currencyMatch?.[1] ?? null) ?? 'EUR';

  const numeric = raw
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');

  const parsed = Number.parseFloat(numeric);
  if (!Number.isFinite(parsed)) return null;

  return { cents: Math.round(parsed * 100), currency };
};

export const parseAvailableItems = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = Number.parseInt(String(value).replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : null;
};

export const normalizeCardmarketExtraction = (input: CardmarketFirecrawlExtract) => {
  const fromPrice = parseLocalizedPriceToCents(input.fromPrice);
  const priceTrend = parseLocalizedPriceToCents(input.priceTrend);
  const avg30 = parseLocalizedPriceToCents(input.avgSellPrice30d);
  const avg7 = parseLocalizedPriceToCents(input.avgPrice7d);
  const avg1 = parseLocalizedPriceToCents(input.avgPrice1d);

  const currency = fromPrice?.currency ?? priceTrend?.currency ?? avg30?.currency ?? avg7?.currency ?? avg1?.currency ?? null;

  return {
    productName: input.productName?.trim() || null,
    cardNumber: input.cardNumber?.trim() || null,
    rarity: input.rarity?.trim() || null,
    printedInSet: input.printedInSet?.trim() || null,
    availableItems: parseAvailableItems(input.availableItems),
    fromPriceCents: fromPrice?.cents ?? null,
    priceTrendCents: priceTrend?.cents ?? null,
    avgSellPrice30dCents: avg30?.cents ?? null,
    avgPrice7dCents: avg7?.cents ?? null,
    avgPrice1dCents: avg1?.cents ?? null,
    currency,
    url: input.cardmarketUrl?.trim() || null,
  };
};
