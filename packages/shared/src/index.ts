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
};
