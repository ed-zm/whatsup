import type { RealtimePrincipal } from '../../domain/entities/realtime-principal';

export interface ConnectionState {
  connectionId: string;
  nodeId: string;
  deviceId: string;
  principal: RealtimePrincipal;
  connectedAt: number;
}

export interface NodeState {
  nodeId: string;
  region: string;
  host: string;
  port: number;
  startedAt: number;
  activeConnections: number;
}

export interface ConnectionStateStore {
  registerNode(node: NodeState, ttlSeconds: number): Promise<void>;
  registerConnection(connection: ConnectionState, ttlSeconds: number): Promise<void>;
  refreshConnection(connection: ConnectionState, ttlSeconds: number): Promise<void>;
  removeConnection(connection: ConnectionState): Promise<void>;
  disconnect(): Promise<void>;
}
