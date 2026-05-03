import path from 'node:path';
import { config } from '../../config/env';

export async function runPostgresMigrations(): Promise<void> {
  const { runner } = await import('node-pg-migrate');
  const migrations = await runner({
    databaseUrl: config.databaseUrl,
    dir: path.resolve(process.cwd(), 'migrations'),
    direction: 'up',
    migrationsTable: 'pgmigrations',
    singleTransaction: true,
    checkOrder: true,
    noLock: false,
    logger: console,
  });

  if (migrations.length > 0) {
    console.info(`Applied ${migrations.length} PostgreSQL migration(s)`);
  }
}
