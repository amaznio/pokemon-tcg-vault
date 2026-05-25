import type { Card } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import type { CardMarketEnrichmentLike } from './cardmarket-enrichment-policy';
import { getCardmarketUrl, hasEnglishCardmarketLanguage, shouldEnrichCardmarket, withEnglishCardmarketLanguage } from './cardmarket-enrichment-policy';

const baseCard: Card = {
  id: 'sv1-1',
  name: 'Test Card',
  supertype: null,
  subtypes: [],
  hp: null,
  types: [],
  setId: 'sv1',
  setName: 'Base',
  rarity: null,
  imageSmall: null,
  imageLarge: null,
  raw: { cardmarket: { url: 'https://www.cardmarket.com/en/Pokemon/Products/Singles/Test/Test-Card' } },
  fetchedAt: new Date(),
  expiresAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const baseEnrichment: CardMarketEnrichmentLike = {
  status: 'failed',
  url: 'https://www.cardmarket.com/en/Pokemon/Products/Singles/Test/Test-Card?language=1',
  attemptCount: 0,
  lastFetchedAt: null,
  nextRetryAt: null,
};

const options = { enabled: true, ttlHours: 168, maxAttempts: 3, now: new Date('2026-05-21T00:00:00Z') };

describe('shouldEnrichCardmarket', () => {
  it('adds english language query string to cardmarket urls', () => {
    expect(getCardmarketUrl(baseCard)).toBe('https://www.cardmarket.com/en/Pokemon/Products/Singles/Test/Test-Card?language=1');
  });

  it('preserves existing query params when forcing english language', () => {
    const url = withEnglishCardmarketLanguage(
      'https://www.cardmarket.com/en/Pokemon/Products/Singles/Destined-Rivals/Ethans-Typhlosion-V2-DRI190?idProduct=123&language=3',
    );

    expect(url).toBe(
      'https://www.cardmarket.com/en/Pokemon/Products/Singles/Destined-Rivals/Ethans-Typhlosion-V2-DRI190?idProduct=123&language=1',
    );
  });

  it('detects english language cardmarket urls', () => {
    expect(hasEnglishCardmarketLanguage('https://www.cardmarket.com/en/Pokemon/Products/Singles/Test/Test-Card?language=1')).toBe(true);
    expect(hasEnglishCardmarketLanguage('https://www.cardmarket.com/en/Pokemon/Products/Singles/Test/Test-Card?language=3')).toBe(false);
    expect(hasEnglishCardmarketLanguage('https://www.cardmarket.com/en/Pokemon/Products/Singles/Test/Test-Card')).toBe(false);
  });

  it('returns disabled when feature flag is off', () => {
    const result = shouldEnrichCardmarket(baseCard, null, { ...options, enabled: false });
    expect(result.shouldRun).toBe(false);
    expect(result.reason).toBe('disabled');
  });

  it('returns missing_url when card has no cardmarket url', () => {
    const card = { ...baseCard, raw: {} };
    const result = shouldEnrichCardmarket(card, null, options);
    expect(result.shouldRun).toBe(false);
    expect(result.reason).toBe('missing_url');
  });

  it('returns false when success is still fresh', () => {
    const enrichment: CardMarketEnrichmentLike = { ...baseEnrichment, status: 'success', lastFetchedAt: new Date('2026-05-20T23:00:00Z') };
    const result = shouldEnrichCardmarket(baseCard, enrichment, options);
    expect(result.shouldRun).toBe(false);
    expect(result.reason).toBe('fresh');
  });

  it('refreshes fresh success rows that were fetched without english language', () => {
    const enrichment: CardMarketEnrichmentLike = {
      ...baseEnrichment,
      status: 'success',
      url: 'https://www.cardmarket.com/en/Pokemon/Products/Singles/Test/Test-Card',
      lastFetchedAt: new Date('2026-05-20T23:00:00Z'),
    };
    const result = shouldEnrichCardmarket(baseCard, enrichment, options);

    expect(result.shouldRun).toBe(true);
    expect(result.reason).toBe('language_refresh');
    expect(result.url).toBe('https://www.cardmarket.com/en/Pokemon/Products/Singles/Test/Test-Card?language=1');
  });

  it('returns false when cooldown is active', () => {
    const enrichment: CardMarketEnrichmentLike = { ...baseEnrichment, nextRetryAt: new Date('2026-05-21T01:00:00Z') };
    const result = shouldEnrichCardmarket(baseCard, enrichment, options);
    expect(result.shouldRun).toBe(false);
    expect(result.reason).toBe('cooldown');
  });

  it('returns false when max attempts reached', () => {
    const enrichment: CardMarketEnrichmentLike = { ...baseEnrichment, attemptCount: 3 };
    const result = shouldEnrichCardmarket(baseCard, enrichment, options);
    expect(result.shouldRun).toBe(false);
    expect(result.reason).toBe('max_attempts');
  });

  it('returns false when status is pending', () => {
    const enrichment: CardMarketEnrichmentLike = { ...baseEnrichment, status: 'pending' };
    const result = shouldEnrichCardmarket(baseCard, enrichment, options);
    expect(result.shouldRun).toBe(false);
    expect(result.reason).toBe('pending');
  });

  it('returns true when missing enrichment', () => {
    const result = shouldEnrichCardmarket(baseCard, null, options);
    expect(result.shouldRun).toBe(true);
    expect(result.reason).toBe('missing');
    expect(result.url).toBe('https://www.cardmarket.com/en/Pokemon/Products/Singles/Test/Test-Card?language=1');
  });
});
