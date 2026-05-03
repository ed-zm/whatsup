import { Router } from 'express';
import type { MediaController } from '../controllers/media.controller';
import { authenticateToken } from '../middlewares/authenticate-token.middleware';
import { requireRole } from '../middlewares/require-role.middleware';
import type { JwtTokenVerifier } from '../../../infrastructure/security/jwt-token-verifier';

export function createMediaRouter(
  mediaController: MediaController,
  tokenVerifier: JwtTokenVerifier,
): Router {
  const router = Router();

  router.get(
    '/presigned-url',
    authenticateToken(tokenVerifier),
    requireRole('user', 'admin'),
    mediaController.getPresignedUrl,
  );

  return router;
}
