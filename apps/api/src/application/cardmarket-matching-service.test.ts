import { describe, expect, it } from 'vitest';
import { parseCardmarketRedirectUrl, scoreCardmarketCandidate } from './cardmarket-matching-service';

const card = {
  id: 'sv8-88',
  name: 'Oricorio ex',
  supertype: 'Pokemon',
  subtypes: ['Basic', 'ex'],
  hp: '200',
  types: ['Lightning'],
  setId: 'sv8',
  setName: 'Mega Evolution',
  rarity: 'Double Rare',
  imageSmall: null,
  imageLarge: null,
  raw: {
    number: '088',
    set: { ptcgoCode: 'MEG', id: 'sv8' },
  },
  fetchedAt: new Date(),
  expiresAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
} as any;

describe('parseCardmarketRedirectUrl', () => {
  it('parses set slug and collector signals', () => {
    const parsed = parseCardmarketRedirectUrl(
      'https://www.cardmarket.com/en/Pokemon/Products/Singles/Mega-Evolution/Oricorio-ex-MEG088',
    );

    expect(parsed.setSlug).toBe('Mega-Evolution');
    expect(parsed.cardSlug).toBe('Oricorio-ex-MEG088');
    expect(parsed.parsedSetCode).toBe('MEG');
    expect(parsed.parsedCollectorNumber).toBe('088');
  });

  it('returns null parsed fields for non-single URL', () => {
    const parsed = parseCardmarketRedirectUrl('https://www.cardmarket.com/en/Pokemon/Products?idProduct=123');
    expect(parsed.setSlug).toBeNull();
    expect(parsed.parsedSetCode).toBeNull();
  });
});

describe('scoreCardmarketCandidate', () => {
  it('auto approves only when strong signals align', () => {
    const result = scoreCardmarketCandidate(card, {
      name: 'Oricorio ex [Spark Dance | Sky Judgement]',
      setSlug: 'Mega-Evolution',
      parsedSetCode: 'MEG',
      parsedCollectorNumber: '088',
    });

    expect(result.autoApproved).toBe(true);
    expect(result.score).toBeGreaterThan(0.8);
  });

  it('does not auto approve with name-only match', () => {
    const result = scoreCardmarketCandidate(card, {
      name: 'Oricorio ex [Spark Dance | Sky Judgement]',
      setSlug: null,
      parsedSetCode: null,
      parsedCollectorNumber: null,
    });

    expect(result.autoApproved).toBe(false);
  });
});
