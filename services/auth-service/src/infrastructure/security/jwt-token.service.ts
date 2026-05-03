import jwt from 'jsonwebtoken';
import type { AuthenticatedPrincipal } from '../../domain/entities/authenticated-principal';
import type { TokenService } from '../../application/ports/token-service';

interface JwtPayload {
  sub: string;
  phoneNumber: string;
  roles: string[];
}

export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string,
  ) {}

  sign(principal: AuthenticatedPrincipal): string {
    return jwt.sign(
      {
        phoneNumber: principal.phoneNumber,
        roles: principal.roles,
      },
      this.secret,
      {
        subject: principal.userId,
        expiresIn: this.expiresIn as jwt.SignOptions['expiresIn'],
      },
    );
  }

  verify(token: string): AuthenticatedPrincipal {
    const payload = jwt.verify(token, this.secret) as JwtPayload;

    if (!payload.sub || !payload.phoneNumber || !Array.isArray(payload.roles)) {
      throw new Error('Invalid token payload');
    }

    return {
      userId: payload.sub,
      phoneNumber: payload.phoneNumber,
      roles: payload.roles,
    };
  }
}
