import { z } from 'zod';

export const cardsQuerySchema = z.object({
  query: z.string().default(''),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.string().optional(),
});

export const setsQuerySchema = z.object({
  query: z.string().default(''),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.string().default('-releaseDate'),
});

export const linkageItemsQuerySchema = z.object({
  query: z.string().default(''),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  status: z.enum(['auto_linked', 'needs_review', 'unlinked', 'rejected']).optional(),
  confidenceBand: z.enum(['high', 'medium', 'low']).optional(),
  sortBy: z.enum(['updatedAt', 'score', 'status']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const linkageProductsQuerySchema = z.object({
  query: z.string().default(''),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  sortBy: z.enum(['updatedAt', 'idProduct', 'name']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const linkageProductSuggestionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(25).default(8),
});

export const linkageSetMappingsQuerySchema = z.object({
  query: z.string().default(''),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  confidence: z.enum(['high', 'medium', 'low']).optional(),
  sortBy: z.enum(['updatedAt', 'ourSetId', 'confidence', 'evidenceCount']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const linkageSetMappingUpsertSchema = z.object({
  ourSetId: z.string().min(1),
  cardmarketSetCode: z.string().trim().min(1).nullable().optional(),
  cardmarketSetSlug: z.string().trim().min(1).nullable().optional(),
  cardmarketIdExpansion: z.coerce.number().int().positive().nullable().optional(),
  confidence: z.enum(['high', 'medium', 'low']).default('high'),
  source: z.string().trim().min(1).default('manual'),
});

export const linkageSetMappingUpdateSchema = linkageSetMappingUpsertSchema.partial().extend({
  ourSetId: z.string().min(1).optional(),
});

export const linkageManualLinkSchema = z.object({
  cardId: z.string().min(1),
});

export const linkageUpdateSchema = z.object({
  status: z.enum(['auto_linked', 'needs_review', 'unlinked', 'rejected']).optional(),
  score: z.number().min(0).max(1).optional(),
  confidenceBand: z.enum(['high', 'medium', 'low']).optional(),
  cardId: z.string().nullable().optional(),
  provenance: z.string().min(1).optional(),
});

export const linkageImportPayloadSchema = z.object({
  createdAt: z.string().trim().min(1).optional(),
  products: z.array(z.any()).optional(),
  priceGuides: z.array(z.any()).optional(),
}).refine((value) => (value.products?.length ?? 0) > 0 || (value.priceGuides?.length ?? 0) > 0, {
  message: 'Provide at least one non-empty array: products or priceGuides',
}).refine((value) => (value.priceGuides?.length ?? 0) === 0 || Boolean(value.createdAt), {
  message: 'Price guide imports require a top-level "createdAt" string.',
});
