import type { AuthenticatedPrincipal } from '../../domain/entities/authenticated-principal';

export interface TokenService {
  sign(principal: AuthenticatedPrincipal): string;
  verify(token: string): AuthenticatedPrincipal;
}
