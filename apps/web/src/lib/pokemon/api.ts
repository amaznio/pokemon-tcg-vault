import type {
  AuthUser,
  CardDetail,
  CardPriceSnapshot,
  CardSummary,
  CollectionItem,
  CollectionSummary,
  PaginatedResponse,
  PriceRefreshJob,
  SetSummary,
} from '@repo/shared';
import { apiFetch, apiRequest } from '@/lib/api';

export const pokemonApi = {
  me: () => apiFetch<{ data: AuthUser | null }>('/api/me'),
  register: (payload: { email: string; password: string; name?: string }) =>
    apiRequest<{ data: AuthUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    apiRequest<{ data: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  logout: () => apiRequest<{ ok: true }>('/api/auth/logout', { method: 'POST' }),
  cards: (query: string, page: number, pageSize = 20, orderBy?: string) =>
    apiFetch<PaginatedResponse<CardSummary>>(
      `/api/cards?query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}${orderBy ? `&orderBy=${encodeURIComponent(orderBy)}` : ''}`,
    ),
  card: (id: string) => apiFetch<{ data: CardDetail; stale?: boolean }>(`/api/cards/${id}`),
  cardsBatch: (ids: string[]) =>
    apiRequest<{ data: CardDetail[]; count: number }>('/api/cards/batch', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  cardPrices: (id: string) => apiFetch<{ data: CardPriceSnapshot[]; count: number }>(`/api/cards/${id}/prices`),
  sets: (query: string, page: number, pageSize = 20, orderBy?: string) =>
    apiFetch<PaginatedResponse<SetSummary>>(
      `/api/sets?query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}${orderBy ? `&orderBy=${encodeURIComponent(orderBy)}` : ''}`,
    ),
  set: (id: string) => apiFetch<{ data: SetSummary; stale?: boolean }>(`/api/sets/${id}`),
  collections: () => apiFetch<{ data: CollectionSummary[] }>('/api/collections'),
  createCollection: (payload: { name: string }) =>
    apiRequest<{ data: CollectionSummary }>('/api/collections', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateCollection: (id: string, payload: { name?: string }) =>
    apiRequest<{ data: CollectionSummary }>(`/api/collections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteCollection: (id: string) => apiRequest<{ data: CollectionSummary }>(`/api/collections/${id}`, { method: 'DELETE' }),
  collectionItems: (id: string) => apiFetch<{ data: CollectionItem[]; count: number }>(`/api/collections/${id}/cards`),
  addCollectionItem: (id: string, payload: { cardId: string; quantity?: number }) =>
    apiRequest<{ data: CollectionItem }>(`/api/collections/${id}/cards`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateCollectionItem: (collectionId: string, itemId: string, payload: Partial<CollectionItem>) =>
    apiRequest<{ data: CollectionItem }>(`/api/collections/${collectionId}/cards/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteCollectionItem: (collectionId: string, itemId: string) =>
    apiRequest<{ data: CollectionItem }>(`/api/collections/${collectionId}/cards/${itemId}`, { method: 'DELETE' }),
  refreshCollectionPrices: (id: string) =>
    apiRequest<{ data: PriceRefreshJob }>(`/api/collections/${id}/prices/refresh`, { method: 'POST' }),
  priceJob: (id: string) => apiFetch<{ data: PriceRefreshJob }>(`/api/price-jobs/${id}`),
};
