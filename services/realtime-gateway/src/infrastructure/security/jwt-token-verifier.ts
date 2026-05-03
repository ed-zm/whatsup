import jwt from 'jsonwebtoken';
import type { TokenVerifier } from '../../application/ports/token-verifier';
import type { RealtimePrincipal } from '../../domain/entities/realtime-principal';

interface GatewayJwtPayload {
  sub: string;
  phoneNumber: string;
  roles: string[];
  permissions?: string[];
}

export class JwtTokenVerifier implements TokenVerifier {
  constructor(private readonly secret: string) {}

  verify(token: string): RealtimePrincipal {
    const payload = jwt.verify(token, this.secret) as GatewayJwtPayload;

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
