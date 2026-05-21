import type {
  CardmarketProductItem,
  CardmarketProductListRequest,
  CardmarketProductSuggestion,
  CardmarketSetMappingInput,
  CardmarketSetMappingItem,
  CardmarketSetMappingListRequest,
  CardDetail,
  CardSummary,
  LinkageImportJob,
  LinkageItem,
  LinkageListRequest,
  LinkageSummary,
  PaginatedResponse,
  SetSummary,
} from '@repo/shared';
import { apiFetch, apiRequest } from '@/lib/api';

export const pokemonApi = {
  cards: (query: string, page: number, pageSize = 20, orderBy?: string) =>
    apiFetch<PaginatedResponse<CardSummary>>(
      `/api/cards?query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}${orderBy ? `&orderBy=${encodeURIComponent(orderBy)}` : ''}`,
    ),
  card: (id: string) => apiFetch<{ data: CardDetail; stale?: boolean }>(`/api/cards/${id}`),
  sets: (query: string, page: number, pageSize = 20, orderBy?: string) =>
    apiFetch<PaginatedResponse<SetSummary>>(
      `/api/sets?query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}${orderBy ? `&orderBy=${encodeURIComponent(orderBy)}` : ''}`,
    ),
  set: (id: string) => apiFetch<{ data: SetSummary; stale?: boolean }>(`/api/sets/${id}`),
  linkageSummary: () => apiFetch<{ data: LinkageSummary }>('/api/linkage/summary'),
  linkageItems: (params: LinkageListRequest) => {
    const query = new URLSearchParams({
      query: params.query ?? '',
      page: String(params.page),
      pageSize: String(params.pageSize),
      sortBy: params.sortBy ?? 'updatedAt',
      sortOrder: params.sortOrder ?? 'desc',
      ...(params.status ? { status: params.status } : {}),
      ...(params.confidenceBand ? { confidenceBand: params.confidenceBand } : {}),
    });
    return apiFetch<PaginatedResponse<LinkageItem>>(`/api/linkage/items?${query.toString()}`);
  },
  linkageProducts: (params: CardmarketProductListRequest) => {
    const query = new URLSearchParams({
      query: params.query ?? '',
      page: String(params.page),
      pageSize: String(params.pageSize),
      sortBy: params.sortBy ?? 'updatedAt',
      sortOrder: params.sortOrder ?? 'desc',
    });
    return apiFetch<PaginatedResponse<CardmarketProductItem>>(`/api/linkage/products?${query.toString()}`);
  },
  linkageProductSuggestions: (idProduct: number, limit = 8) =>
    apiFetch<{ idProduct: number; productName: string; mappedSetId: string | null; data: CardmarketProductSuggestion[]; count: number }>(
      `/api/linkage/products/${idProduct}/suggestions?limit=${limit}`,
    ),
  linkageSetMappings: (params: CardmarketSetMappingListRequest) => {
    const query = new URLSearchParams({
      query: params.query ?? '',
      page: String(params.page),
      pageSize: String(params.pageSize),
      sortBy: params.sortBy ?? 'updatedAt',
      sortOrder: params.sortOrder ?? 'desc',
      ...(params.confidence ? { confidence: params.confidence } : {}),
    });
    return apiFetch<PaginatedResponse<CardmarketSetMappingItem>>(`/api/linkage/set-mappings?${query.toString()}`);
  },
  linkageSetMappingUpsert: (payload: CardmarketSetMappingInput) =>
    apiRequest<{ data: CardmarketSetMappingItem }>('/api/linkage/set-mappings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  linkageSetMappingUpdate: (id: string, payload: Partial<CardmarketSetMappingInput>) =>
    apiRequest<{ data: CardmarketSetMappingItem }>(`/api/linkage/set-mappings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  linkageSetMappingDelete: (id: string) =>
    apiRequest<{ data: CardmarketSetMappingItem }>(`/api/linkage/set-mappings/${id}`, { method: 'DELETE' }),
  linkageImport: () => apiRequest<{ jobId: string; status: 'queued' | 'running' }>('/api/linkage/import', { method: 'POST' }),
  linkageImportUpload: (payload: { createdAt?: string; products?: unknown[]; priceGuides?: unknown[] }) =>
    apiRequest<{ jobId: string; status: 'queued' | 'running' }>('/api/linkage/import/upload', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  linkageImportStatus: (jobId: string) => apiFetch<LinkageImportJob>(`/api/linkage/import/${jobId}`),
  linkageReset: () => apiRequest<{ data: { deletedCount: number } }>('/api/linkage/reset', { method: 'POST' }),
  linkageApprove: (id: string) => apiRequest<{ data: LinkageItem }>(`/api/linkage/${id}/approve`, { method: 'POST' }),
  linkageReject: (id: string) => apiRequest<{ data: LinkageItem }>(`/api/linkage/${id}/reject`, { method: 'POST' }),
  linkageManualLink: (id: string, cardId: string) =>
    apiRequest<{ data: LinkageItem }>(`/api/linkage/${id}/manual-link`, {
      method: 'POST',
      body: JSON.stringify({ cardId }),
    }),
  linkageManualLinkProduct: (idProduct: number, cardId: string) =>
    apiRequest<{ data: LinkageItem }>(`/api/linkage/products/${idProduct}/manual-link`, {
      method: 'POST',
      body: JSON.stringify({ cardId }),
    }),
  linkageUpdate: (
    id: string,
    payload: Partial<Pick<LinkageItem, 'status' | 'score' | 'confidenceBand' | 'provenance'>> & { cardId?: string | null },
  ) =>
    apiRequest<{ data: LinkageItem }>(`/api/linkage/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  linkageDelete: (id: string) => apiRequest<{ data: LinkageItem }>(`/api/linkage/${id}`, { method: 'DELETE' }),
};
