import { describe, expect, it } from 'vitest';
import type { CollectionItem } from '@repo/shared';
import {
  buildCollectionBrowseSearchParams,
  defaultCollectionBrowseState,
  filterCollectionItems,
  getCollectionActiveFilterCount,
  getCollectionBrowseOptions,
  getCollectionStats,
  parseCollectionBrowseState,
  sortCollectionItems,
} from './collection-browse';

type CollectionItemOverrides = Omit<Partial<CollectionItem>, 'card'> & {
  card?: Partial<CollectionItem['card']>;
};

const makeItem = (overrides: CollectionItemOverrides): CollectionItem => {
  const { card: cardOverrides, ...itemOverrides } = overrides;

  return {
    id: 'item-1',
    collectionId: 'collection-1',
    cardId: 'card-1',
    quantity: 1,
    condition: null,
    finish: null,
    language: 'en',
    notes: null,
    purchasePriceCents: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...itemOverrides,
    card: {
      id: 'sv1-1',
      name: 'Bulbasaur',
      supertype: 'Pokémon',
      subtypes: ['Basic'],
      hp: '70',
      types: ['Grass'],
      setId: 'sv1',
      setName: 'Scarlet & Violet',
      rarity: 'Common',
      imageSmall: null,
      imageLarge: null,
      updatedAt: '2024-01-01T00:00:00.000Z',
      ...cardOverrides,
    },
  };
};

const items: CollectionItem[] = [
  makeItem({
    id: 'item-1',
    quantity: 2,
    condition: 'Near Mint',
    finish: 'Holo',
    notes: 'Starter page',
    purchasePriceCents: 300,
    createdAt: '2024-03-01T00:00:00.000Z',
    updatedAt: '2024-03-02T00:00:00.000Z',
    card: {
      id: 'sv1-1',
      name: 'Bulbasaur',
      types: ['Grass'],
      setId: 'sv1',
      setName: 'Scarlet & Violet',
      rarity: 'Common',
    },
  }),
  makeItem({
    id: 'item-2',
    cardId: 'card-2',
    quantity: 5,
    condition: 'Played',
    finish: 'Reverse Holo',
    language: 'jp',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-04-01T00:00:00.000Z',
    card: {
      id: 'base1-4',
      name: 'Charizard',
      types: ['Fire'],
      setId: 'base1',
      setName: 'Base',
      rarity: 'Rare Holo',
    },
  }),
  makeItem({
    id: 'item-3',
    cardId: 'card-3',
    quantity: 1,
    condition: null,
    finish: null,
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2024-02-01T00:00:00.000Z',
    card: {
      id: 'swsh4-25',
      name: 'Pikachu',
      types: ['Lightning'],
      setId: 'swsh4',
      setName: 'Vivid Voltage',
      rarity: 'Common',
    },
  }),
];

describe('collection browse query state', () => {
  it('parses valid params and falls back on invalid sort values', () => {
    const state = parseCollectionBrowseState(
      new URLSearchParams(
        'q=char&sort=invalid&set=base1&rarity=Common&rarity=Rare+Holo&details=missing',
      ),
    );

    expect(state).toEqual({
      ...defaultCollectionBrowseState,
      query: 'char',
      set: 'base1',
      rarity: ['Common', 'Rare Holo'],
      missingDetails: true,
    });
  });

  it('builds params without empty defaults and preserves unrelated params', () => {
    const params = buildCollectionBrowseSearchParams(
      { ...defaultCollectionBrowseState, query: 'pika', sort: 'name', rarity: ['Common'] },
      new URLSearchParams('tab=owned&q=old&rarity=Rare'),
    );

    expect(params.toString()).toBe('tab=owned&q=pika&sort=name&rarity=Common');
  });

  it('counts active filters including non-default sort', () => {
    expect(getCollectionActiveFilterCount(defaultCollectionBrowseState)).toBe(0);
    expect(
      getCollectionActiveFilterCount({
        ...defaultCollectionBrowseState,
        query: 'char',
        sort: 'quantity',
        rarity: ['Rare Holo'],
      }),
    ).toBe(3);
  });
});

describe('collection browse derivation', () => {
  it('searches card and collection metadata', () => {
    expect(
      filterCollectionItems(items, { ...defaultCollectionBrowseState, query: 'starter' }).map(
        (item) => item.card.name,
      ),
    ).toEqual(['Bulbasaur']);
    expect(
      filterCollectionItems(items, { ...defaultCollectionBrowseState, query: 'base' }).map(
        (item) => item.card.name,
      ),
    ).toEqual(['Charizard']);
    expect(
      filterCollectionItems(items, { ...defaultCollectionBrowseState, query: 'japanese' }).map(
        (item) => item.card.name,
      ),
    ).toEqual(['Charizard']);
  });

  it('combines filters with AND semantics and rarity with OR semantics', () => {
    const filtered = filterCollectionItems(items, {
      ...defaultCollectionBrowseState,
      type: 'Fire',
      language: 'jp',
      rarity: ['Common', 'Rare Holo'],
    });

    expect(filtered.map((item) => item.card.name)).toEqual(['Charizard']);
  });

  it('filters items with missing details', () => {
    expect(
      filterCollectionItems(items, { ...defaultCollectionBrowseState, missingDetails: true }).map(
        (item) => item.card.name,
      ),
    ).toEqual(['Charizard', 'Pikachu']);
  });

  it('sorts by every supported option', () => {
    expect(sortCollectionItems(items, 'recent').map((item) => item.card.name)).toEqual([
      'Bulbasaur',
      'Pikachu',
      'Charizard',
    ]);
    expect(sortCollectionItems(items, 'updated').map((item) => item.card.name)).toEqual([
      'Charizard',
      'Bulbasaur',
      'Pikachu',
    ]);
    expect(sortCollectionItems(items, 'name').map((item) => item.card.name)).toEqual([
      'Bulbasaur',
      'Charizard',
      'Pikachu',
    ]);
    expect(sortCollectionItems(items, 'set').map((item) => item.card.name)).toEqual([
      'Charizard',
      'Bulbasaur',
      'Pikachu',
    ]);
    expect(sortCollectionItems(items, 'rarity').map((item) => item.card.name)).toEqual([
      'Bulbasaur',
      'Pikachu',
      'Charizard',
    ]);
    expect(sortCollectionItems(items, 'quantity').map((item) => item.card.name)).toEqual([
      'Charizard',
      'Bulbasaur',
      'Pikachu',
    ]);
  });

  it('derives options and stats from collection items', () => {
    const options = getCollectionBrowseOptions(items);

    expect(options.types.map((option) => option.value)).toEqual([
      'Fire',
      'Grass',
      'Lightning',
    ]);
    expect(options.languages).toEqual([
      { label: 'English', value: 'en' },
      { label: 'Japanese', value: 'jp' },
    ]);
    expect(getCollectionStats(items)).toEqual({
      uniqueCards: 3,
      totalQuantity: 8,
      uniqueSets: 3,
      detailedItems: 2,
    });
  });
});
