export interface AuthServiceConfig {
  port: number;
  databaseUrl: string;
  redisUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  otpPepper: string;
  otpTtlMinutes: number;
  otpRateLimitMaxRequests: number;
  otpRateLimitWindowSeconds: number;
  defaultUserRole: string;
  runMigrationsOnStartup: boolean;
}

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const config: AuthServiceConfig = {
  port: Number(process.env.PORT ?? 4001),
  databaseUrl: required('DATABASE_URL'),
  redisUrl: required('REDIS_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  otpPepper: required('OTP_PEPPER'),
  otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES ?? 5),
  otpRateLimitMaxRequests: Number(process.env.OTP_RATE_LIMIT_MAX_REQUESTS ?? 3),
  otpRateLimitWindowSeconds: Number(process.env.OTP_RATE_LIMIT_WINDOW_SECONDS ?? 3600),
  defaultUserRole: process.env.DEFAULT_USER_ROLE ?? 'user',
  runMigrationsOnStartup: process.env.RUN_MIGRATIONS_ON_STARTUP === 'true',
};
