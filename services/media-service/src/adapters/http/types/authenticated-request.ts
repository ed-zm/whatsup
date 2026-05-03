import type { Request } from 'express';
import type { AuthenticatedPrincipal } from '../../../domain/entities/authenticated-principal';

export interface AuthenticatedRequest extends Request {
  auth?: AuthenticatedPrincipal;
}
