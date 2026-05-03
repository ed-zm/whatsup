import { createApp } from './app';
import { config } from './infrastructure/config/env';
import { runPostgresMigrations } from './infrastructure/persistence/postgres/run-migrations';

async function bootstrap(): Promise<void> {
  if (config.runMigrationsOnStartup) {
    await runPostgresMigrations();
  }

  const app = createApp();

  app.listen(config.port, () => {
    console.info(`auth-service listening on port ${config.port}`);
  });
}

bootstrap().catch((error) => {
  console.error('auth-service failed to start', error);
  process.exit(1);
});
