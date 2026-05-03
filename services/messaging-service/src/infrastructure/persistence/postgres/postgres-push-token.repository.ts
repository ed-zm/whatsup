import type { Pool } from 'pg';
import type { PushTokenRepository } from '../../../application/ports/push-token-repository';

export class PostgresPushTokenRepository implements PushTokenRepository {
  constructor(private readonly pool: Pool) {}

  async findActiveFcmTokensByUserId(userId: string): Promise<string[]> {
    const result = await this.pool.query<{ fcm_token: string }>(
      `
        SELECT fcm_token
        FROM user_push_tokens
        WHERE user_id = $1
          AND is_active = true
        ORDER BY updated_at DESC
        LIMIT 10
      `,
      [userId],
    );

    return result.rows.map((row) => row.fcm_token);
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
  }
}
