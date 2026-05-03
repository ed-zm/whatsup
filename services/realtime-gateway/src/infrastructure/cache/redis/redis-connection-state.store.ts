import type {
  ConnectionState,
  ConnectionStateStore,
  NodeState,
} from '../../../application/ports/connection-state-store';

interface RedisMulti {
  hSet(key: string, value: Record<string, string>): RedisMulti;
  expire(key: string, seconds: number): RedisMulti;
  sAdd(key: string, member: string): RedisMulti;
  sRem(key: string, member: string): RedisMulti;
  del(key: string): RedisMulti;
  exec(): Promise<unknown>;
}

interface RedisConnectionClient {
  multi(): RedisMulti;
  quit(): Promise<unknown>;
}

export class RedisConnectionStateStore implements ConnectionStateStore {
  private readonly redis: RedisConnectionClient;

  constructor(redis: unknown) {
    this.redis = redis as RedisConnectionClient;
  }

  async registerNode(node: NodeState, ttlSeconds: number): Promise<void> {
    const key = nodeKey(node.nodeId);
    const now = Date.now();

    await this.redis
      .multi()
      .hSet(key, {
        nodeId: node.nodeId,
        region: node.region,
        host: node.host,
        port: String(node.port),
        startedAt: String(node.startedAt),
        lastHeartbeatAt: String(now),
        activeConnections: String(node.activeConnections),
      })
      .expire(key, ttlSeconds)
      .sAdd('ws:nodes:active', node.nodeId)
      .exec();
  }

  async registerConnection(connection: ConnectionState, ttlSeconds: number): Promise<void> {
    const member = connectionMember(connection);
    const userConnectionsKey = userConnectionsKeyFor(connection.principal.userId);
    const connectionKeyName = connectionKey(connection.connectionId);

    await this.redis
      .multi()
      .sAdd(userConnectionsKey, member)
      .expire(userConnectionsKey, ttlSeconds)
      .hSet(connectionKeyName, {
        connectionId: connection.connectionId,
        userId: connection.principal.userId,
        nodeId: connection.nodeId,
        deviceId: connection.deviceId,
        connectedAt: String(connection.connectedAt),
        lastSeenAt: String(Date.now()),
      })
      .expire(connectionKeyName, ttlSeconds)
      .exec();
  }

  async refreshConnection(connection: ConnectionState, ttlSeconds: number): Promise<void> {
    const userConnectionsKey = userConnectionsKeyFor(connection.principal.userId);
    const connectionKeyName = connectionKey(connection.connectionId);

    await this.redis
      .multi()
      .expire(userConnectionsKey, ttlSeconds)
      .hSet(connectionKeyName, {
        lastSeenAt: String(Date.now()),
      })
      .expire(connectionKeyName, ttlSeconds)
      .exec();
  }

  async removeConnection(connection: ConnectionState): Promise<void> {
    await this.redis
      .multi()
      .sRem(userConnectionsKeyFor(connection.principal.userId), connectionMember(connection))
      .del(connectionKey(connection.connectionId))
      .exec();
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}

function nodeKey(nodeId: string): string {
  return `ws:node:${nodeId}`;
}

function userConnectionsKeyFor(userId: string): string {
  return `ws:user:${userId}:connections`;
}

function connectionKey(connectionId: string): string {
  return `ws:connection:${connectionId}`;
}

function connectionMember(connection: ConnectionState): string {
  return `${connection.nodeId}:${connection.connectionId}`;
}
