import type { InboundMessageEvent } from '../../domain/entities/inbound-message';
import type { MessageRepository } from '../ports/message-repository';
import type { MessageRouter } from '../ports/message-router';

export class ProcessInboundMessageUseCase {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly messageRouter: MessageRouter,
  ) {}

  async execute(event: InboundMessageEvent): Promise<void> {
    validateInboundEvent(event);

    await this.messageRepository.insertMessage(event.payload);
    await this.messageRouter.routeMessage(event.payload);
  }
}

function validateInboundEvent(event: InboundMessageEvent): void {
  if (!event.payload?.messageId || !event.payload.conversationId || !event.payload.senderUserId) {
    throw new Error('Invalid inbound message event');
  }

  if (!Array.isArray(event.payload.recipientUserIds) || event.payload.recipientUserIds.length === 0) {
    throw new Error('Inbound message must have at least one recipient');
  }
}
