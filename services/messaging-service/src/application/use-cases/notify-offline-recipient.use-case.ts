import type { InboundMessage } from '../../domain/entities/inbound-message';
import type { OfflineMessageNotifier } from '../ports/offline-message-notifier';
import type { PushNotificationGateway } from '../ports/push-notification-gateway';
import type { PushTokenRepository } from '../ports/push-token-repository';

export class NotifyOfflineRecipientUseCase implements OfflineMessageNotifier {
  constructor(
    private readonly pushTokenRepository: PushTokenRepository,
    private readonly pushNotificationGateway: PushNotificationGateway,
  ) {}

  async notifyOfflineRecipient(userId: string, message: InboundMessage): Promise<void> {
    const tokens = await this.pushTokenRepository.findActiveFcmTokensByUserId(userId);

    if (tokens.length === 0) {
      return;
    }

    await this.pushNotificationGateway.sendMulticast({
      tokens,
      title: 'Nuevo mensaje',
      body: 'Tienes un nuevo mensaje',
      data: {
        messageId: message.messageId,
        conversationId: message.conversationId,
        senderUserId: message.senderUserId,
        type: message.type,
      },
    });
  }
}
