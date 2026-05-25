import { describe, expect, it } from 'vitest';
import { getCardmarketPricingUrl, withEnglishCardmarketLanguage } from './pricing-policy';

describe('pricing policy', () => {
  it('forces Cardmarket English language parameter', () => {
    expect(withEnglishCardmarketLanguage('https://www.cardmarket.com/Pokemon/Products/Singles/Test/Pikachu')).toContain('language=1');
  });

  it('extracts pricing URL from cached Pokemon TCG raw card payload', () => {
    const card = {
      raw: {
        cardmarket: {
          url: 'https://www.cardmarket.com/Pokemon/Products/Singles/Test/Pikachu',
        },
      },
    };

    expect(getCardmarketPricingUrl(card as never)).toBe(
      'https://www.cardmarket.com/Pokemon/Products/Singles/Test/Pikachu?language=1',
    );
  });
});
