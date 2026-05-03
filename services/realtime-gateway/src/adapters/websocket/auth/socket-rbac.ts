import type { RealtimePrincipal } from '../../../domain/entities/realtime-principal';
import { SocketEvents, type SocketEventType } from '../../../domain/entities/socket-events';

interface EventPolicy {
  permissions: string[];
  roles: string[];
}

const ROLE_PERMISSIONS: Record<string, string[]> = {
  user: ['messages:send'],
  admin: ['*:*'],
};

const EVENT_POLICIES: Partial<Record<SocketEventType, EventPolicy>> = {
  [SocketEvents.textMessage]: {
    permissions: ['messages:send'],
    roles: ['user', 'admin'],
  },
};

export function canEmitSocketEvent(principal: RealtimePrincipal, eventType: SocketEventType): boolean {
  const policy = EVENT_POLICIES[eventType];

  if (!policy) {
    return true;
  }

  const effectivePermissions = new Set([
    ...principal.permissions,
    ...principal.roles.flatMap((role) => ROLE_PERMISSIONS[role] ?? []),
  ]);

  if (policy.permissions.some((permission) => hasPermission(effectivePermissions, permission))) {
    return true;
  }

  return policy.roles.some((role) => principal.roles.includes(role));
}

function hasPermission(permissions: Set<string>, requiredPermission: string): boolean {
  const [resource] = requiredPermission.split(':');

  return (
    permissions.has(requiredPermission) ||
    permissions.has(`${resource}:*`) ||
    permissions.has('*:*')
  );
}
