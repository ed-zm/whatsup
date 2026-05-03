import { randomUUID } from 'node:crypto';

export interface RealtimeGatewayConfig {
  port: number;
  host: string;
  region: string;
  nodeId: string;
  jwtSecret: string;
  redisUrl: string;
  kafkaClientId: string;
  kafkaBrokers: string[];
  wsNodeTtlSeconds: number;
  wsConnectionTtlSeconds: number;
  heartbeatIntervalMs: number;
}

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const config: RealtimeGatewayConfig = {
  port: Number(process.env.PORT ?? 3002),
  host: process.env.HOST ?? '0.0.0.0',
  region: process.env.REGION ?? 'local',
  nodeId: process.env.NODE_ID ?? `realtime-${randomUUID()}`,
  jwtSecret: required('JWT_SECRET'),
  redisUrl: required('REDIS_URL'),
  kafkaClientId: process.env.KAFKA_CLIENT_ID ?? 'realtime-gateway',
  kafkaBrokers: required('KAFKA_BROKERS')
    .split(',')
    .map((broker) => broker.trim())
    .filter(Boolean),
  wsNodeTtlSeconds: Number(process.env.WS_NODE_TTL_SECONDS ?? 30),
  wsConnectionTtlSeconds: Number(process.env.WS_CONNECTION_TTL_SECONDS ?? 86_400),
  heartbeatIntervalMs: Number(process.env.WS_HEARTBEAT_INTERVAL_MS ?? 25_000),
};
