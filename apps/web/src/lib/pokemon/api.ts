import type { CardDetail, CardSummary, PaginatedResponse, SetSummary } from '@repo/shared';
import { apiFetch } from '@/lib/api';

export const pokemonApi = {
  cards: (query: string, page: number, pageSize = 20) =>
    apiFetch<PaginatedResponse<CardSummary>>(
      `/api/cards?query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`,
    ),
  card: (id: string) => apiFetch<{ data: CardDetail; stale?: boolean }>(`/api/cards/${id}`),
  sets: (query: string, page: number, pageSize = 20, orderBy?: string) =>
    apiFetch<PaginatedResponse<SetSummary>>(
      `/api/sets?query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}${orderBy ? `&orderBy=${encodeURIComponent(orderBy)}` : ''}`,
    ),
  set: (id: string) => apiFetch<{ data: SetSummary; stale?: boolean }>(`/api/sets/${id}`),
};
