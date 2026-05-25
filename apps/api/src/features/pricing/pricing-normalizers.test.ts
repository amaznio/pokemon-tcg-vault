import { describe, expect, it } from 'vitest';
import { normalizeFirecrawlPriceExtraction, parseLocalizedPriceToCents } from './pricing-normalizers';

describe('pricing normalizers', () => {
  it('parses localized euro prices to cents', () => {
    expect(parseLocalizedPriceToCents('1,23 €')).toEqual({ cents: 123, currency: 'EUR' });
    expect(parseLocalizedPriceToCents('EUR 12.34')).toEqual({ cents: 1234, currency: 'EUR' });
  });

  it('normalizes Firecrawl extraction fields', () => {
    const normalized = normalizeFirecrawlPriceExtraction({
      productName: ' Pikachu ',
      availableItems: '42 items',
      fromPrice: '1,00 €',
      priceTrend: '2,50 €',
      avgSellPrice30d: '3,00 €',
      avgPrice7d: '4,00 €',
      avgPrice1d: '5,00 €',
      pricingUrl: ' https://example.com/card ',
    });

    expect(normalized).toMatchObject({
      productName: 'Pikachu',
      availableItems: 42,
      fromPriceCents: 100,
      priceTrendCents: 250,
      avgSellPrice30dCents: 300,
      avgPrice7dCents: 400,
      avgPrice1dCents: 500,
      currency: 'EUR',
      pricingUrl: 'https://example.com/card',
    });
  });
});
