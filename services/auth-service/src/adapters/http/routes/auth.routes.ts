import { Router } from 'express';
import type { AuthController } from '../controllers/auth.controller';

export function createAuthRouter(authController: AuthController): Router {
  const router = Router();

  router.post('/send-sms', authController.sendSms);
  router.post('/verify-sms', authController.verifySms);

  return router;
}
