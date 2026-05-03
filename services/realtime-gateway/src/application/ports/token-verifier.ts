import type { RealtimePrincipal } from '../../domain/entities/realtime-principal';

export interface TokenVerifier {
  verify(token: string): RealtimePrincipal;
}
