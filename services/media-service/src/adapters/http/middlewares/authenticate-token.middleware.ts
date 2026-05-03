import type { NextFunction, Response } from 'express';
import type { JwtTokenVerifier } from '../../../infrastructure/security/jwt-token-verifier';
import type { AuthenticatedRequest } from '../types/authenticated-request';

export function authenticateToken(tokenVerifier: JwtTokenVerifier) {
  return (request: AuthenticatedRequest, response: Response, next: NextFunction): void => {
    const token = extractBearerToken(request.header('authorization'));

    if (!token) {
      response.status(401).json({ message: 'Missing bearer token' });
      return;
    }

    try {
      request.auth = tokenVerifier.verify(token);
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

  return scheme === 'Bearer' && token ? token : null;
}
