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
const NATURAL_NUMBER_SORT_PAGE_SIZE = 100;
const NATURAL_NUMBER_SORT_MODE = 'natural-number-v1';
const naturalNumberCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const isMissingSetSearchCacheOrderByColumn = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const maybeCode = (error as { code?: unknown }).code;
  const maybeMeta = (error as { meta?: { column?: unknown } }).meta;
  return maybeCode === 'P2022' && maybeMeta?.column === 'SetSearchCache.orderBy';
};

const hasAdvancedQuerySyntax = (value: string): boolean => /[:()"]/g.test(value);

const escapeQueryValue = (value: string): string => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const hasExactSetFilter = (query: string): boolean => /(?:^|\s|\()set\.id:[A-Za-z0-9_-]+(?=$|\s|\))/i.test(query);

const getExactSetOnlyId = (query: string): string | null => {
  const match = query.trim().match(/^set\.id:([A-Za-z0-9_-]+)$/i);
  return match?.[1] ?? null;
};

const shouldUseNaturalNumberSort = (query: string, orderBy?: string): boolean =>
  orderBy === 'number' && hasExactSetFilter(query);

const getCollectorNumber = (card: any): string => {
  const rawNumber = typeof card?.number === 'string' ? card.number : '';
  if (rawNumber.trim()) return rawNumber.trim();

  const id = typeof card?.id === 'string' ? card.id : '';
  return id.split('-').at(-1) ?? '';
};

const compareCardsByCollectorNumber = (a: any, b: any): number => {
  const numberCompare = naturalNumberCollator.compare(getCollectorNumber(a), getCollectorNumber(b));
  if (numberCompare !== 0) return numberCompare;

  return String(a?.id ?? '').localeCompare(String(b?.id ?? ''));
};

const getCachedCardSortPayload = (card: Card) => {
  const raw = card.raw;
  const number =
    raw && typeof raw === 'object' && !Array.isArray(raw) && typeof (raw as { number?: unknown }).number === 'string'
      ? ((raw as { number: string }).number)
      : undefined;

  return { id: card.id, number };
};

const compareCachedCardsByCollectorNumber = (a: Card, b: Card): number =>
  compareCardsByCollectorNumber(getCachedCardSortPayload(a), getCachedCardSortPayload(b));

const getCachedExactSetNumberPage = async (
  query: string,
  page: number,
  pageSize: number,
): Promise<{ data: Card[]; count: number; totalCount: number; stale: boolean } | null> => {
  const setId = getExactSetOnlyId(query);
  if (!setId) return null;

  const cards = await prisma.card.findMany({ where: { setId } });
  if (!cards.length) return null;

  const sorted = [...cards].sort(compareCachedCardsByCollectorNumber);
  const start = (page - 1) * pageSize;
  const data = sorted.slice(start, start + pageSize);

  return {
    data,
    count: data.length,
    totalCount: sorted.length,
    stale: sorted.some((card) => !isFresh(card.expiresAt)),
  };
};

const buildCardsPath = (query: string, page: number, pageSize: number, orderBy?: string): string => {
  const q = encodeURIComponent(query || '');
  const o = orderBy ? `&orderBy=${encodeURIComponent(orderBy)}` : '';
  return `/cards?q=${q}&page=${page}&pageSize=${pageSize}${o}`;
};

const fetchCardsPage = (query: string, page: number, pageSize: number, orderBy?: string): Promise<CardsApiResponse> =>
  client.getJson<CardsApiResponse>(buildCardsPath(query, page, pageSize, orderBy));

const fetchCardsWithNaturalNumberSort = async (
  query: string,
  page: number,
  pageSize: number,
): Promise<CardsApiResponse> => {
  const firstPage = await fetchCardsPage(query, 1, NATURAL_NUMBER_SORT_PAGE_SIZE);
  const totalPages = Math.ceil(firstPage.totalCount / NATURAL_NUMBER_SORT_PAGE_SIZE);
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(totalPages - 1, 0) }, (_, index) =>
      fetchCardsPage(query, index + 2, NATURAL_NUMBER_SORT_PAGE_SIZE),
    ),
  );
  const sorted = [firstPage, ...remainingPages]
    .flatMap((payload) => payload.data)
    .sort(compareCardsByCollectorNumber);
  const start = (page - 1) * pageSize;
  const data = sorted.slice(start, start + pageSize);

  return {
    data,
    count: data.length,
    totalCount: firstPage.totalCount,
    page,
    pageSize,
  };
};

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

  async ensureCardById(id: string): Promise<Card> {
    const result = await this.getCardById(id);
    return result.card;
  }

  async getCardsByIds(ids: string[]): Promise<Card[]> {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (!uniqueIds.length) return [];

    const cached = await prisma.card.findMany({ where: { id: { in: uniqueIds } } });
    const freshIds = new Set(cached.filter((card) => isFresh(card.expiresAt)).map((card) => card.id));
    const missingOrStaleIds = uniqueIds.filter((id) => !freshIds.has(id));

    const refreshed = await Promise.all(
      missingOrStaleIds.map((id) => this.getCardById(id).then((result) => result.card).catch(() => null)),
    );
    const byId = new Map<string, Card>();
    for (const card of cached) byId.set(card.id, card);
    for (const card of refreshed) {
      if (card) byId.set(card.id, card);
    }
    return uniqueIds.map((id) => byId.get(id)).filter(Boolean) as Card[];
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
    const useNaturalNumberSort = shouldUseNaturalNumberSort(normalizedQuery, orderBy);
    const queryHash = createQueryHash({
      query: normalizedQuery,
      page,
      pageSize,
      orderBy,
      sortMode: useNaturalNumberSort ? NATURAL_NUMBER_SORT_MODE : undefined,
    });
    const cache = await prisma.cardSearchCache.findUnique({ where: { queryHash } });

    console.info('[cards.search] start', {
      query,
      normalizedQuery,
      page,
      pageSize,
      orderBy: orderBy ?? null,
      sortMode: useNaturalNumberSort ? NATURAL_NUMBER_SORT_MODE : null,
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

    if (useNaturalNumberSort) {
      const cachedSetPage = await getCachedExactSetNumberPage(normalizedQuery, page, pageSize);

      if (cachedSetPage) {
        const expiresAt = new Date(Date.now() + env.SEARCH_TTL_SECONDS * 1000);
        const cardIds = cachedSetPage.data.map((card) => card.id);

        await prisma.cardSearchCache.upsert({
          where: { queryHash },
          create: {
            queryHash,
            query: normalizedQuery,
            page,
            pageSize,
            orderBy: orderBy ?? null,
            cardIds,
            count: cachedSetPage.count,
            totalCount: cachedSetPage.totalCount,
            fetchedAt: new Date(),
            expiresAt,
          },
          update: {
            query: normalizedQuery,
            page,
            pageSize,
            orderBy: orderBy ?? null,
            cardIds,
            count: cachedSetPage.count,
            totalCount: cachedSetPage.totalCount,
            fetchedAt: new Date(),
            expiresAt,
          },
        });

        console.info('[cards.search] cached-set-natural-number-sort', {
          queryHash,
          count: cachedSetPage.count,
          totalCount: cachedSetPage.totalCount,
          stale: cachedSetPage.stale,
        });
        return {
          data: cachedSetPage.data,
          count: cachedSetPage.count,
          totalCount: cachedSetPage.totalCount,
          stale: cachedSetPage.stale,
        };
      }
    }

    try {
      const upstreamPath = useNaturalNumberSort
        ? `${buildCardsPath(normalizedQuery, 1, NATURAL_NUMBER_SORT_PAGE_SIZE)} + natural sort`
        : buildCardsPath(normalizedQuery, page, pageSize, orderBy);
      const payload = useNaturalNumberSort
        ? await fetchCardsWithNaturalNumberSort(normalizedQuery, page, pageSize)
        : await fetchCardsPage(normalizedQuery, page, pageSize, orderBy);
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
            orderBy: effectiveOrderBy,
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
            orderBy: effectiveOrderBy,
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
