import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../infrastructure/prisma';
import { env } from '../infrastructure/env';
type CardLinkStatus = 'auto_linked' | 'needs_review' | 'unlinked' | 'rejected';
type CardLinkConfidenceBand = 'high' | 'medium' | 'low';
const db = prisma as any;
type ImportJobStatus = 'queued' | 'running' | 'completed' | 'failed';

type ImportJob = {
  jobId: string;
  status: ImportJobStatus;
  total: number;
  processed: number;
  updated: number;
  failed: number;
  progressPct: number;
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
};

type RawProduct = {
  idProduct: number;
  name?: string;
  idCategory?: number;
  categoryName?: string;
  idExpansion?: number;
  idMetacard?: number;
  dateAdded?: string;
};

type RawPrice = {
  idProduct: number;
  idCategory?: number | null;
  avg?: number | null;
  low?: number | null;
  trend?: number | null;
  avg1?: number | null;
  avg7?: number | null;
  avg30?: number | null;
  ['avg-holo']?: number | null;
  ['low-holo']?: number | null;
  ['trend-holo']?: number | null;
  ['avg1-holo']?: number | null;
  ['avg7-holo']?: number | null;
  ['avg30-holo']?: number | null;
};

type ImportPayload = {
  createdAt?: string;
  products?: RawProduct[];
  priceGuides?: RawPrice[];
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const toSnapshotDate = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const toPriceGuideData = (price: RawPrice) => ({
  idCategory: typeof price.idCategory === 'number' ? price.idCategory : null,
  avg: asNumber(price.avg),
  low: asNumber(price.low),
  trend: asNumber(price.trend),
  avg1: asNumber(price.avg1),
  avg7: asNumber(price.avg7),
  avg30: asNumber(price.avg30),
  avgHolo: asNumber(price['avg-holo']),
  lowHolo: asNumber(price['low-holo']),
  trendHolo: asNumber(price['trend-holo']),
  avg1Holo: asNumber(price['avg1-holo']),
  avg7Holo: asNumber(price['avg7-holo']),
  avg30Holo: asNumber(price['avg30-holo']),
  raw: price,
});

const confidenceBand = (score: number): CardLinkConfidenceBand =>
  score >= 0.85 ? 'high' : score >= 0.6 ? 'medium' : 'low';

const statusFromScore = (score: number): CardLinkStatus => (score >= 0.85 ? 'auto_linked' : score >= 0.6 ? 'needs_review' : 'unlinked');

const asNumber = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);

const scoreAgainstCard = (productName: string, cardName: string): number => {
  const source = normalize(productName);
  const target = normalize(cardName);
  if (!source || !target) return 0;
  if (source === target) return 0.98;
  if (source.includes(target) || target.includes(source)) return 0.78;
  const sourceTokens = new Set(source.split(' ').filter(Boolean));
  const targetTokens = new Set(target.split(' ').filter(Boolean));
  const common = [...sourceTokens].filter((token) => targetTokens.has(token)).length;
  if (!common) return 0;
  return common / Math.max(sourceTokens.size, targetTokens.size);
};

const createHistory = async (cardLinkId: string, action: string, payload: unknown) => {
  await db.cardLinkHistory.create({
    data: {
      cardLinkId,
      action,
      payload,
    },
  });
};

const importJobs = new Map<string, ImportJob>();

const toProgressPct = (processed: number, total: number) => (total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 100);

const createJobId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const parseJsonFile = async <T>(filePath: string): Promise<T> => {
  const resolvedPath = path.resolve(filePath);
  const content = await readFile(resolvedPath, 'utf8');
  return JSON.parse(content) as T;
};

const parseSourceCreatedAtOrThrow = (value: string | undefined): Date => {
  if (!value) {
    throw new Error('Price guide import is missing top-level "createdAt".');
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid price guide "createdAt": "${value}".`);
  }
  return date;
};

const toIsoSafe = (value: Date | null) => (value ? value.toISOString() : null);

export const linkageService = {
  async runImport(onProgress?: (progress: { total: number; processed: number; updated: number; failed: number }) => void) {
    const hasProductsSource = Boolean(env.CARDMARKET_PRODUCTS_PATH || env.CARDMARKET_PRODUCTS_URL);
    const hasPricesSource = Boolean(env.CARDMARKET_PRICE_GUIDE_PATH || env.CARDMARKET_PRICE_GUIDE_URL);
    console.info('[linkage.import] start', {
      productsSource: env.CARDMARKET_PRODUCTS_PATH ? 'path' : env.CARDMARKET_PRODUCTS_URL ? 'url' : 'missing',
      productsPath: env.CARDMARKET_PRODUCTS_PATH ?? null,
      productsUrl: env.CARDMARKET_PRODUCTS_URL ?? null,
      pricesSource: env.CARDMARKET_PRICE_GUIDE_PATH ? 'path' : env.CARDMARKET_PRICE_GUIDE_URL ? 'url' : 'missing',
      pricesPath: env.CARDMARKET_PRICE_GUIDE_PATH ?? null,
      pricesUrl: env.CARDMARKET_PRICE_GUIDE_URL ?? null,
      matchLinks: env.CARDMARKET_IMPORT_MATCH_LINKS,
    });
    if (!hasProductsSource || !hasPricesSource) {
      throw new Error(
        'Missing import source. Provide CARDMARKET_PRODUCTS_PATH or CARDMARKET_PRODUCTS_URL, and CARDMARKET_PRICE_GUIDE_PATH or CARDMARKET_PRICE_GUIDE_URL.',
      );
    }

    const [rawProducts, rawPrices] = await Promise.all([
      env.CARDMARKET_PRODUCTS_PATH
        ? parseJsonFile<{ products?: RawProduct[] }>(env.CARDMARKET_PRODUCTS_PATH)
        : (async () => {
            const response = await fetch(env.CARDMARKET_PRODUCTS_URL as string);
            if (!response.ok) throw new Error(`Products source fetch failed (${response.status}).`);
            return (await response.json()) as { products?: RawProduct[] };
          })(),
      env.CARDMARKET_PRICE_GUIDE_PATH
        ? parseJsonFile<{ createdAt?: string; priceGuides?: RawPrice[] }>(env.CARDMARKET_PRICE_GUIDE_PATH)
        : (async () => {
            const response = await fetch(env.CARDMARKET_PRICE_GUIDE_URL as string);
            if (!response.ok) throw new Error(`Price guide source fetch failed (${response.status}).`);
            return (await response.json()) as { createdAt?: string; priceGuides?: RawPrice[] };
          })(),
    ]);

    const products = Array.isArray(rawProducts.products) ? rawProducts.products : [];
    const prices = Array.isArray(rawPrices.priceGuides) ? rawPrices.priceGuides : [];
    return this.runImportFromPayload(
      {
        ...(rawPrices.createdAt ? { createdAt: rawPrices.createdAt } : {}),
        products,
        priceGuides: prices,
      },
      onProgress,
    );
  },

  async runImportFromPayload(
    payload: ImportPayload,
    onProgress?: (progress: { total: number; processed: number; updated: number; failed: number }) => void,
  ) {
    const importStartedAt = new Date();
    const snapshotDate = toSnapshotDate(importStartedAt);
    const prices = Array.isArray(payload.priceGuides) ? payload.priceGuides : [];
    const productsFromPayload = Array.isArray(payload.products) ? payload.products : [];
    console.info('[linkage.import.payload] received', {
      createdAt: payload.createdAt ?? null,
      productsCount: productsFromPayload.length,
      priceGuidesCount: prices.length,
    });
    if (productsFromPayload.length === 0 && prices.length === 0) {
      throw new Error('Import payload must include at least one of: products, priceGuides.');
    }
    const products: RawProduct[] =
      productsFromPayload.length > 0
        ? productsFromPayload
        : prices.map((price) => ({
            idProduct: price.idProduct,
            name: `Cardmarket Product ${price.idProduct}`,
            ...(typeof price.idCategory === 'number' ? { idCategory: price.idCategory } : {}),
          }));

    if (prices.length > 0) {
      const sourceCreatedAt = parseSourceCreatedAtOrThrow(payload.createdAt);
      console.info('[linkage.import.price] guard-check-start', {
        sourceCreatedAt: sourceCreatedAt.toISOString(),
        guideCount: prices.length,
      });
      if (!db.cardmarketPriceGuideImport) {
        throw new Error(
          'Price import guard is not available in the current Prisma client. Run Prisma migration/generate and restart the API.',
        );
      }
      try {
        await db.cardmarketPriceGuideImport.create({
          data: {
            sourceCreatedAt,
            guideCount: prices.length,
          },
        });
        console.info('[linkage.import.price] guard-check-passed', {
          sourceCreatedAt: sourceCreatedAt.toISOString(),
          guideCount: prices.length,
        });
      } catch (error: any) {
        if (error?.code === 'P2002') {
          console.warn('[linkage.import.price] guard-check-duplicate', {
            sourceCreatedAt: sourceCreatedAt.toISOString(),
            guideCount: prices.length,
          });
          throw new Error(`Price guide with createdAt "${payload.createdAt}" was already imported.`);
        }
        console.error('[linkage.import.price] guard-check-failed', {
          sourceCreatedAt: sourceCreatedAt.toISOString(),
          guideCount: prices.length,
          error: error instanceof Error ? error.message : 'unknown error',
        });
        throw error;
      }
    }

    console.info('[linkage.import] fetched', { products: products.length, prices: prices.length, source: 'payload' });

    const priceMap = new Map(prices.map((price) => [price.idProduct, price]));
    const cards = env.CARDMARKET_IMPORT_MATCH_LINKS ? await db.card.findMany({ select: { id: true, name: true } }) : [];

    let processed = 0;
    let updated = 0;
    let failed = 0;
    const total = products.length;

    onProgress?.({ total, processed, updated, failed });

    for (const product of products) {
      try {
        const price = priceMap.get(product.idProduct);
        const productName = product.name ?? `Cardmarket Product ${product.idProduct}`;
        await db.cardmarketProduct.upsert({
          where: { idProduct: product.idProduct },
          create: {
            idProduct: product.idProduct,
            name: productName,
            idCategory: product.idCategory ?? null,
            categoryName: product.categoryName ?? null,
            idExpansion: product.idExpansion ?? null,
            idMetacard: product.idMetacard ?? null,
            dateAdded: product.dateAdded ?? null,
            raw: product,
          },
          update: {
            name: productName,
            idCategory: product.idCategory ?? null,
            categoryName: product.categoryName ?? null,
            idExpansion: product.idExpansion ?? null,
            idMetacard: product.idMetacard ?? null,
            dateAdded: product.dateAdded ?? null,
            raw: product,
          },
        });

        if (price) {
          const priceData = toPriceGuideData(price);
          await db.cardmarketPriceGuide.upsert({
            where: { idProduct: product.idProduct },
            create: {
              idProduct: product.idProduct,
              ...priceData,
            },
            update: {
              ...priceData,
            },
          });

          await db.cardmarketPriceGuideSnapshot.upsert({
            where: {
              idProduct_snapshotDate: {
                idProduct: product.idProduct,
                snapshotDate,
              },
            },
            create: {
              idProduct: product.idProduct,
              snapshotDate,
              ...priceData,
            },
            update: {
              ...priceData,
            },
          });
        }

        if (env.CARDMARKET_IMPORT_MATCH_LINKS) {
          let bestCardId: string | null = null;
          let bestScore = 0;
          for (const card of cards) {
            const score = scoreAgainstCard(productName, card.name);
            if (score > bestScore) {
              bestScore = score;
              bestCardId = card.id;
            }
          }

          const status = statusFromScore(bestScore);
          const band = confidenceBand(bestScore);
          const existing = await db.cardLink.findUnique({ where: { idProduct: product.idProduct } });
          const link = await db.cardLink.upsert({
            where: { idProduct: product.idProduct },
            create: {
              idProduct: product.idProduct,
              cardId: status === 'unlinked' ? null : bestCardId,
              score: bestScore,
              confidenceBand: band,
              status,
              provenance: 'import:auto',
            },
            update: {
              cardId: status === 'unlinked' ? null : bestCardId,
              score: bestScore,
              confidenceBand: band,
              status,
              provenance: 'import:auto',
            },
            include: { product: true, card: true },
          });
          await createHistory(link.id, existing ? 'import_refresh' : 'import_create', {
            status: link.status,
            score: link.score,
            confidenceBand: link.confidenceBand,
            cardId: link.cardId,
          });
        }

        processed += 1;
        updated += 1;
      } catch {
        processed += 1;
        failed += 1;
      }
      onProgress?.({ total, processed, updated, failed });
    }

    return { started: true, total, processed, updated, failed };
  },

  startImportJob() {
    const jobId = createJobId();
    const startedAt = new Date().toISOString();
    const initial: ImportJob = {
      jobId,
      status: 'queued',
      total: 0,
      processed: 0,
      updated: 0,
      failed: 0,
      progressPct: 0,
      startedAt,
      finishedAt: null,
      error: null,
    };
    importJobs.set(jobId, initial);

    const setState = (next: Partial<ImportJob>) => {
      const current = importJobs.get(jobId);
      if (!current) return;
      importJobs.set(jobId, { ...current, ...next });
    };

    void (async () => {
      try {
        setState({ status: 'running' });
        const result = await this.runImport((progress) => {
          setState({
            total: progress.total,
            processed: progress.processed,
            updated: progress.updated,
            failed: progress.failed,
            progressPct: toProgressPct(progress.processed, progress.total),
          });
        });
        setState({
          status: 'completed',
          total: result.total,
          processed: result.processed,
          updated: result.updated,
          failed: result.failed,
          progressPct: 100,
          finishedAt: new Date().toISOString(),
        });
        console.info('[linkage.import.job] completed', {
          jobId,
          total: result.total,
          processed: result.processed,
          updated: result.updated,
          failed: result.failed,
        });
      } catch (error) {
        setState({
          status: 'failed',
          finishedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Import failed',
        });
        console.error('[linkage.import.job] failed', {
          jobId,
          error: error instanceof Error ? error.message : 'Import failed',
        });
      }
    })();

    return { jobId, status: initial.status };
  },

  startImportJobFromPayload(payload: ImportPayload) {
    const jobId = createJobId();
    const startedAt = new Date().toISOString();
    const initial: ImportJob = {
      jobId,
      status: 'queued',
      total: 0,
      processed: 0,
      updated: 0,
      failed: 0,
      progressPct: 0,
      startedAt,
      finishedAt: null,
      error: null,
    };
    importJobs.set(jobId, initial);

    const setState = (next: Partial<ImportJob>) => {
      const current = importJobs.get(jobId);
      if (!current) return;
      importJobs.set(jobId, { ...current, ...next });
    };

    void (async () => {
      try {
        setState({ status: 'running' });
        console.info('[linkage.import.job] started', {
          jobId,
          createdAt: payload.createdAt ?? null,
          productsCount: payload.products?.length ?? 0,
          priceGuidesCount: payload.priceGuides?.length ?? 0,
        });
        const result = await this.runImportFromPayload(payload, (progress) => {
          setState({
            total: progress.total,
            processed: progress.processed,
            updated: progress.updated,
            failed: progress.failed,
            progressPct: toProgressPct(progress.processed, progress.total),
          });
        });
        setState({
          status: 'completed',
          total: result.total,
          processed: result.processed,
          updated: result.updated,
          failed: result.failed,
          progressPct: 100,
          finishedAt: new Date().toISOString(),
        });
        console.info('[linkage.import.job] completed', {
          jobId,
          createdAt: payload.createdAt ?? null,
          total: result.total,
          processed: result.processed,
          updated: result.updated,
          failed: result.failed,
        });
      } catch (error) {
        setState({
          status: 'failed',
          finishedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Import failed',
        });
        console.error('[linkage.import.job] failed', {
          jobId,
          createdAt: payload.createdAt ?? null,
          productsCount: payload.products?.length ?? 0,
          priceGuidesCount: payload.priceGuides?.length ?? 0,
          error: error instanceof Error ? error.message : 'Import failed',
        });
      }
    })();

    return { jobId, status: initial.status };
  },

  getImportJob(jobId: string) {
    const job = importJobs.get(jobId);
    if (!job) return null;
    return job;
  },

  async summary() {
    const [total, autoLinked, needsReview, unlinked, rejected, high, medium, low] = await Promise.all([
      db.cardLink.count(),
      db.cardLink.count({ where: { status: 'auto_linked' } }),
      db.cardLink.count({ where: { status: 'needs_review' } }),
      db.cardLink.count({ where: { status: 'unlinked' } }),
      db.cardLink.count({ where: { status: 'rejected' } }),
      db.cardLink.count({ where: { confidenceBand: 'high' } }),
      db.cardLink.count({ where: { confidenceBand: 'medium' } }),
      db.cardLink.count({ where: { confidenceBand: 'low' } }),
    ]);

    return {
      total,
      status: { auto_linked: autoLinked, needs_review: needsReview, unlinked, rejected },
      confidence: { high, medium, low },
    };
  },

  async list(params: {
    page: number;
    pageSize: number;
    status?: CardLinkStatus | undefined;
    confidenceBand?: CardLinkConfidenceBand | undefined;
    query?: string | undefined;
    sortBy?: 'updatedAt' | 'score' | 'status' | undefined;
    sortOrder?: 'asc' | 'desc' | undefined;
  }) {
    const where: any = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.confidenceBand ? { confidenceBand: params.confidenceBand } : {}),
      ...(params.query
        ? {
            OR: [
              { product: { name: { contains: params.query, mode: 'insensitive' } } },
              { card: { name: { contains: params.query, mode: 'insensitive' } } },
              { product: { idProduct: Number.isNaN(Number(params.query)) ? undefined : Number(params.query) } },
            ],
          }
        : {}),
    };

    const orderBy: any = {
      [params.sortBy ?? 'updatedAt']: params.sortOrder ?? 'desc',
    };

    const [totalCount, data] = await Promise.all([
      db.cardLink.count({ where }),
      db.cardLink.findMany({
        where,
        orderBy,
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: {
          product: {
            include: {
              priceGuide: true,
            },
          },
          card: {
            select: {
              id: true,
              name: true,
              supertype: true,
              subtypes: true,
              hp: true,
              types: true,
              setId: true,
              setName: true,
              rarity: true,
              imageSmall: true,
              imageLarge: true,
            },
          },
        },
      }),
    ]);

    const mapped = data.map((item: any) => ({
      ...item,
      priceGuide: item.product?.priceGuide ?? null,
    }));

    return { data: mapped, totalCount, page: params.page, pageSize: params.pageSize, count: mapped.length };
  },

  async listProducts(params: {
    page: number;
    pageSize: number;
    query?: string | undefined;
    sortBy?: 'updatedAt' | 'idProduct' | 'name' | undefined;
    sortOrder?: 'asc' | 'desc' | undefined;
  }) {
    const queryValue = params.query?.trim() ?? '';
    const parsedQueryId = Number(queryValue);
    const queryId = Number.isNaN(parsedQueryId) ? null : parsedQueryId;
    const where: any = queryValue
      ? {
          OR: [
            { name: { contains: queryValue, mode: 'insensitive' } },
            { categoryName: { contains: queryValue, mode: 'insensitive' } },
            { idProduct: queryId ?? undefined },
            { idExpansion: queryId ?? undefined },
            { idMetacard: queryId ?? undefined },
          ],
        }
      : {};

    const orderBy: any = {
      [params.sortBy ?? 'updatedAt']: params.sortOrder ?? 'desc',
    };

    const [totalCount, data] = await Promise.all([
      db.cardmarketProduct.count({ where }),
      db.cardmarketProduct.findMany({
        where,
        orderBy,
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: {
          priceGuide: true,
          link: {
            select: {
              id: true,
              status: true,
              score: true,
              matchMethod: true,
              confidenceBand: true,
              cardId: true,
              updatedAt: true,
            },
          },
        },
      }),
    ]);

    return { data, totalCount, page: params.page, pageSize: params.pageSize, count: data.length };
  },

  async suggestCardsForProduct(idProduct: number, limit = 8) {
    const product = await db.cardmarketProduct.findUnique({
      where: { idProduct },
      select: {
        idProduct: true,
        name: true,
        idExpansion: true,
      },
    });

    if (!product) {
      throw new Error('Cardmarket product not found.');
    }

    const tokens = normalize(product.name ?? '')
      .split(' ')
      .filter(Boolean)
      .filter((token) => token.length >= 3)
      .slice(0, 6);

    const mappedSet = product.idExpansion
      ? await db.cardmarketSetMapping.findFirst({
          where: { cardmarketIdExpansion: product.idExpansion },
          select: { ourSetId: true },
        })
      : null;

    const candidates = await db.card.findMany({
      where: {
        OR: tokens.map((token) => ({ name: { contains: token, mode: 'insensitive' } })),
        ...(mappedSet ? { setId: mappedSet.ourSetId } : {}),
      },
      select: {
        id: true,
        name: true,
        supertype: true,
        subtypes: true,
        hp: true,
        types: true,
        setId: true,
        setName: true,
        rarity: true,
        imageSmall: true,
        imageLarge: true,
        updatedAt: true,
      },
      take: 120,
    });

    const scored = candidates
      .map((card: {
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
        updatedAt: Date;
      }) => {
        const baseScore = scoreAgainstCard(product.name ?? '', card.name);
        const setBoost = mappedSet && card.setId === mappedSet.ourSetId ? 0.2 : 0;
        const score = Math.min(1, baseScore + setBoost);
        return {
          card: {
            ...card,
            updatedAt: card.updatedAt.toISOString(),
          },
          score,
          reason: setBoost > 0 ? 'name_similarity+set_mapping' : 'name_similarity',
        };
      })
      .filter((item: { score: number }) => item.score > 0.12)
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
      .slice(0, limit);

    return {
      idProduct: product.idProduct,
      productName: product.name,
      mappedSetId: mappedSet?.ourSetId ?? null,
      data: scored,
      count: scored.length,
    };
  },

  async listSetMappings(params: {
    page: number;
    pageSize: number;
    query?: string | undefined;
    confidence?: CardLinkConfidenceBand | undefined;
    sortBy?: 'updatedAt' | 'ourSetId' | 'confidence' | 'evidenceCount' | undefined;
    sortOrder?: 'asc' | 'desc' | undefined;
  }) {
    const queryValue = params.query?.trim() ?? '';
    const parsedExpansion = Number(queryValue);
    const expansionQuery = Number.isNaN(parsedExpansion) ? null : parsedExpansion;
    const where: any = {
      ...(params.confidence ? { confidence: params.confidence } : {}),
      ...(queryValue
        ? {
            OR: [
              { ourSetId: { contains: queryValue, mode: 'insensitive' } },
              { cardmarketSetCode: { contains: queryValue, mode: 'insensitive' } },
              { cardmarketSetSlug: { contains: queryValue, mode: 'insensitive' } },
              { cardmarketIdExpansion: expansionQuery ?? undefined },
            ],
          }
        : {}),
    };

    const orderBy: any = {
      [params.sortBy ?? 'updatedAt']: params.sortOrder ?? 'desc',
    };

    const [totalCount, data] = await Promise.all([
      db.cardmarketSetMapping.count({ where }),
      db.cardmarketSetMapping.findMany({
        where,
        orderBy,
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
    ]);

    return { data, totalCount, page: params.page, pageSize: params.pageSize, count: data.length };
  },

  async upsertSetMapping(data: {
    ourSetId: string;
    cardmarketSetCode?: string | null | undefined;
    cardmarketSetSlug?: string | null | undefined;
    cardmarketIdExpansion?: number | null | undefined;
    confidence?: CardLinkConfidenceBand | undefined;
    source?: string | undefined;
  }) {
    return db.cardmarketSetMapping.upsert({
      where: { ourSetId: data.ourSetId },
      create: {
        ourSetId: data.ourSetId,
        cardmarketSetCode: data.cardmarketSetCode?.toUpperCase() ?? null,
        cardmarketSetSlug: data.cardmarketSetSlug ?? null,
        cardmarketIdExpansion: data.cardmarketIdExpansion ?? null,
        confidence: data.confidence ?? 'high',
        source: data.source ?? 'manual',
      },
      update: {
        cardmarketSetCode: data.cardmarketSetCode?.toUpperCase() ?? null,
        cardmarketSetSlug: data.cardmarketSetSlug ?? null,
        cardmarketIdExpansion: data.cardmarketIdExpansion ?? null,
        confidence: data.confidence ?? 'high',
        source: data.source ?? 'manual',
      },
    });
  },

  async updateSetMapping(
    id: string,
    data: {
      ourSetId?: string | undefined;
      cardmarketSetCode?: string | null | undefined;
      cardmarketSetSlug?: string | null | undefined;
      cardmarketIdExpansion?: number | null | undefined;
      confidence?: CardLinkConfidenceBand | undefined;
      source?: string | undefined;
    },
  ) {
    return db.cardmarketSetMapping.update({
      where: { id },
      data: {
        ...(data.ourSetId !== undefined ? { ourSetId: data.ourSetId } : {}),
        ...(data.cardmarketSetCode !== undefined ? { cardmarketSetCode: data.cardmarketSetCode?.toUpperCase() ?? null } : {}),
        ...(data.cardmarketSetSlug !== undefined ? { cardmarketSetSlug: data.cardmarketSetSlug ?? null } : {}),
        ...(data.cardmarketIdExpansion !== undefined ? { cardmarketIdExpansion: data.cardmarketIdExpansion ?? null } : {}),
        ...(data.confidence !== undefined ? { confidence: data.confidence } : {}),
        ...(data.source !== undefined ? { source: data.source } : {}),
      },
    });
  },

  async removeSetMapping(id: string) {
    return db.cardmarketSetMapping.delete({ where: { id } });
  },

  async approve(id: string) {
    const link = await db.cardLink.update({
      where: { id },
      data: { status: 'auto_linked' },
    });
    await createHistory(id, 'approve', { status: link.status });
    return link;
  },

  async reject(id: string) {
    const link = await db.cardLink.update({
      where: { id },
      data: { status: 'rejected', cardId: null, provenance: 'manual:reject' },
    });
    await createHistory(id, 'reject', { status: link.status });
    return link;
  },

  async manualLink(id: string, cardId: string) {
    const link = await db.cardLink.update({
      where: { id },
      data: {
        cardId,
        status: 'auto_linked',
        score: 1,
        confidenceBand: 'high',
        provenance: 'manual:link',
      },
      include: { card: { select: { id: true, name: true } } },
    });
    await createHistory(id, 'manual_link', { cardId, status: link.status });
    return link;
  },

  async manualLinkProduct(idProduct: number, cardId: string) {
    const existing = await db.cardLink.findUnique({
      where: { idProduct },
      select: { id: true },
    });

    const link = await db.cardLink.upsert({
      where: { idProduct },
      create: {
        idProduct,
        cardId,
        status: 'auto_linked',
        score: 1,
        matchMethod: 'manual_suggestion',
        confidenceBand: 'high',
        reviewedAt: new Date(),
        provenance: 'manual:product_suggestion',
      },
      update: {
        cardId,
        status: 'auto_linked',
        score: 1,
        matchMethod: 'manual_suggestion',
        confidenceBand: 'high',
        reviewedAt: new Date(),
        provenance: 'manual:product_suggestion',
      },
      include: { card: { select: { id: true, name: true } } },
    });

    await createHistory(link.id, existing ? 'manual_link' : 'manual_product_link', {
      cardId,
      idProduct,
      status: link.status,
    });
    return link;
  },

  async update(
    id: string,
    data: {
      status?: CardLinkStatus | undefined;
      score?: number | undefined;
      confidenceBand?: CardLinkConfidenceBand | undefined;
      cardId?: string | null | undefined;
      provenance?: string | undefined;
    },
  ) {
    const link = await db.cardLink.update({ where: { id }, data });
    await createHistory(id, 'update', data);
    return link;
  },

  async remove(id: string) {
    const deleted = await db.cardLink.delete({ where: { id } });
    return deleted;
  },

  async removeAllLinks() {
    const result = await db.cardLink.deleteMany({});
    return { deletedCount: result.count };
  },
};
