import { describe, expect, it } from 'vitest';
import { mapEmbeddedCardmarketPricing } from './embedded-cardmarket-pricing';

describe('embedded Cardmarket pricing', () => {
  it('maps Pokemon TCG Cardmarket prices to cents', () => {
    const pricing = mapEmbeddedCardmarketPricing({
      cardmarket: {
        url: 'https://prices.pokemontcg.io/cardmarket/xy1-1',
        updatedAt: '2026/05/28',
        prices: {
          averageSellPrice: 7.42,
          lowPrice: 1.5,
          trendPrice: 6.67,
          avg1: 6.98,
          avg7: 6.93,
          avg30: 6.88,
        },
      },
    });

    expect(pricing).toEqual({
      pricingUrl: 'https://prices.pokemontcg.io/cardmarket/xy1-1',
      fromPriceCents: 150,
      priceTrendCents: 667,
      avgSellPrice30dCents: 688,
      avgPrice7dCents: 693,
      avgPrice1dCents: 698,
      currency: 'EUR',
      updatedAt: '2026/05/28',
    });
  });

  it('returns null when cardmarket pricing is missing', () => {
    expect(mapEmbeddedCardmarketPricing({ id: 'xy1-1' })).toBeNull();
    expect(mapEmbeddedCardmarketPricing({ cardmarket: { url: 'https://example.com' } })).toBeNull();
  });

  it('ignores non-numeric price fields safely', () => {
    const pricing = mapEmbeddedCardmarketPricing({
      cardmarket: {
        updatedAt: '2026/05/28',
        prices: {
          lowPrice: '1.50',
          trendPrice: 6.67,
          avg1: Number.NaN,
        },
      },
    });

    expect(pricing).toMatchObject({
      pricingUrl: null,
      fromPriceCents: null,
      priceTrendCents: 667,
      avgSellPrice30dCents: null,
      avgPrice7dCents: null,
      avgPrice1dCents: null,
      currency: 'EUR',
      updatedAt: '2026/05/28',
    });
  });
});
