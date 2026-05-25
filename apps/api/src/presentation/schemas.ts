import { z } from 'zod';

export const cardsQuerySchema = z.object({
  query: z.string().default(''),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.string().optional(),
});

export const cardsBatchSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1).max(100),
});

export const setsQuerySchema = z.object({
  query: z.string().default(''),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.string().default('-releaseDate'),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(120).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export const collectionCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const collectionUpdateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
});

export const collectionItemCreateSchema = z.object({
  cardId: z.string().trim().min(1),
  quantity: z.coerce.number().int().min(1).max(999).default(1),
  condition: z.string().trim().min(1).max(80).nullable().optional(),
  finish: z.string().trim().min(1).max(80).nullable().optional(),
  language: z.string().trim().min(2).max(8).default('en'),
  notes: z.string().trim().max(2000).nullable().optional(),
  purchasePriceCents: z.coerce.number().int().min(0).nullable().optional(),
});

export const collectionItemUpdateSchema = collectionItemCreateSchema
  .omit({ cardId: true })
  .partial()
  .extend({
    quantity: z.coerce.number().int().min(1).max(999).optional(),
  });
