import type { NextFunction, Response } from 'express';
import type { TokenService } from '../../../application/ports/token-service';
import type { AuthenticatedRequest } from '../types/authenticated-request';

export function authenticateToken(tokenService: TokenService) {
  return (request: AuthenticatedRequest, response: Response, next: NextFunction): void => {
    const authorization = request.header('authorization');
    const token = extractBearerToken(authorization);

    if (!token) {
      response.status(401).json({ message: 'Missing bearer token' });
      return;
    }

    try {
      request.auth = tokenService.verify(token);
      next();
    } catch {
      response.status(401).json({ message: 'Invalid or expired token' });
    }
  };
}

function extractBearerToken(authorization: string | undefined): string | null {
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}
