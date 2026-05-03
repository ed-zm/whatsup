import type { InboundMessage } from '../../domain/entities/inbound-message';

export interface PersistedMessageReference {
  conversationId: string;
  messageDay: string;
  sentAt: Date;
  storageMessageId: string;
}

export interface MessageRepository {
  insertMessage(message: InboundMessage): Promise<PersistedMessageReference>;
  disconnect(): Promise<void>;
}
