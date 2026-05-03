import { ProcessInboundMessageUseCase } from './application/use-cases/process-inbound-message.use-case';
import { NotifyOfflineRecipientUseCase } from './application/use-cases/notify-offline-recipient.use-case';
import { redisClient } from './infrastructure/cache/redis/redis-client';
import { config } from './infrastructure/config/env';
import { InboundMessageConsumer } from './infrastructure/messaging/kafka/inbound-message.consumer';
import { FirebasePushNotificationGateway } from './infrastructure/notifications/firebase-push-notification.gateway';
import { cassandraClient } from './infrastructure/persistence/cassandra/cassandra-client';
import { CassandraMessageRepository } from './infrastructure/persistence/cassandra/cassandra-message.repository';
import { postgresPool } from './infrastructure/persistence/postgres/postgres-pool';
import { PostgresPushTokenRepository } from './infrastructure/persistence/postgres/postgres-push-token.repository';
import { RedisMessageRouter } from './infrastructure/routing/redis-message.router';

async function bootstrap(): Promise<void> {
  await redisClient.connect();
  await cassandraClient.connect();

  const messageRepository = new CassandraMessageRepository(cassandraClient);
  const pushTokenRepository = new PostgresPushTokenRepository(postgresPool);
  const offlineMessageNotifier = new NotifyOfflineRecipientUseCase(
    pushTokenRepository,
    new FirebasePushNotificationGateway(),
  );
  const messageRouter = new RedisMessageRouter(redisClient, offlineMessageNotifier);
  const processInboundMessageUseCase = new ProcessInboundMessageUseCase(
    messageRepository,
    messageRouter,
  );
  const consumer = new InboundMessageConsumer(
    config.kafkaClientId,
    config.kafkaBrokers,
    config.kafkaGroupId,
    processInboundMessageUseCase,
  );

  await consumer.start();
  console.info('messaging-service is consuming messages.inbound.v1');

  const shutdown = async () => {
    console.info('messaging-service shutting down');
    await consumer.stop();
    await messageRouter.disconnect();
    await messageRepository.disconnect();
    await pushTokenRepository.disconnect();
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
  console.error('messaging-service failed to start', error);
  process.exit(1);
});
