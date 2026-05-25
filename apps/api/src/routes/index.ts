import type { FastifyInstance } from 'fastify';
import { catalogService } from '../application/catalog-service';
import { linkageService } from '../application/linkage-service';
import { enqueueOrRunCardmarketEnrichment, resetCardmarketEnrichment } from '../features/cardmarket/cardmarket-enrichment.service';
import { env } from '../infrastructure/env';
import { paginated, toCardDetail, toCardSummary, toSetDetail, toSetSummary } from '../presentation/mappers';
import {
  cardsQuerySchema,
  linkageItemsQuerySchema,
  linkageImportPayloadSchema,
  linkageProductSuggestionsQuerySchema,
  linkageProductsQuerySchema,
  linkageManualLinkSchema,
  linkageSetMappingsQuerySchema,
  linkageSetMappingUpdateSchema,
  linkageSetMappingUpsertSchema,
  linkageUpdateSchema,
  setsQuerySchema,
} from '../presentation/schemas';

export const registerRoutes = (app: FastifyInstance): void => {
  app.get('/api/health', async () => ({ ok: true }));

  app.get('/api/cards', async (request) => {
    const params = cardsQuerySchema.parse(request.query);
    request.log.info(
      {
        query: params.query,
        page: params.page,
        pageSize: params.pageSize,
        orderBy: params.orderBy ?? null,
      },
      'GET /api/cards request',
    );
    const result = await catalogService.searchCards(params.query, params.page, params.pageSize, params.orderBy);
    request.log.info(
      {
        query: params.query,
        page: params.page,
        pageSize: params.pageSize,
        orderBy: params.orderBy ?? null,
        count: result.count,
        totalCount: result.totalCount,
        returned: result.data.length,
        stale: result.stale ?? false,
      },
      'GET /api/cards response',
    );
    return paginated(
      result.data.map(toCardSummary),
      params.page,
      params.pageSize,
      result.count,
      result.totalCount,
      result.stale,
    );
  });

  app.get('/api/cards/:id', async (request) => {
    const id = (request.params as { id: string }).id;
    const result = await catalogService.getCardById(id);
    request.log.info(
      {
        id,
        stale: result.stale ?? false,
        enrichmentState: result.cardmarket.enrichmentState,
        statusMessage: result.cardmarket.statusMessage ?? null,
        mappingProductId: result.cardmarket.mapping?.idProduct ?? null,
        mappingStatus: result.cardmarket.mapping?.status ?? null,
        hasPriceGuide: Boolean(result.cardmarket.priceGuide),
        firecrawlStatus: result.firecrawlEnrichment.status,
      },
      'GET /api/cards/:id cardmarket enrichment result',
    );
    return {
      data: toCardDetail(result.card, {
        ...result.cardmarket,
        firecrawlEnrichment: result.firecrawlEnrichment,
      }),
      stale: result.stale,
    };
  });

  app.post('/api/admin/cards/:id/cardmarket/enrich', async (request, reply) => {
    // TODO: Replace this with real auth/admin middleware before enabling in production.
    if (env.NODE_ENV === 'production') return reply.status(403).send({ message: 'Disabled in production.' });
    const id = (request.params as { id: string }).id;
    await enqueueOrRunCardmarketEnrichment(id);
    return { ok: true, cardId: id };
  });

  app.post('/api/admin/cards/:id/cardmarket/reset', async (request, reply) => {
    // TODO: Replace this with real auth/admin middleware before enabling in production.
    if (env.NODE_ENV === 'production') return reply.status(403).send({ message: 'Disabled in production.' });
    const id = (request.params as { id: string }).id;
    await resetCardmarketEnrichment(id);
    return { ok: true, cardId: id };
  });

  app.get('/api/sets', async (request) => {
    const params = setsQuerySchema.parse(request.query);
    const result = await catalogService.searchSets(params.query, params.page, params.pageSize, params.orderBy);
    return paginated(
      result.data.map(toSetSummary),
      params.page,
      params.pageSize,
      result.count,
      result.totalCount,
      result.stale,
    );
  });

  app.get('/api/sets/:id', async (request) => {
    const id = (request.params as { id: string }).id;
    const result = await catalogService.getSetById(id);
    return { data: toSetDetail(result.set), stale: result.stale };
  });

  app.post('/api/linkage/import', async () => {
    return linkageService.startImportJob();
  });

  app.post('/api/linkage/import/upload', async (request) => {
    const body = linkageImportPayloadSchema.parse(request.body);
    request.log.info(
      {
        createdAt: body.createdAt ?? null,
        productsCount: body.products?.length ?? 0,
        priceGuidesCount: body.priceGuides?.length ?? 0,
      },
      'POST /api/linkage/import/upload accepted',
    );
    return linkageService.startImportJobFromPayload({
      ...(body.createdAt ? { createdAt: body.createdAt } : {}),
      ...(body.products ? { products: body.products } : {}),
      ...(body.priceGuides ? { priceGuides: body.priceGuides } : {}),
    });
  });

  app.get('/api/linkage/import/:jobId', async (request, reply) => {
    const jobId = (request.params as { jobId: string }).jobId;
    const job = linkageService.getImportJob(jobId);
    if (!job) {
      return reply.status(404).send({ message: 'Import job not found' });
    }
    return job;
  });

  app.get('/api/linkage/summary', async () => {
    return { data: await linkageService.summary() };
  });

  app.get('/api/linkage/items', async (request) => {
    const params = linkageItemsQuerySchema.parse(request.query);
    return linkageService.list(params);
  });

  app.post('/api/linkage/reset', async () => {
    return { data: await linkageService.removeAllLinks() };
  });

  app.get('/api/linkage/products', async (request) => {
    const params = linkageProductsQuerySchema.parse(request.query);
    return linkageService.listProducts(params);
  });

  app.get('/api/linkage/products/:idProduct/suggestions', async (request) => {
    const idProduct = Number((request.params as { idProduct: string }).idProduct);
    const params = linkageProductSuggestionsQuerySchema.parse(request.query);
    return linkageService.suggestCardsForProduct(idProduct, params.limit);
  });

  app.post('/api/linkage/products/:idProduct/manual-link', async (request) => {
    const idProduct = Number((request.params as { idProduct: string }).idProduct);
    const body = linkageManualLinkSchema.parse(request.body);
    return { data: await linkageService.manualLinkProduct(idProduct, body.cardId) };
  });

  app.get('/api/linkage/set-mappings', async (request) => {
    const params = linkageSetMappingsQuerySchema.parse(request.query);
    return linkageService.listSetMappings(params);
  });

  app.post('/api/linkage/set-mappings', async (request) => {
    const body = linkageSetMappingUpsertSchema.parse(request.body);
    return { data: await linkageService.upsertSetMapping(body) };
  });

  app.patch('/api/linkage/set-mappings/:id', async (request) => {
    const id = (request.params as { id: string }).id;
    const body = linkageSetMappingUpdateSchema.parse(request.body);
    return { data: await linkageService.updateSetMapping(id, body) };
  });

  app.delete('/api/linkage/set-mappings/:id', async (request) => {
    const id = (request.params as { id: string }).id;
    return { data: await linkageService.removeSetMapping(id) };
  });

  app.post('/api/linkage/:id/approve', async (request) => {
    const id = (request.params as { id: string }).id;
    return { data: await linkageService.approve(id) };
  });

  app.post('/api/linkage/:id/reject', async (request) => {
    const id = (request.params as { id: string }).id;
    return { data: await linkageService.reject(id) };
  });

  app.post('/api/linkage/:id/manual-link', async (request) => {
    const id = (request.params as { id: string }).id;
    const body = linkageManualLinkSchema.parse(request.body);
    return { data: await linkageService.manualLink(id, body.cardId) };
  });

  app.patch('/api/linkage/:id', async (request) => {
    const id = (request.params as { id: string }).id;
    const body = linkageUpdateSchema.parse(request.body);
    return { data: await linkageService.update(id, body) };
  });

  app.delete('/api/linkage/:id', async (request) => {
    const id = (request.params as { id: string }).id;
    return { data: await linkageService.remove(id) };
  });
};
