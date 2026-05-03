import express from 'express';
import { AuthController } from './adapters/http/controllers/auth.controller';
import { errorHandler } from './adapters/http/middlewares/error-handler.middleware';
import { createAuthRouter } from './adapters/http/routes/auth.routes';
import { SendSmsUseCase } from './application/use-cases/send-sms.use-case';
import { VerifySmsUseCase } from './application/use-cases/verify-sms.use-case';
import { config } from './infrastructure/config/env';
import { AuthPostgresRepository } from './infrastructure/persistence/postgres/auth-postgres.repository';
import { postgresPool } from './infrastructure/persistence/postgres/postgres-pool';
import { HmacOtpHasher } from './infrastructure/security/hmac-otp-hasher';
import { JwtTokenService } from './infrastructure/security/jwt-token.service';
import { ConsoleSmsGateway } from './infrastructure/sms/console-sms.gateway';

export function createApp() {
  const app = express();

  const authRepository = new AuthPostgresRepository(postgresPool, config.defaultUserRole);
  const otpHasher = new HmacOtpHasher(config.otpPepper);
  const smsGateway = new ConsoleSmsGateway();
  const tokenService = new JwtTokenService(config.jwtSecret, config.jwtExpiresIn);

  const sendSmsUseCase = new SendSmsUseCase(
    authRepository,
    otpHasher,
    smsGateway,
    config.otpTtlMinutes,
  );
  const verifySmsUseCase = new VerifySmsUseCase(
    authRepository,
    otpHasher,
    tokenService,
    config.jwtExpiresIn,
  );
  const authController = new AuthController(sendSmsUseCase, verifySmsUseCase);

  app.use(express.json());
  app.use('/api/auth', createAuthRouter(authController));
  app.use(errorHandler);

  return app;
}
