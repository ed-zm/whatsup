import { Pool } from 'pg';
import { config } from '../../config/env';

export const postgresPool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
});
