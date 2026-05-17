import type { CardDetail, CardSummary, SetSummary } from '@repo/shared';

export type CardFilterState = {
  query: string;
  set: string;
  type: string;
  rarity: string;
  supertype: string;
  scope: 'all' | 'favorites' | 'owned' | 'wishlist';
};

export type CardListResult = {
  cards: CardSummary[];
  stale?: boolean;
  totalCount: number;
};

export type CardDetailResult = {
  card: CardDetail;
  stale?: boolean;
};

export type SetListItem = SetSummary;
