import type { Card, Set } from '@prisma/client';
import { env } from '../infrastructure/env';
import { createQueryHash } from '../infrastructure/hash';
import { PokemonTcgHttpClient } from '../infrastructure/pokemon-client';
import { prisma } from '../infrastructure/prisma';
import { isFresh, mapCardUpsertInput, mapSetUpsertInput } from '../domain/cache';
import { cardmarketEnrichmentService } from './cardmarket-enrichment-service';

type CardsApiResponse = { data: any[]; count: number; totalCount: number; page: number; pageSize: number };
type CardApiResponse = { data: any };
type SetsApiResponse = { data: any[]; count: number; totalCount: number; page: number; pageSize: number };
type SetApiResponse = { data: any };

const client = new PokemonTcgHttpClient(env.POKEMON_TCG_API_KEY);

const isMissingSetSearchCacheOrderByColumn = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const maybeCode = (error as { code?: unknown }).code;
  const maybeMeta = (error as { meta?: { column?: unknown } }).meta;
  return maybeCode === 'P2022' && maybeMeta?.column === 'SetSearchCache.orderBy';
};

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
  async getCardById(id: string): Promise<{ card: Card; stale?: boolean; cardmarket: Awaited<ReturnType<typeof cardmarketEnrichmentService.getCardmarketDetail>> }> {
    const cached = await prisma.card.findUnique({ where: { id } });
    if (cached && isFresh(cached.expiresAt)) {
      const cardmarket = await cardmarketEnrichmentService.getCardmarketDetail(cached);
      return { card: cached, cardmarket };
    }

    try {
      const payload = await client.getJson<CardApiResponse>(`/cards/${id}`);
      const mapped = mapCardUpsertInput(payload.data, env.CARD_TTL_SECONDS);
      const card = await prisma.card.upsert({
        where: { id: mapped.id },
        create: mapped,
        update: mapped,
      });
      const cardmarket = await cardmarketEnrichmentService.getCardmarketDetail(card);
      return { card, cardmarket };
    } catch (error) {
      if (cached) {
        const cardmarket = await cardmarketEnrichmentService.getCardmarketDetail(cached);
        return { card: cached, stale: true, cardmarket };
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

    console.info('[cards.search] start', {
      query,
      normalizedQuery,
      page,
      pageSize,
      orderBy: orderBy ?? null,
      queryHash,
      cacheFound: Boolean(cache),
      cacheFresh: cache ? isFresh(cache.expiresAt) : false,
    });

    if (cache && isFresh(cache.expiresAt)) {
      const cards = await prisma.card.findMany({ where: { id: { in: cache.cardIds } } });
      const ordered = cache.cardIds.map((id) => cards.find((c) => c.id === id)).filter(Boolean) as Card[];
      console.info('[cards.search] cache-hit', {
        queryHash,
        count: cache.count,
        totalCount: cache.totalCount,
        cardIds: cache.cardIds.length,
        returned: ordered.length,
      });
      return { data: ordered, count: cache.count, totalCount: cache.totalCount, stale: false };
    }

    try {
      const q = encodeURIComponent(normalizedQuery || '');
      const o = orderBy ? `&orderBy=${encodeURIComponent(orderBy)}` : '';
      const upstreamPath = `/cards?q=${q}&page=${page}&pageSize=${pageSize}${o}`;
      const payload = await client.getJson<CardsApiResponse>(upstreamPath);
      console.info('[cards.search] upstream-success', {
        queryHash,
        upstreamPath,
        count: payload.count,
        totalCount: payload.totalCount,
        dataLength: payload.data.length,
      });

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
      console.info('[cards.search] complete', {
        queryHash,
        persisted: mapped.length,
        returned: ordered.length,
        count: payload.count,
        totalCount: payload.totalCount,
      });
      return { data: ordered, count: payload.count, totalCount: payload.totalCount, stale: false };
    } catch (error) {
      console.error('[cards.search] upstream-failure', {
        queryHash,
        message: error instanceof Error ? error.message : String(error),
      });
      if (cache) {
        const cards = await prisma.card.findMany({ where: { id: { in: cache.cardIds } } });
        const ordered = cache.cardIds.map((id) => cards.find((c) => c.id === id)).filter(Boolean) as Card[];
        console.warn('[cards.search] stale-cache-fallback', {
          queryHash,
          count: cache.count,
          totalCount: cache.totalCount,
          cardIds: cache.cardIds.length,
          returned: ordered.length,
        });
        return { data: ordered, count: cache.count, totalCount: cache.totalCount, stale: true };
      }
      throw error;
    }
  }

  async searchSets(query: string, page: number, pageSize: number, orderBy?: string) {
    const normalizedQuery = normalizeSetsQuery(query);
    const effectiveOrderBy = orderBy ?? '-releaseDate';
    const queryHash = createQueryHash({ query: normalizedQuery, page, pageSize, orderBy: effectiveOrderBy });
    let cache: Awaited<ReturnType<typeof prisma.setSearchCache.findUnique>> = null;
    try {
      cache = await prisma.setSearchCache.findUnique({ where: { queryHash } });
    } catch (error) {
      if (isMissingSetSearchCacheOrderByColumn(error)) {
        console.warn('[sets.search] set cache schema mismatch; bypassing set cache', {
          queryHash,
          missingColumn: 'SetSearchCache.orderBy',
        });
      } else {
        throw error;
      }
    }

    if (cache && isFresh(cache.expiresAt)) {
      const sets = await prisma.set.findMany({ where: { id: { in: cache.setIds } } });
      const ordered = cache.setIds.map((id) => sets.find((s) => s.id === id)).filter(Boolean) as Set[];
      return { data: ordered, count: cache.count, totalCount: cache.totalCount, stale: false };
    }

    try {
      const q = encodeURIComponent(normalizedQuery || '');
      const o = effectiveOrderBy ? `&orderBy=${encodeURIComponent(effectiveOrderBy)}` : '';
      const payload = await client.getJson<SetsApiResponse>(`/sets?q=${q}&page=${page}&pageSize=${pageSize}${o}`);
      const mapped = payload.data.map((set) => mapSetUpsertInput(set, env.SET_TTL_SECONDS));

      await prisma.$transaction(
        mapped.map((set) => prisma.set.upsert({ where: { id: set.id }, create: set, update: set })),
      );

      const setIds = mapped.map((set) => set.id);
      const expiresAt = new Date(Date.now() + env.SEARCH_TTL_SECONDS * 1000);

      try {
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
      } catch (error) {
        if (isMissingSetSearchCacheOrderByColumn(error)) {
          console.warn('[sets.search] skipped set cache upsert due to schema mismatch', {
            queryHash,
            missingColumn: 'SetSearchCache.orderBy',
          });
        } else {
          throw error;
        }
      }

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
