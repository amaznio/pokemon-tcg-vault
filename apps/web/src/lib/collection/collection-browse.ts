import type { CollectionItem } from '@repo/shared';

export const collectionSortOptions = [
  'recent',
  'updated',
  'name',
  'set',
  'rarity',
  'quantity',
] as const;

export type CollectionSort = (typeof collectionSortOptions)[number];

export type CollectionBrowseState = {
  query: string;
  sort: CollectionSort;
  set: string;
  type: string;
  supertype: string;
  condition: string;
  finish: string;
  language: string;
  rarity: string[];
  missingDetails: boolean;
};

export type CollectionFilterOption = {
  label: string;
  value: string;
};

export type CollectionBrowseOptions = {
  sets: CollectionFilterOption[];
  types: CollectionFilterOption[];
  supertypes: CollectionFilterOption[];
  rarities: CollectionFilterOption[];
  conditions: CollectionFilterOption[];
  finishes: CollectionFilterOption[];
  languages: CollectionFilterOption[];
};

export type CollectionStats = {
  uniqueCards: number;
  totalQuantity: number;
  uniqueSets: number;
  detailedItems: number;
};

export const defaultCollectionBrowseState: CollectionBrowseState = {
  query: '',
  sort: 'recent',
  set: '',
  type: '',
  supertype: '',
  condition: '',
  finish: '',
  language: '',
  rarity: [],
  missingDetails: false,
};

const collectionBrowseParamKeys = [
  'q',
  'sort',
  'set',
  'type',
  'supertype',
  'condition',
  'finish',
  'language',
  'rarity',
  'details',
] as const;

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const languageLabels: Record<string, string> = {
  en: 'English',
  ja: 'Japanese',
  jp: 'Japanese',
  de: 'German',
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
  ko: 'Korean',
  pt: 'Portuguese',
  zh: 'Chinese',
};

const normalize = (value: string | null | undefined): string => value?.trim().toLowerCase() ?? '';

const cleanParam = (params: URLSearchParams, key: string): string => {
  const value = params.get(key)?.trim() ?? '';
  return value === 'all' ? '' : value;
};

const uniqueSorted = (values: string[]): CollectionFilterOption[] =>
  [...new Set(values.map((value) => value.trim()).filter(Boolean))]
    .sort((a, b) => collator.compare(a, b))
    .map((value) => ({ label: value, value }));

const uniqueLanguageOptions = (values: string[]): CollectionFilterOption[] =>
  [...new Set(values.map((value) => value.trim()).filter(Boolean))]
    .map((value) => ({ label: languageLabels[value.toLowerCase()] ?? value.toUpperCase(), value }))
    .sort((a, b) => collator.compare(a.label, b.label));

const getLanguageLabel = (value: string): string =>
  languageLabels[value.toLowerCase()] ?? value.toUpperCase();

const uniqueSetOptions = (items: CollectionItem[]): CollectionFilterOption[] => {
  const sets = new Map<string, string>();

  items.forEach((item) => {
    if (item.card.setId && item.card.setName) sets.set(item.card.setId, item.card.setName);
  });

  return [...sets.entries()]
    .map(([value, label]) => ({ label, value }))
    .sort((a, b) => collator.compare(a.label, b.label));
};

const parseRarityParams = (params: URLSearchParams): string[] => [
  ...new Set(
    params
      .getAll('rarity')
      .flatMap((entry) => entry.split(','))
      .map((entry) => entry.trim())
      .filter(Boolean),
  ),
];

const isCollectionSort = (value: string): value is CollectionSort =>
  (collectionSortOptions as readonly string[]).includes(value);

const parseDate = (value: string): number => {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const compareText = (a: string | null | undefined, b: string | null | undefined): number =>
  collator.compare(a ?? '', b ?? '');

const compareByName = (a: CollectionItem, b: CollectionItem): number =>
  compareText(a.card.name, b.card.name);

const hasCollectionDetails = (item: CollectionItem): boolean =>
  Boolean(
    item.condition ||
    item.finish ||
    item.notes ||
    item.purchasePriceCents !== null ||
    item.language !== 'en',
  );

const isMissingDetails = (item: CollectionItem): boolean =>
  !item.condition || !item.finish || !item.notes || item.purchasePriceCents === null;

const getSearchText = (item: CollectionItem): string =>
  [
    item.card.name,
    item.card.setName,
    item.card.id,
    item.card.supertype,
    item.card.rarity,
    ...item.card.subtypes,
    ...item.card.types,
    item.condition,
    item.finish,
    item.language,
    getLanguageLabel(item.language),
    item.notes,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

export function parseCollectionBrowseState(params: URLSearchParams): CollectionBrowseState {
  const sort = cleanParam(params, 'sort');

  return {
    query: cleanParam(params, 'q'),
    sort: isCollectionSort(sort) ? sort : defaultCollectionBrowseState.sort,
    set: cleanParam(params, 'set'),
    type: cleanParam(params, 'type'),
    supertype: cleanParam(params, 'supertype'),
    condition: cleanParam(params, 'condition'),
    finish: cleanParam(params, 'finish'),
    language: cleanParam(params, 'language'),
    rarity: parseRarityParams(params),
    missingDetails: params.get('details') === 'missing',
  };
}

export function buildCollectionBrowseSearchParams(
  state: CollectionBrowseState,
  baseParams = new URLSearchParams(),
): URLSearchParams {
  const params = new URLSearchParams(baseParams);
  collectionBrowseParamKeys.forEach((key) => params.delete(key));

  const query = state.query.trim();
  if (query) params.set('q', query);
  if (state.sort !== defaultCollectionBrowseState.sort) params.set('sort', state.sort);
  if (state.set) params.set('set', state.set);
  if (state.type) params.set('type', state.type);
  if (state.supertype) params.set('supertype', state.supertype);
  if (state.condition) params.set('condition', state.condition);
  if (state.finish) params.set('finish', state.finish);
  if (state.language) params.set('language', state.language);
  state.rarity.forEach((rarity) => {
    if (rarity.trim()) params.append('rarity', rarity.trim());
  });
  if (state.missingDetails) params.set('details', 'missing');

  return params;
}

export function getCollectionActiveFilterCount(state: CollectionBrowseState): number {
  return [
    state.query.trim(),
    state.sort !== defaultCollectionBrowseState.sort ? state.sort : '',
    state.set,
    state.type,
    state.supertype,
    state.condition,
    state.finish,
    state.language,
    state.rarity.length ? 'rarity' : '',
    state.missingDetails ? 'details' : '',
  ].filter(Boolean).length;
}

export function getCollectionBrowseOptions(items: CollectionItem[]): CollectionBrowseOptions {
  return {
    sets: uniqueSetOptions(items),
    types: uniqueSorted(items.flatMap((item) => item.card.types)),
    supertypes: uniqueSorted(items.map((item) => item.card.supertype ?? '')),
    rarities: uniqueSorted(items.map((item) => item.card.rarity ?? '')),
    conditions: uniqueSorted(items.map((item) => item.condition ?? '')),
    finishes: uniqueSorted(items.map((item) => item.finish ?? '')),
    languages: uniqueLanguageOptions(items.map((item) => item.language)),
  };
}

export function getCollectionStats(items: CollectionItem[]): CollectionStats {
  return {
    uniqueCards: items.length,
    totalQuantity: items.reduce((total, item) => total + item.quantity, 0),
    uniqueSets: new Set(items.map((item) => item.card.setId)).size,
    detailedItems: items.filter(hasCollectionDetails).length,
  };
}

export function filterCollectionItems(
  items: CollectionItem[],
  state: CollectionBrowseState,
): CollectionItem[] {
  const query = normalize(state.query);
  const rarityFilters = new Set(state.rarity.map(normalize));

  return items.filter((item) => {
    if (query && !getSearchText(item).includes(query)) return false;
    if (state.set && item.card.setId !== state.set) return false;
    if (state.type && !item.card.types.includes(state.type)) return false;
    if (state.supertype && item.card.supertype !== state.supertype) return false;
    if (state.condition && item.condition !== state.condition) return false;
    if (state.finish && item.finish !== state.finish) return false;
    if (state.language && item.language !== state.language) return false;
    if (rarityFilters.size && !rarityFilters.has(normalize(item.card.rarity))) return false;
    if (state.missingDetails && !isMissingDetails(item)) return false;
    return true;
  });
}

export function sortCollectionItems(
  items: CollectionItem[],
  sort: CollectionSort,
): CollectionItem[] {
  return [...items].sort((a, b) => {
    if (sort === 'updated')
      return parseDate(b.updatedAt) - parseDate(a.updatedAt) || compareByName(a, b);
    if (sort === 'name') return compareByName(a, b);
    if (sort === 'set') return compareText(a.card.setName, b.card.setName) || compareByName(a, b);
    if (sort === 'rarity') return compareText(a.card.rarity, b.card.rarity) || compareByName(a, b);
    if (sort === 'quantity') return b.quantity - a.quantity || compareByName(a, b);
    return parseDate(b.createdAt) - parseDate(a.createdAt) || compareByName(a, b);
  });
}

export function getFilteredCollectionItems(
  items: CollectionItem[],
  state: CollectionBrowseState,
): CollectionItem[] {
  return sortCollectionItems(filterCollectionItems(items, state), state.sort);
}
