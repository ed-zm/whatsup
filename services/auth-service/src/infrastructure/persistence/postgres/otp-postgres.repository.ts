import type { Pool } from 'pg';
import type { OtpVerification } from '../../../domain/entities/otp-verification';
import type { OtpRepository } from '../../../domain/repositories/otp-repository';

interface OtpRow {
  id: string;
  phone: string;
  otp_hash: string;
  expires_at: Date;
  used: boolean;
}

export class OtpPostgresRepository implements OtpRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: {
    phone: string;
    otpHash: string;
    expiresAt: Date;
  }): Promise<OtpVerification> {
    const result = await this.pool.query<OtpRow>(
      `
        INSERT INTO otp_verifications (phone, otp_hash, expires_at, used)
        VALUES ($1, $2, $3, false)
        RETURNING id, phone, otp_hash, expires_at, used
      `,
      [input.phone, input.otpHash, input.expiresAt],
    );

    return mapOtpRow(result.rows[0]);
  }

  async findLatestValidByPhone(phone: string): Promise<OtpVerification | null> {
    const result = await this.pool.query<OtpRow>(
      `
        SELECT id, phone, otp_hash, expires_at, used
        FROM otp_verifications
        WHERE phone = $1
          AND expires_at > NOW()
          AND used = false
        ORDER BY expires_at DESC
        LIMIT 1
      `,
      [phone],
    );

    return result.rows[0] ? mapOtpRow(result.rows[0]) : null;
  }

  async markUsed(otpId: string): Promise<boolean> {
    const result = await this.pool.query(
      `
        UPDATE otp_verifications
        SET used = true
        WHERE id = $1
          AND used = false
          AND expires_at > NOW()
      `,
      [otpId],
    );

    return result.rowCount === 1;
  }
}

function mapOtpRow(row: OtpRow): OtpVerification {
  return {
    id: row.id,
    phone: row.phone,
    otpHash: row.otp_hash,
    expiresAt: row.expires_at,
    used: row.used,
  };
}
