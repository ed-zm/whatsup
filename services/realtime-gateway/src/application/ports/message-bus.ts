import type { TextMessagePayload } from '../../domain/entities/socket-events';

export interface PublishTextMessageInput extends TextMessagePayload {
  senderUserId: string;
}

export interface MessageBus {
  publishTextMessage(input: PublishTextMessageInput): Promise<string>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
