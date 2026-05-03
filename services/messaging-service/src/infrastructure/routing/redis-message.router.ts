import type { InboundMessage } from '../../domain/entities/inbound-message';
import type { OnlineConnectionTarget, RoutedRecipient } from '../../domain/entities/routing-target';
import type { MessageRouter } from '../../application/ports/message-router';
import type { OfflineMessageNotifier } from '../../application/ports/offline-message-notifier';

interface RedisRouterClient {
  sMembers(key: string): Promise<string[]>;
  publish(channel: string, message: string): Promise<number>;
  zAdd(key: string, value: { score: number; value: string }): Promise<number>;
  quit(): Promise<unknown>;
}

interface NodeDeliveryEvent {
  type: 'DELIVER_MESSAGE';
  target: OnlineConnectionTarget;
  message: InboundMessage;
}

export class RedisMessageRouter implements MessageRouter {
  private readonly redis: RedisRouterClient;

  constructor(
    redis: unknown,
    private readonly offlineMessageNotifier: OfflineMessageNotifier,
  ) {
    this.redis = redis as RedisRouterClient;
  }

  async routeMessage(message: InboundMessage): Promise<RoutedRecipient[]> {
    const routedRecipients = await Promise.all(
      message.recipientUserIds.map(async (userId) => this.routeRecipient(userId, message)),
    );

    return routedRecipients;
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }

  private async routeRecipient(userId: string, message: InboundMessage): Promise<RoutedRecipient> {
    const targets = await this.findOnlineTargets(userId);

    if (targets.length === 0) {
      await this.markDeferred(userId, message);
      await this.offlineMessageNotifier.notifyOfflineRecipient(userId, message);

      return {
        userId,
        deliveredOnline: false,
        targets: [],
      };
    }

    await Promise.all(targets.map((target) => this.publishToNode(target, message)));

    return {
      userId,
      deliveredOnline: true,
      targets,
    };
  }

  private async findOnlineTargets(userId: string): Promise<OnlineConnectionTarget[]> {
    const members = await this.redis.sMembers(`ws:user:${userId}:connections`);

    return members
      .map((member) => parseConnectionMember(userId, member))
      .filter((target): target is OnlineConnectionTarget => target !== null);
  }

  private async publishToNode(target: OnlineConnectionTarget, message: InboundMessage): Promise<void> {
    const event: NodeDeliveryEvent = {
      type: 'DELIVER_MESSAGE',
      target,
      message,
    };

    await this.redis.publish(`ws:node:${target.nodeId}:events`, JSON.stringify(event));
  }

  private async markDeferred(userId: string, message: InboundMessage): Promise<void> {
    await this.redis.zAdd(`messages:deferred:${userId}`, {
      score: new Date(message.sentAt).getTime(),
      value: message.messageId,
    });
  }
}

function parseConnectionMember(userId: string, member: string): OnlineConnectionTarget | null {
  const [nodeId, connectionId] = member.split(':');

  if (!nodeId || !connectionId) {
    return null;
  }

  return {
    userId,
    nodeId,
    connectionId,
  };
}
