import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { ZodError } from 'zod';
import { env } from './infrastructure/env';
import { PokemonTcgApiError } from './infrastructure/pokemon-client';
import { registerRoutes } from './routes';

export const createApp = () => {
  const app = Fastify({
    logger: { level: env.NODE_ENV === 'development' ? 'info' : 'warn' },
    bodyLimit: 50 * 1024 * 1024,
  });

  app.register(sensible);
  app.register(cors, {
    origin: env.NODE_ENV === 'development' ? true : env.WEB_ORIGIN,
    credentials: true,
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid query parameters',
        issues: error.issues,
      });
    }

    if (error instanceof PokemonTcgApiError) {
      const statusCode = error.statusCode >= 400 && error.statusCode < 500 ? error.statusCode : 502;
      request.log.warn(
        {
          upstreamStatus: error.statusCode,
          rateLimit: error.rateLimit,
          details: error.details,
        },
        'Pokemon TCG upstream request failed',
      );

      return reply.status(statusCode).send({
        error: 'Upstream API Error',
        message: error.message,
        upstream: {
          statusCode: error.statusCode,
          details: error.details,
          rateLimit: error.rateLimit,
        },
      });
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return reply.status(404).send({ error: 'Not Found', message: error.message });
    }

    if (error instanceof Error && (error.message.includes('System collections') || error.message.includes('Only binders'))) {
      return reply.status(400).send({ error: 'Bad Request', message: error.message });
    }

    request.log.error(error);
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Unexpected server error',
    });
  });

  registerRoutes(app);
  return app;
};
