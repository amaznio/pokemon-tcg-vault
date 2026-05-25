import { describe, expect, it } from 'vitest';
import { parseLocalizedPriceToCents } from './cardmarket-normalizers';

describe('parseLocalizedPriceToCents', () => {
  it('parses european price format', () => {
    expect(parseLocalizedPriceToCents('32,35 €')).toEqual({ cents: 3235, currency: 'EUR' });
  });

  it('parses code-prefixed price format', () => {
    expect(parseLocalizedPriceToCents('USD 12.40')).toEqual({ cents: 1240, currency: 'USD' });
  });

  it('returns null for malformed string', () => {
    expect(parseLocalizedPriceToCents('N/A')).toBeNull();
  });
});
