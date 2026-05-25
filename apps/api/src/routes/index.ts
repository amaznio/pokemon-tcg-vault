import type { FastifyInstance } from 'fastify';
import { authService } from '../application/auth-service';
import { catalogService } from '../application/catalog-service';
import { collectionService } from '../application/collection-service';
import { pricingService } from '../application/pricing-service';
import { paginated, toCardDetail, toCardSummary, toCollectionItem, toCollectionSummary, toPriceJob, toPriceSnapshot, toSetDetail, toSetSummary } from '../presentation/mappers';
import {
  cardsBatchSchema,
  cardsQuerySchema,
  collectionCreateSchema,
  collectionItemCreateSchema,
  collectionItemUpdateSchema,
  collectionUpdateSchema,
  loginSchema,
  registerSchema,
  setsQuerySchema,
} from '../presentation/schemas';

export const registerRoutes = (app: FastifyInstance): void => {
  app.get('/api/health', async () => ({ ok: true }));

  app.post('/api/auth/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const user = await authService.register(body, reply);
    return { data: user };
  });

  app.post('/api/auth/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const user = await authService.login(body, reply);
    if (!user) return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid email or password.' });
    return { data: user };
  });

  app.post('/api/auth/logout', async (request, reply) => {
    await authService.logout(request, reply);
    return { ok: true };
  });

  app.get('/api/me', async (request) => {
    const user = await authService.getSessionUser(request);
    return { data: user };
  });

  app.get('/api/cards', async (request) => {
    const params = cardsQuerySchema.parse(request.query);
    const result = await catalogService.searchCards(params.query, params.page, params.pageSize, params.orderBy);
    return paginated(
      result.data.map(toCardSummary),
      params.page,
      params.pageSize,
      result.count,
      result.totalCount,
      result.stale,
    );
  });

  app.post('/api/cards/batch', async (request) => {
    const body = cardsBatchSchema.parse(request.body);
    const cards = await catalogService.getCardsByIds(body.ids);
    return { data: cards.map(toCardDetail), count: cards.length };
  });

  app.get('/api/cards/:id', async (request) => {
    const id = (request.params as { id: string }).id;
    const result = await catalogService.getCardById(id);
    return { data: toCardDetail(result.card), stale: result.stale };
  });

  app.get('/api/cards/:id/prices', async (request, reply) => {
    const user = await authService.requireUser(request, reply);
    if (!user) return;
    const id = (request.params as { id: string }).id;
    const snapshots = await pricingService.latestForCard(id);
    return { data: snapshots.map(toPriceSnapshot), count: snapshots.length };
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

  app.get('/api/collections', async (request, reply) => {
    const user = await authService.requireUser(request, reply);
    if (!user) return;
    const collections = await collectionService.listCollections(user.id);
    return { data: collections.map(toCollectionSummary) };
  });

  app.post('/api/collections', async (request, reply) => {
    const user = await authService.requireUser(request, reply);
    if (!user) return;
    const body = collectionCreateSchema.parse(request.body);
    const collection = await collectionService.createBinder(user.id, body.name);
    return { data: toCollectionSummary(collection) };
  });

  app.patch('/api/collections/:id', async (request, reply) => {
    const user = await authService.requireUser(request, reply);
    if (!user) return;
    const id = (request.params as { id: string }).id;
    const body = collectionUpdateSchema.parse(request.body);
    const collection = await collectionService.updateCollection(user.id, id, body);
    return { data: toCollectionSummary(collection) };
  });

  app.delete('/api/collections/:id', async (request, reply) => {
    const user = await authService.requireUser(request, reply);
    if (!user) return;
    const id = (request.params as { id: string }).id;
    const collection = await collectionService.deleteCollection(user.id, id);
    return { data: collection };
  });

  app.get('/api/collections/:id/cards', async (request, reply) => {
    const user = await authService.requireUser(request, reply);
    if (!user) return;
    const id = (request.params as { id: string }).id;
    const items = await collectionService.listItems(user.id, id);
    return { data: items.map(toCollectionItem), count: items.length };
  });

  app.post('/api/collections/:id/cards', async (request, reply) => {
    const user = await authService.requireUser(request, reply);
    if (!user) return;
    const id = (request.params as { id: string }).id;
    const body = collectionItemCreateSchema.parse(request.body);
    const item = await collectionService.addItem(user.id, id, body);
    return { data: toCollectionItem(item) };
  });

  app.patch('/api/collections/:id/cards/:itemId', async (request, reply) => {
    const user = await authService.requireUser(request, reply);
    if (!user) return;
    const { id, itemId } = request.params as { id: string; itemId: string };
    const body = collectionItemUpdateSchema.parse(request.body);
    const item = await collectionService.updateItem(user.id, id, itemId, body);
    return { data: toCollectionItem(item) };
  });

  app.delete('/api/collections/:id/cards/:itemId', async (request, reply) => {
    const user = await authService.requireUser(request, reply);
    if (!user) return;
    const { id, itemId } = request.params as { id: string; itemId: string };
    const item = await collectionService.deleteItem(user.id, id, itemId);
    return { data: item };
  });

  app.post('/api/collections/:id/prices/refresh', async (request, reply) => {
    const user = await authService.requireUser(request, reply);
    if (!user) return;
    const id = (request.params as { id: string }).id;
    const job = await pricingService.createCollectionRefreshJob(user.id, id);
    return { data: toPriceJob(job) };
  });

  app.get('/api/price-jobs/:id', async (request, reply) => {
    const user = await authService.requireUser(request, reply);
    if (!user) return;
    const id = (request.params as { id: string }).id;
    const job = await pricingService.getJob(user.id, id);
    if (!job) return reply.status(404).send({ message: 'Price job not found.' });
    return { data: toPriceJob(job) };
  });
};
