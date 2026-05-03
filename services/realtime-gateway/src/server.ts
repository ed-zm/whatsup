import http from 'node:http';
import { PublishTextMessageUseCase } from './application/use-cases/publish-text-message.use-case';
import { RealtimeWebSocketServer } from './adapters/websocket/realtime-websocket-server';
import { config } from './infrastructure/config/env';
import { redisClient } from './infrastructure/cache/redis/redis-client';
import { RedisConnectionStateStore } from './infrastructure/cache/redis/redis-connection-state.store';
import { KafkaMessageBus } from './infrastructure/messaging/kafka/kafka-message-bus';
import { JwtTokenVerifier } from './infrastructure/security/jwt-token-verifier';

async function bootstrap(): Promise<void> {
  await redisClient.connect();

  const connectionStateStore = new RedisConnectionStateStore(redisClient);
  const messageBus = new KafkaMessageBus(config.kafkaClientId, config.kafkaBrokers);
  await messageBus.connect();

  const realtimeServer = new RealtimeWebSocketServer({
    nodeId: config.nodeId,
    region: config.region,
    host: config.host,
    port: config.port,
    nodeTtlSeconds: config.wsNodeTtlSeconds,
    connectionTtlSeconds: config.wsConnectionTtlSeconds,
    heartbeatIntervalMs: config.heartbeatIntervalMs,
    tokenVerifier: new JwtTokenVerifier(config.jwtSecret),
    connectionStateStore,
    publishTextMessageUseCase: new PublishTextMessageUseCase(messageBus),
  });

  await realtimeServer.start();

  const server = http.createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ status: 'ok', nodeId: config.nodeId }));
  });

  server.on('upgrade', (request, socket, head) => {
    realtimeServer.handleUpgrade(request, socket, head);
  });

  server.listen(config.port, config.host, () => {
    console.info(`realtime-gateway listening on ${config.host}:${config.port}`);
  });

  const shutdown = async () => {
    console.info('realtime-gateway shutting down');
    server.close();
    await realtimeServer.stop();
    await messageBus.disconnect();
    await connectionStateStore.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown();
  });
  process.on('SIGTERM', () => {
    void shutdown();
  });
}

bootstrap().catch((error) => {
  console.error('realtime-gateway failed to start', error);
  process.exit(1);
});
