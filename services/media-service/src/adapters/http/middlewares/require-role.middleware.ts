import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../types/authenticated-request';

export function requireRole(...allowedRoles: string[]) {
  return (request: AuthenticatedRequest, response: Response, next: NextFunction): void => {
    if (!request.auth) {
      response.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!allowedRoles.some((role) => request.auth?.roles.includes(role))) {
      response.status(403).json({ message: 'Insufficient role' });
      return;
    }

    next();
  };
}
