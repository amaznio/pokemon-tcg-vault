import type { FastifyInstance } from 'fastify';
import { catalogService } from '../application/catalog-service';
import { paginated, toCardDetail, toCardSummary, toSetDetail, toSetSummary } from '../presentation/mappers';
import { cardsQuerySchema, setsQuerySchema } from '../presentation/schemas';

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
    return { data: toCardDetail(result.card), stale: result.stale };
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
};
