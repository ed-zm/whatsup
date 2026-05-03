import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { WebSocket, WebSocketServer } from 'ws';
import type { ConnectionStateStore } from '../../application/ports/connection-state-store';
import { PublishTextMessageUseCase } from '../../application/use-cases/publish-text-message.use-case';
import type { TokenVerifier } from '../../application/ports/token-verifier';
import type { RealtimePrincipal } from '../../domain/entities/realtime-principal';
import {
  SocketEvents,
  type SocketEnvelope,
  type TextMessagePayload,
} from '../../domain/entities/socket-events';
import { canEmitSocketEvent } from './auth/socket-rbac';
import { extractTokenFromHandshake } from './auth/extract-token';

interface AuthenticatedWebSocket extends WebSocket {
  connectionId: string;
  deviceId: string;
  isAlive: boolean;
  principal: RealtimePrincipal;
}

interface RealtimeWebSocketServerOptions {
  nodeId: string;
  region: string;
  host: string;
  port: number;
  nodeTtlSeconds: number;
  connectionTtlSeconds: number;
  heartbeatIntervalMs: number;
  tokenVerifier: TokenVerifier;
  connectionStateStore: ConnectionStateStore;
  publishTextMessageUseCase: PublishTextMessageUseCase;
}

export class RealtimeWebSocketServer {
  private readonly webSocketServer = new WebSocketServer({ noServer: true });
  private readonly connections = new Map<string, AuthenticatedWebSocket>();
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private nodeHeartbeatTimer: NodeJS.Timeout | null = null;
  private readonly startedAt = Date.now();

  constructor(private readonly options: RealtimeWebSocketServerOptions) {
    this.webSocketServer.on('connection', (socket, request) => {
      void this.handleConnection(socket as AuthenticatedWebSocket, request);
    });
  }

  async start(): Promise<void> {
    await this.refreshNodeState();

    this.heartbeatTimer = setInterval(() => {
      void this.pingConnections();
    }, this.options.heartbeatIntervalMs);

    this.nodeHeartbeatTimer = setInterval(() => {
      void this.refreshNodeState();
    }, Math.max(5_000, Math.floor(this.options.nodeTtlSeconds * 500)));
  }

  handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer): void {
    const token = extractTokenFromHandshake(request);

    if (!token) {
      rejectUpgrade(socket, 401, 'Missing token');
      return;
    }

    let principal: RealtimePrincipal;

    try {
      principal = this.options.tokenVerifier.verify(token);
    } catch {
      rejectUpgrade(socket, 401, 'Invalid token');
      return;
    }

    this.webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
      const authenticatedSocket = webSocket as AuthenticatedWebSocket;
      authenticatedSocket.principal = principal;
      authenticatedSocket.connectionId = randomUUID();
      authenticatedSocket.deviceId = extractDeviceId(request);
      authenticatedSocket.isAlive = true;

      this.webSocketServer.emit('connection', authenticatedSocket, request);
    });
  }

  async stop(): Promise<void> {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    if (this.nodeHeartbeatTimer) {
      clearInterval(this.nodeHeartbeatTimer);
    }

    await Promise.all(
      [...this.connections.values()].map(async (socket) => {
        await this.removeConnection(socket);
        socket.close(1001, 'Server shutting down');
      }),
    );

    this.webSocketServer.close();
  }

  private async handleConnection(socket: AuthenticatedWebSocket, _request: IncomingMessage): Promise<void> {
    this.connections.set(socket.connectionId, socket);

    await this.options.connectionStateStore.registerConnection(
      this.toConnectionState(socket),
      this.options.connectionTtlSeconds,
    );
    await this.refreshNodeState();

    socket.on('pong', () => {
      socket.isAlive = true;
      void this.options.connectionStateStore.refreshConnection(
        this.toConnectionState(socket),
        this.options.connectionTtlSeconds,
      );
    });

    socket.on('message', (rawMessage) => {
      void this.handleMessage(socket, rawMessage.toString());
    });

    socket.on('close', () => {
      void this.removeConnection(socket);
    });

    socket.on('error', () => {
      void this.removeConnection(socket);
    });

    send(socket, {
      type: SocketEvents.ack,
      payload: {
        connectionId: socket.connectionId,
        nodeId: this.options.nodeId,
      },
    });
  }

  private async handleMessage(socket: AuthenticatedWebSocket, rawMessage: string): Promise<void> {
    let envelope: SocketEnvelope;

    try {
      envelope = JSON.parse(rawMessage) as SocketEnvelope;
    } catch {
      sendError(socket, 'Invalid JSON payload');
      return;
    }

    if (envelope.type === SocketEvents.ping) {
      await this.options.connectionStateStore.refreshConnection(
        this.toConnectionState(socket),
        this.options.connectionTtlSeconds,
      );
      send(socket, { type: SocketEvents.pong, requestId: envelope.requestId });
      return;
    }

    if (!canEmitSocketEvent(socket.principal, envelope.type)) {
      sendError(socket, 'Insufficient permissions', envelope.requestId);
      return;
    }

    if (envelope.type === SocketEvents.textMessage) {
      await this.handleTextMessage(socket, envelope as SocketEnvelope<TextMessagePayload>);
      return;
    }

    sendError(socket, `Unsupported event type: ${envelope.type}`, envelope.requestId);
  }

  private async handleTextMessage(
    socket: AuthenticatedWebSocket,
    envelope: SocketEnvelope<TextMessagePayload>,
  ): Promise<void> {
    try {
      if (!envelope.payload) {
        throw new Error('TEXT_MESSAGE payload is required');
      }

      const messageId = await this.options.publishTextMessageUseCase.execute(
        socket.principal,
        envelope.payload,
      );

      send(socket, {
        type: SocketEvents.ack,
        requestId: envelope.requestId,
        payload: { messageId },
      });
    } catch (error) {
      sendError(
        socket,
        error instanceof Error ? error.message : 'Unable to publish message',
        envelope.requestId,
      );
    }
  }

  private async pingConnections(): Promise<void> {
    for (const socket of this.connections.values()) {
      if (!socket.isAlive) {
        await this.removeConnection(socket);
        socket.terminate();
        continue;
      }

      socket.isAlive = false;
      socket.ping();
    }
  }

  private async removeConnection(socket: AuthenticatedWebSocket): Promise<void> {
    if (!this.connections.has(socket.connectionId)) {
      return;
    }

    this.connections.delete(socket.connectionId);
    await this.options.connectionStateStore.removeConnection(this.toConnectionState(socket));
    await this.refreshNodeState();
  }

  private async refreshNodeState(): Promise<void> {
    await this.options.connectionStateStore.registerNode(
      {
        nodeId: this.options.nodeId,
        region: this.options.region,
        host: this.options.host,
        port: this.options.port,
        startedAt: this.startedAt,
        activeConnections: this.connections.size,
      },
      this.options.nodeTtlSeconds,
    );
  }

  private toConnectionState(socket: AuthenticatedWebSocket) {
    return {
      connectionId: socket.connectionId,
      nodeId: this.options.nodeId,
      deviceId: socket.deviceId,
      principal: socket.principal,
      connectedAt: this.startedAt,
    };
  }
}

function rejectUpgrade(socket: Duplex, statusCode: number, reason: string): void {
  socket.write(`HTTP/1.1 ${statusCode} ${reason}\r\nConnection: close\r\n\r\n`);
  socket.destroy();
}

function extractDeviceId(request: IncomingMessage): string {
  const deviceId = request.headers['x-device-id'];

  return Array.isArray(deviceId) ? deviceId[0] : deviceId ?? 'unknown';
}

function send(socket: WebSocket, envelope: SocketEnvelope): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(envelope));
  }
}

function sendError(socket: WebSocket, message: string, requestId?: string): void {
  send(socket, {
    type: SocketEvents.error,
    requestId,
    payload: { message },
  });
}
