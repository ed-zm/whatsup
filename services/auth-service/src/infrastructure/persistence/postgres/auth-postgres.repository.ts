import type { Pool, PoolClient } from 'pg';
import type { OtpPurpose, OtpVerification } from '../../../domain/entities/otp-verification';
import type { User } from '../../../domain/entities/user';
import type {
  AuthRepository,
  UserWithRolesAndPermissions,
} from '../../../domain/repositories/auth-repository';

interface UserRow {
  id: string;
  phone_number: string;
  display_name: string | null;
  avatar_url: string | null;
  about: string | null;
  is_phone_verified: boolean;
  is_active: boolean;
  last_seen_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface OtpRow {
  id: string;
  phone_number: string;
  otp_hash: string;
  purpose: OtpPurpose;
  status: OtpVerification['status'];
  attempts_count: number;
  max_attempts: number;
  sent_at: Date;
  expires_at: Date;
  verified_at: Date | null;
}

export class AuthPostgresRepository implements AuthRepository {
  constructor(
    private readonly pool: Pool,
    private readonly defaultUserRole: string,
  ) {}

  async createOtpVerification(input: {
    phoneNumber: string;
    otpHash: string;
    purpose: OtpPurpose;
    expiresAt: Date;
  }): Promise<OtpVerification> {
    const result = await this.pool.query<OtpRow>(
      `
        INSERT INTO otp_verifications (phone_number, otp_hash, purpose, expires_at)
        VALUES ($1, $2, $3, $4)
        RETURNING id, phone_number, otp_hash, purpose, status, attempts_count, max_attempts,
                  sent_at, expires_at, verified_at
      `,
      [input.phoneNumber, input.otpHash, input.purpose, input.expiresAt],
    );

    return mapOtpRow(result.rows[0]);
  }

  async findLatestPendingOtp(
    phoneNumber: string,
    purpose: OtpPurpose,
  ): Promise<OtpVerification | null> {
    const result = await this.pool.query<OtpRow>(
      `
        SELECT id, phone_number, otp_hash, purpose, status, attempts_count, max_attempts,
               sent_at, expires_at, verified_at
        FROM otp_verifications
        WHERE phone_number = $1
          AND purpose = $2
          AND status = 'pending'
        ORDER BY sent_at DESC
        LIMIT 1
      `,
      [phoneNumber, purpose],
    );

    return result.rows[0] ? mapOtpRow(result.rows[0]) : null;
  }

  async incrementOtpAttempts(otpId: string): Promise<void> {
    await this.pool.query(
      `
        UPDATE otp_verifications
        SET attempts_count = attempts_count + 1,
            status = CASE
              WHEN attempts_count + 1 >= max_attempts THEN 'blocked'
              ELSE status
            END,
            updated_at = now()
        WHERE id = $1
      `,
      [otpId],
    );
  }

  async markOtpVerified(otpId: string): Promise<void> {
    await this.pool.query(
      `
        UPDATE otp_verifications
        SET status = 'verified',
            verified_at = now(),
            updated_at = now()
        WHERE id = $1
      `,
      [otpId],
    );
  }

  async markOtpExpired(otpId: string): Promise<void> {
    await this.pool.query(
      `
        UPDATE otp_verifications
        SET status = 'expired',
            updated_at = now()
        WHERE id = $1
          AND status = 'pending'
      `,
      [otpId],
    );
  }

  async findUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const result = await this.pool.query<UserRow>(
      `
        SELECT id, phone_number, display_name, avatar_url, about, is_phone_verified,
               is_active, last_seen_at, created_at, updated_at
        FROM users
        WHERE phone_number = $1
        LIMIT 1
      `,
      [phoneNumber],
    );

    return result.rows[0] ? mapUserRow(result.rows[0]) : null;
  }

  async findOrCreateVerifiedUser(phoneNumber: string): Promise<User> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const user = await this.upsertVerifiedUser(client, phoneNumber);
      await this.assignDefaultRole(client, user.id);

      await client.query('COMMIT');

      return user;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const result = await this.pool.query<{ name: string }>(
      `
        SELECT r.name
        FROM roles r
        INNER JOIN user_roles ur ON ur.role_id = r.id
        WHERE ur.user_id = $1
        ORDER BY r.name ASC
      `,
      [userId],
    );

    return result.rows.map((row) => row.name);
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const result = await this.pool.query<{ code: string }>(
      `
        SELECT DISTINCT p.code
        FROM permissions p
        INNER JOIN role_permissions rp ON rp.permission_id = p.id
        INNER JOIN user_roles ur ON ur.role_id = rp.role_id
        WHERE ur.user_id = $1
        ORDER BY p.code ASC
      `,
      [userId],
    );

    return result.rows.map((row) => row.code);
  }

  async findUserWithRolesAndPermissions(userId: string): Promise<UserWithRolesAndPermissions | null> {
    const userResult = await this.pool.query<UserRow>(
      `
        SELECT id, phone_number, display_name, avatar_url, about, is_phone_verified,
               is_active, last_seen_at, created_at, updated_at
        FROM users
        WHERE id = $1
          AND is_active = true
        LIMIT 1
      `,
      [userId],
    );

    if (!userResult.rows[0]) {
      return null;
    }

    const [roles, permissions] = await Promise.all([
      this.getUserRoles(userId),
      this.getUserPermissions(userId),
    ]);

    return {
      user: mapUserRow(userResult.rows[0]),
      roles,
      permissions,
    };
  }

  private async upsertVerifiedUser(client: PoolClient, phoneNumber: string): Promise<User> {
    const result = await client.query<UserRow>(
      `
        INSERT INTO users (phone_number, is_phone_verified)
        VALUES ($1, true)
        ON CONFLICT (phone_number)
        DO UPDATE SET
          is_phone_verified = true,
          is_active = true,
          updated_at = now()
        RETURNING id, phone_number, display_name, avatar_url, about, is_phone_verified,
                  is_active, last_seen_at, created_at, updated_at
      `,
      [phoneNumber],
    );

    return mapUserRow(result.rows[0]);
  }

  private async assignDefaultRole(client: PoolClient, userId: string): Promise<void> {
    await client.query(
      `
        INSERT INTO user_roles (user_id, role_id)
        SELECT $1, r.id
        FROM roles r
        WHERE r.name = $2
        ON CONFLICT (user_id, role_id) DO NOTHING
      `,
      [userId, this.defaultUserRole],
    );
  }
}

function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    phoneNumber: row.phone_number,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    about: row.about,
    isPhoneVerified: row.is_phone_verified,
    isActive: row.is_active,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOtpRow(row: OtpRow): OtpVerification {
  return {
    id: row.id,
    phoneNumber: row.phone_number,
    otpHash: row.otp_hash,
    purpose: row.purpose,
    status: row.status,
    attemptsCount: row.attempts_count,
    maxAttempts: row.max_attempts,
    sentAt: row.sent_at,
    expiresAt: row.expires_at,
    verifiedAt: row.verified_at,
  };
}
