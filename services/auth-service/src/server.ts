import { createApp } from './app';
import { config } from './infrastructure/config/env';
import { redisClient } from './infrastructure/cache/redis/redis-client';
import { runPostgresMigrations } from './infrastructure/persistence/postgres/run-migrations';

async function bootstrap(): Promise<void> {
  await redisClient.connect();

  if (config.runMigrationsOnStartup) {
    await runPostgresMigrations();
  }

  const app = createApp();

  const server = app.listen(config.port, () => {
    console.info(`auth-service listening on port ${config.port}`);
  });

  const shutdown = async () => {
    console.info('auth-service shutting down');
    server.close();
    await redisClient.quit();
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown();
  });
  process.on('SIGTERM', () => {
    void shutdown();
  });
}

bootstrap().catch((error) => {
  console.error('auth-service failed to start', error);
  process.exit(1);
});
