import { createApp } from './app';
import { env } from './infrastructure/env';
import { prisma } from './infrastructure/prisma';

const start = async (): Promise<void> => {
  const app = createApp();

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

void start();