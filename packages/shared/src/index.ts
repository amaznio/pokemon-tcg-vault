export type CardSummary = {
  id: string;
  name: string;
  supertype: string | null;
  subtypes: string[];
  hp: string | null;
  types: string[];
  setId: string;
  setName: string;
  rarity: string | null;
  imageSmall: string | null;
  imageLarge: string | null;
  updatedAt: string;
};

export type CardDetail = CardSummary & {
  raw: unknown;
};

export type SetSummary = {
  id: string;
  name: string;
  series: string | null;
  releaseDate: string | null;
  total: number | null;
  printedTotal: number | null;
  logo: string | null;
  symbol: string | null;
  updatedAt: string;
};

export type SetDetail = SetSummary & {
  raw: unknown;
};

export type PaginatedResponse<T> = {
  data: T[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
  stale?: boolean;
};

export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
};

export type CollectionKind = 'owned' | 'favorites' | 'wishlist' | 'binder';

export type CollectionSummary = {
  id: string;
  userId: string;
  kind: CollectionKind;
  name: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CollectionItem = {
  id: string;
  collectionId: string;
  cardId: string;
  quantity: number;
  condition: string | null;
  finish: string | null;
  language: string;
  notes: string | null;
  purchasePriceCents: number | null;
  createdAt: string;
  updatedAt: string;
  card: CardSummary;
};

export type PriceStatus = 'pending' | 'success' | 'failed' | 'blocked' | 'not_found' | 'missing_url' | 'skipped';
export type PriceRefreshJobStatus = 'queued' | 'running' | 'completed' | 'failed';

export type CardPriceSnapshot = {
  id: string;
  cardId: string;
  pricingUrl: string | null;
  status: PriceStatus;
  productName: string | null;
  cardNumber: string | null;
  rarity: string | null;
  printedInSet: string | null;
  availableItems: number | null;
  fromPriceCents: number | null;
  priceTrendCents: number | null;
  avgSellPrice30dCents: number | null;
  avgPrice7dCents: number | null;
  avgPrice1dCents: number | null;
  currency: string | null;
  lastError: string | null;
  fetchedAt: string;
};

export type PriceRefreshJobItem = {
  id: string;
  jobId: string;
  cardId: string;
  pricingUrl: string | null;
  status: PriceStatus;
  error: string | null;
  snapshotId: string | null;
  createdAt: string;
  updatedAt: string;
  card?: Pick<CardSummary, 'id' | 'name' | 'setName' | 'imageSmall' | 'imageLarge'>;
};

export type PriceRefreshJob = {
  id: string;
  userId: string;
  collectionId: string;
  status: PriceRefreshJobStatus;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  items?: PriceRefreshJobItem[];
};

export const queryKeys = {
  me: () => ['me'] as const,
  cards: {
    list: (query: string, page: number, pageSize: number, orderBy?: string) =>
      ['cards.list', query, page, pageSize, orderBy ?? ''] as const,
    detail: (id: string) => ['cards.detail', id] as const,
    batch: (ids: string[]) => ['cards.batch', ...ids] as const,
    prices: (id: string) => ['cards.prices', id] as const,
  },
  sets: {
    list: (query: string, page: number, pageSize: number, orderBy?: string) =>
      ['sets.list', query, page, pageSize, orderBy ?? ''] as const,
    detail: (id: string) => ['sets.detail', id] as const,
  },
  collections: {
    list: () => ['collections.list'] as const,
    items: (id: string) => ['collections.items', id] as const,
  },
  priceJobs: {
    detail: (id: string) => ['priceJobs.detail', id] as const,
  },
};
