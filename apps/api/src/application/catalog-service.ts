import type { Card, Set } from '@prisma/client';
import { env } from '../infrastructure/env';
import { createQueryHash } from '../infrastructure/hash';
import { PokemonTcgHttpClient } from '../infrastructure/pokemon-client';
import { prisma } from '../infrastructure/prisma';
import { isFresh, mapCardUpsertInput, mapSetUpsertInput } from '../domain/cache';

type CardsApiResponse = { data: any[]; count: number; totalCount: number; page: number; pageSize: number };
type CardApiResponse = { data: any };
type SetsApiResponse = { data: any[]; count: number; totalCount: number; page: number; pageSize: number };
type SetApiResponse = { data: any };

const client = new PokemonTcgHttpClient(env.POKEMON_TCG_API_KEY);

const hasAdvancedQuerySyntax = (value: string): boolean => /[:()"]/g.test(value);

const escapeQueryValue = (value: string): string => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const normalizeCardsQuery = (query: string): string => {
  const trimmed = query.trim();
  if (!trimmed) return '';
  if (hasAdvancedQuerySyntax(trimmed)) return trimmed;
  return `name:"*${escapeQueryValue(trimmed)}*"`;
};

const normalizeSetsQuery = (query: string): string => {
  const trimmed = query.trim();
  if (!trimmed) return '';
  if (hasAdvancedQuerySyntax(trimmed)) return trimmed;
  return `name:"*${escapeQueryValue(trimmed)}*"`;
};

export class CatalogService {
  async getCardById(id: string): Promise<{ card: Card; stale?: boolean }> {
    const cached = await prisma.card.findUnique({ where: { id } });
    if (cached && isFresh(cached.expiresAt)) {
      return { card: cached };
    }

    try {
      const payload = await client.getJson<CardApiResponse>(`/cards/${id}`);
      const mapped = mapCardUpsertInput(payload.data, env.CARD_TTL_SECONDS);
      const card = await prisma.card.upsert({
        where: { id: mapped.id },
        create: mapped,
        update: mapped,
      });
      return { card };
    } catch (error) {
      if (cached) {
        return { card: cached, stale: true };
      }
      throw error;
    }
  }

  async getSetById(id: string): Promise<{ set: Set; stale?: boolean }> {
    const cached = await prisma.set.findUnique({ where: { id } });
    if (cached && isFresh(cached.expiresAt)) {
      return { set: cached };
    }

    try {
      const payload = await client.getJson<SetApiResponse>(`/sets/${id}`);
      const mapped = mapSetUpsertInput(payload.data, env.SET_TTL_SECONDS);
      const set = await prisma.set.upsert({
        where: { id: mapped.id },
        create: mapped,
        update: mapped,
      });
      return { set };
    } catch (error) {
      if (cached) {
        return { set: cached, stale: true };
      }
      throw error;
    }
  }

  async searchCards(query: string, page: number, pageSize: number, orderBy?: string) {
    const normalizedQuery = normalizeCardsQuery(query);
    const queryHash = createQueryHash({ query: normalizedQuery, page, pageSize, orderBy });
    const cache = await prisma.cardSearchCache.findUnique({ where: { queryHash } });

    if (cache && isFresh(cache.expiresAt)) {
      const cards = await prisma.card.findMany({ where: { id: { in: cache.cardIds } } });
      const ordered = cache.cardIds.map((id) => cards.find((c) => c.id === id)).filter(Boolean) as Card[];
      return { data: ordered, count: cache.count, totalCount: cache.totalCount, stale: false };
    }

    try {
      const q = encodeURIComponent(normalizedQuery || '');
      const o = orderBy ? `&orderBy=${encodeURIComponent(orderBy)}` : '';
      const payload = await client.getJson<CardsApiResponse>(`/cards?q=${q}&page=${page}&pageSize=${pageSize}${o}`);

      const mapped = payload.data.map((card) => mapCardUpsertInput(card, env.CARD_TTL_SECONDS));
      await prisma.$transaction(
        mapped.map((card) =>
          prisma.card.upsert({ where: { id: card.id }, create: card, update: card }),
        ),
      );

      const expiresAt = new Date(Date.now() + env.SEARCH_TTL_SECONDS * 1000);
      const cardIds = mapped.map((card) => card.id);

      await prisma.cardSearchCache.upsert({
        where: { queryHash },
        create: {
          queryHash,
          query: normalizedQuery,
          page,
          pageSize,
          orderBy: orderBy ?? null,
          cardIds,
          count: payload.count,
          totalCount: payload.totalCount,
          fetchedAt: new Date(),
          expiresAt,
        },
        update: {
          query: normalizedQuery,
          page,
          pageSize,
          orderBy: orderBy ?? null,
          cardIds,
          count: payload.count,
          totalCount: payload.totalCount,
          fetchedAt: new Date(),
          expiresAt,
        },
      });

      const cards = await prisma.card.findMany({ where: { id: { in: cardIds } } });
      const ordered = cardIds.map((id) => cards.find((c) => c.id === id)).filter(Boolean) as Card[];
      return { data: ordered, count: payload.count, totalCount: payload.totalCount, stale: false };
    } catch (error) {
      if (cache) {
        const cards = await prisma.card.findMany({ where: { id: { in: cache.cardIds } } });
        const ordered = cache.cardIds.map((id) => cards.find((c) => c.id === id)).filter(Boolean) as Card[];
        return { data: ordered, count: cache.count, totalCount: cache.totalCount, stale: true };
      }
      throw error;
    }
  }

  async searchSets(query: string, page: number, pageSize: number) {
    const normalizedQuery = normalizeSetsQuery(query);
    const queryHash = createQueryHash({ query: normalizedQuery, page, pageSize });
    const cache = await prisma.setSearchCache.findUnique({ where: { queryHash } });

    if (cache && isFresh(cache.expiresAt)) {
      const sets = await prisma.set.findMany({ where: { id: { in: cache.setIds } } });
      const ordered = cache.setIds.map((id) => sets.find((s) => s.id === id)).filter(Boolean) as Set[];
      return { data: ordered, count: cache.count, totalCount: cache.totalCount, stale: false };
    }

    try {
      const q = encodeURIComponent(normalizedQuery || '');
      const payload = await client.getJson<SetsApiResponse>(`/sets?q=${q}&page=${page}&pageSize=${pageSize}`);
      const mapped = payload.data.map((set) => mapSetUpsertInput(set, env.SET_TTL_SECONDS));

      await prisma.$transaction(
        mapped.map((set) => prisma.set.upsert({ where: { id: set.id }, create: set, update: set })),
      );

      const setIds = mapped.map((set) => set.id);
      const expiresAt = new Date(Date.now() + env.SEARCH_TTL_SECONDS * 1000);

      await prisma.setSearchCache.upsert({
        where: { queryHash },
        create: {
          queryHash,
          query: normalizedQuery,
          page,
          pageSize,
          setIds,
          count: payload.count,
          totalCount: payload.totalCount,
          fetchedAt: new Date(),
          expiresAt,
        },
        update: {
          query: normalizedQuery,
          page,
          pageSize,
          setIds,
          count: payload.count,
          totalCount: payload.totalCount,
          fetchedAt: new Date(),
          expiresAt,
        },
      });

      const sets = await prisma.set.findMany({ where: { id: { in: setIds } } });
      const ordered = setIds.map((id) => sets.find((s) => s.id === id)).filter(Boolean) as Set[];
      return { data: ordered, count: payload.count, totalCount: payload.totalCount, stale: false };
    } catch (error) {
      if (cache) {
        const sets = await prisma.set.findMany({ where: { id: { in: cache.setIds } } });
        const ordered = cache.setIds.map((id) => sets.find((s) => s.id === id)).filter(Boolean) as Set[];
        return { data: ordered, count: cache.count, totalCount: cache.totalCount, stale: true };
      }
      throw error;
    }
  }
}

export const catalogService = new CatalogService();
