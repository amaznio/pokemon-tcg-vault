import { describe, expect, it } from 'vitest';
import {
  canUsePointerHolo,
  getCollectorNumber,
  getHoloMetadata,
  normalizeHoloList,
  normalizeHoloRarity,
} from './pokemon-holo-metadata';

describe('pokemon holo metadata', () => {
  it('maps modern rarity names to upstream holo selectors', () => {
    expect(normalizeHoloRarity('Ultra Rare')).toBe('rare ultra');
    expect(normalizeHoloRarity('Hyper Rare')).toBe('rare rainbow');
    expect(normalizeHoloRarity('Illustration Rare')).toBe('rare ultra');
    expect(normalizeHoloRarity('Special Illustration Rare')).toBe('rare secret');
    expect(normalizeHoloRarity('Rare Holo VSTAR')).toBe('rare holo vstar');
  });

  it('normalizes type and subtype lists', () => {
    expect(normalizeHoloList([' Lightning ', 'Basic', ''])).toEqual(['lightning', 'basic']);
  });

  it('derives collector numbers from Pokemon TCG ids', () => {
    expect(getCollectorNumber('swsh12pt5-160')).toBe('160');
    expect(getCollectorNumber('sv3pt5-TG05')).toBe('tg05');
  });

  it('builds CSS-facing metadata from a card summary shape', () => {
    expect(
      getHoloMetadata({
        id: 'sv3pt5-TG05',
        setId: 'sv3pt5',
        supertype: 'Pokémon',
        subtypes: ['Basic'],
        types: ['Lightning'],
        rarity: 'Ultra Rare',
      }),
    ).toEqual({
      number: 'tg05',
      set: 'sv3pt5',
      supertype: 'pokémon',
      subtypes: 'basic',
      types: ['lightning'],
      rarity: 'rare ultra',
      trainerGallery: true,
    });
  });

  it('allows pointer holo only for mouse hover users without reduced motion', () => {
    expect(canUsePointerHolo({ pointerType: 'mouse', hoverCapable: true, reducedMotion: false })).toBe(true);
    expect(canUsePointerHolo({ pointerType: 'touch', hoverCapable: true, reducedMotion: false })).toBe(false);
    expect(canUsePointerHolo({ pointerType: 'mouse', hoverCapable: false, reducedMotion: false })).toBe(false);
    expect(canUsePointerHolo({ pointerType: 'mouse', hoverCapable: true, reducedMotion: true })).toBe(false);
  });
});
