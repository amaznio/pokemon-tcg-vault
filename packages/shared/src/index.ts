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
  cardmarket?: {
    enrichmentState: 'idle' | 'matching' | 'matched' | 'unresolved' | 'error';
    statusMessage?: string;
    mapping: {
      idProduct: number;
      status: LinkageStatus;
      score: number | null;
      confidenceBand: LinkageConfidenceBand | null;
      matchMethod: string | null;
      finalUrl: string | null;
    } | null;
    priceGuide: {
      avg: number | null;
      low: number | null;
      trend: number | null;
      avg1: number | null;
      avg7: number | null;
      avg30: number | null;
      avgHolo: number | null;
      lowHolo: number | null;
      trendHolo: number | null;
      avg1Holo: number | null;
      avg7Holo: number | null;
      avg30Holo: number | null;
      updatedAt: string | null;
    } | null;
    priceHistory: Array<{
      snapshotDate: string;
      avg: number | null;
      low: number | null;
      trend: number | null;
      avg1: number | null;
      avg7: number | null;
      avg30: number | null;
      avgHolo: number | null;
      lowHolo: number | null;
      trendHolo: number | null;
      avg1Holo: number | null;
      avg7Holo: number | null;
      avg30Holo: number | null;
    }>;
  };
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

export type LinkageStatus = 'auto_linked' | 'needs_review' | 'unlinked' | 'rejected';
export type LinkageConfidenceBand = 'high' | 'medium' | 'low';

export type LinkageSummary = {
  total: number;
  status: Record<LinkageStatus, number>;
  confidence: Record<LinkageConfidenceBand, number>;
};

export type LinkageItem = {
  id: string;
  idProduct: number;
  status: LinkageStatus;
  score: number;
  confidenceBand: LinkageConfidenceBand | null;
  provenance: string;
  updatedAt: string;
  product: {
    idProduct: number;
    name: string;
    idCategory: number | null;
    categoryName: string | null;
    idExpansion: number | null;
    idMetacard: number | null;
    dateAdded: string | null;
  };
  card: {
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
  } | null;
  priceGuide: {
    idCategory: number | null;
    trend: number | null;
    avg: number | null;
    low: number | null;
    avg1: number | null;
    avg7: number | null;
    avg30: number | null;
    avgHolo: number | null;
    lowHolo: number | null;
    trendHolo: number | null;
    avg1Holo: number | null;
    avg7Holo: number | null;
    avg30Holo: number | null;
  } | null;
};

export type LinkageListRequest = {
  query?: string;
  page: number;
  pageSize: number;
  status?: LinkageStatus;
  confidenceBand?: LinkageConfidenceBand;
  sortBy?: 'updatedAt' | 'score' | 'status';
  sortOrder?: 'asc' | 'desc';
};

export type CardmarketProductListRequest = {
  query?: string;
  page: number;
  pageSize: number;
  sortBy?: 'updatedAt' | 'idProduct' | 'name';
  sortOrder?: 'asc' | 'desc';
};

export type CardmarketProductSuggestionsRequest = {
  idProduct: number;
  limit?: number;
};

export type CardmarketProductSuggestion = {
  card: CardSummary;
  score: number;
  reason: string;
};

export type CardmarketSetMappingConfidence = 'high' | 'medium' | 'low';

export type CardmarketSetMappingListRequest = {
  query?: string;
  page: number;
  pageSize: number;
  confidence?: CardmarketSetMappingConfidence;
  sortBy?: 'updatedAt' | 'ourSetId' | 'confidence' | 'evidenceCount';
  sortOrder?: 'asc' | 'desc';
};

export type CardmarketSetMappingInput = {
  ourSetId: string;
  cardmarketSetCode?: string | null;
  cardmarketSetSlug?: string | null;
  cardmarketIdExpansion?: number | null;
  confidence?: CardmarketSetMappingConfidence;
  source?: string;
};

export type CardmarketSetMappingItem = {
  id: string;
  ourSetId: string;
  cardmarketSetCode: string | null;
  cardmarketSetSlug: string | null;
  cardmarketIdExpansion: number | null;
  confidence: CardmarketSetMappingConfidence;
  evidenceCount: number;
  conflictCount: number;
  lastScore: number | null;
  lastMatchedCardId: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
};

export type CardmarketProductItem = {
  idProduct: number;
  name: string;
  idCategory: number | null;
  categoryName: string | null;
  idExpansion: number | null;
  idMetacard: number | null;
  dateAdded: string | null;
  raw: unknown;
  createdAt: string;
  updatedAt: string;
  priceGuide: {
    idProduct: number;
    idCategory: number | null;
    avg: number | null;
    low: number | null;
    trend: number | null;
    avg1: number | null;
    avg7: number | null;
    avg30: number | null;
    avgHolo: number | null;
    lowHolo: number | null;
    trendHolo: number | null;
    avg1Holo: number | null;
    avg7Holo: number | null;
    avg30Holo: number | null;
    raw: unknown;
    updatedAt: string;
  } | null;
  link: {
    id: string;
    status: LinkageStatus;
    score: number | null;
    matchMethod: string | null;
    confidenceBand: LinkageConfidenceBand | null;
    cardId: string | null;
    updatedAt: string;
  } | null;
};

export type LinkageImportResult = {
  started: boolean;
  total: number;
  processed: number;
  updated: number;
  failed: number;
};

export type LinkageImportJobStatus = 'queued' | 'running' | 'completed' | 'failed';

export type LinkageImportJob = {
  jobId: string;
  status: LinkageImportJobStatus;
  total: number;
  processed: number;
  updated: number;
  failed: number;
  progressPct: number;
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
};

export const queryKeys = {
  cards: {
    list: (query: string, page: number, pageSize: number, orderBy?: string) =>
      ['cards.list', query, page, pageSize, orderBy ?? ''] as const,
    detail: (id: string) => ['cards.detail', id] as const,
  },
  sets: {
    list: (query: string, page: number, pageSize: number, orderBy?: string) =>
      ['sets.list', query, page, pageSize, orderBy ?? ''] as const,
    detail: (id: string) => ['sets.detail', id] as const,
  },
  linkage: {
    summary: () => ['linkage.summary'] as const,
    list: (filters: LinkageListRequest) =>
      [
        'linkage.list',
        filters.query ?? '',
        filters.page,
        filters.pageSize,
        filters.status ?? '',
        filters.confidenceBand ?? '',
        filters.sortBy ?? 'updatedAt',
        filters.sortOrder ?? 'desc',
      ] as const,
    products: (filters: CardmarketProductListRequest) =>
      [
        'linkage.products',
        filters.query ?? '',
        filters.page,
        filters.pageSize,
        filters.sortBy ?? 'updatedAt',
        filters.sortOrder ?? 'desc',
      ] as const,
    productSuggestions: (idProduct: number, limit: number) =>
      ['linkage.productSuggestions', idProduct, limit] as const,
    setMappings: (filters: CardmarketSetMappingListRequest) =>
      [
        'linkage.setMappings',
        filters.query ?? '',
        filters.page,
        filters.pageSize,
        filters.confidence ?? '',
        filters.sortBy ?? 'updatedAt',
        filters.sortOrder ?? 'desc',
      ] as const,
  },
};
