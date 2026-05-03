import express from 'express';
import { AuthController } from './adapters/http/controllers/auth.controller';
import { errorHandler } from './adapters/http/middlewares/error-handler.middleware';
import { createAuthRouter } from './adapters/http/routes/auth.routes';
import { RequestSmsCodeUseCase } from './application/use-cases/request-sms-code.use-case';
import { VerifySmsCodeUseCase } from './application/use-cases/verify-sms-code.use-case';
import { redisClient } from './infrastructure/cache/redis/redis-client';
import { RedisOtpRateLimiter } from './infrastructure/cache/redis/redis-otp-rate-limiter';
import { config } from './infrastructure/config/env';
import { AuthPostgresRepository } from './infrastructure/persistence/postgres/auth-postgres.repository';
import { OtpPostgresRepository } from './infrastructure/persistence/postgres/otp-postgres.repository';
import { postgresPool } from './infrastructure/persistence/postgres/postgres-pool';
import { HmacOtpHasher } from './infrastructure/security/hmac-otp-hasher';
import { JwtTokenService } from './infrastructure/security/jwt-token.service';
import { ConsoleSmsGateway } from './infrastructure/sms/console-sms.gateway';

export function createApp() {
  const app = express();

  const authRepository = new AuthPostgresRepository(postgresPool, config.defaultUserRole);
  const otpRepository = new OtpPostgresRepository(postgresPool);
  const otpHasher = new HmacOtpHasher(config.otpPepper);
  const smsGateway = new ConsoleSmsGateway();
  const otpRateLimiter = new RedisOtpRateLimiter(
    redisClient,
    config.otpRateLimitMaxRequests,
    config.otpRateLimitWindowSeconds,
  );
  const tokenService = new JwtTokenService(config.jwtSecret, config.jwtExpiresIn);

  const requestSmsCodeUseCase = new RequestSmsCodeUseCase(
    otpRepository,
    otpHasher,
    smsGateway,
    otpRateLimiter,
    config.otpTtlMinutes,
  );
  const verifySmsCodeUseCase = new VerifySmsCodeUseCase(
    otpRepository,
    authRepository,
    otpHasher,
    tokenService,
    config.jwtExpiresIn,
  );
  const authController = new AuthController(requestSmsCodeUseCase, verifySmsCodeUseCase);

  app.use(express.json());
  app.use('/api/auth', createAuthRouter(authController));
  app.use(errorHandler);

  return app;
}
