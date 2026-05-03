export interface AuthServiceConfig {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  otpPepper: string;
  otpTtlMinutes: number;
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
  port: Number(process.env.PORT ?? 3001),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  otpPepper: required('OTP_PEPPER'),
  otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES ?? 5),
  defaultUserRole: process.env.DEFAULT_USER_ROLE ?? 'user',
  runMigrationsOnStartup: process.env.RUN_MIGRATIONS_ON_STARTUP === 'true',
};
