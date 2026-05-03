import jwt from 'jsonwebtoken';
import type { AuthenticatedPrincipal } from '../../domain/entities/authenticated-principal';

interface JwtPayload {
  sub: string;
  phoneNumber: string;
  roles: string[];
  permissions?: string[];
}

export class JwtTokenVerifier {
  constructor(private readonly secret: string) {}

  verify(token: string): AuthenticatedPrincipal {
    const payload = jwt.verify(token, this.secret) as JwtPayload;

    if (!payload.sub || !payload.phoneNumber || !Array.isArray(payload.roles)) {
      throw new Error('Invalid token payload');
    }

    return {
      userId: payload.sub,
      phoneNumber: payload.phoneNumber,
      roles: payload.roles,
      permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
    };
  }
}
