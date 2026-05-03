import type { MessageBus } from '../ports/message-bus';
import type { RealtimePrincipal } from '../../domain/entities/realtime-principal';
import type { TextMessagePayload } from '../../domain/entities/socket-events';

const UUID_LIKE = /^[0-9a-fA-F-]{32,36}$/;
const MAX_TEXT_LENGTH = 4096;

export class PublishTextMessageUseCase {
  constructor(private readonly messageBus: MessageBus) {}

  async execute(principal: RealtimePrincipal, payload: TextMessagePayload): Promise<string> {
    validateTextMessagePayload(payload);

    return this.messageBus.publishTextMessage({
      ...payload,
      senderUserId: principal.userId,
      body: payload.body.trim(),
    });
  }
}

function validateTextMessagePayload(payload: TextMessagePayload): void {
  if (!UUID_LIKE.test(payload.conversationId)) {
    throw new Error('conversationId must be a UUID');
  }

  if (!Array.isArray(payload.recipientUserIds) || payload.recipientUserIds.length === 0) {
    throw new Error('recipientUserIds must contain at least one user id');
  }

  if (payload.recipientUserIds.some((userId) => !UUID_LIKE.test(userId))) {
    throw new Error('recipientUserIds must contain valid UUIDs');
  }

  const body = payload.body?.trim();

  if (!body || body.length > MAX_TEXT_LENGTH) {
    throw new Error(`body must contain 1-${MAX_TEXT_LENGTH} characters`);
  }
}
