import type { NextFunction, Response } from 'express';
import type { AuthRepository } from '../../../domain/repositories/auth-repository';
import type { AuthenticatedRequest } from '../types/authenticated-request';

export function requirePermission(
  action: string,
  resource: string,
  authRepository: AuthRepository,
) {
  return async (
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (!request.auth) {
      response.status(401).json({ message: 'Authentication required' });
      return;
    }

    try {
      const permissions = await authRepository.getUserPermissions(request.auth.userId);
      const requiredPermission = `${resource}:${action}`;

      if (!hasPermission(permissions, requiredPermission, resource)) {
        response.status(403).json({ message: 'Insufficient permissions' });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

function hasPermission(permissions: string[], requiredPermission: string, resource: string): boolean {
  return permissions.includes(requiredPermission) || permissions.includes(`${resource}:*`) || permissions.includes('*:*');
}
