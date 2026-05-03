export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'location';

export interface InboundMessage {
  messageId: string;
  clientMessageId?: string;
  conversationId: string;
  senderUserId: string;
  recipientUserIds: string[];
  type: MessageType;
  body?: string;
  mediaUrl?: string;
  replyToMessageId?: string;
  metadata?: Record<string, string>;
  sentAt: string;
  requestedAt: string;
}

export interface InboundMessageEvent {
  eventId: string;
  eventType: string;
  eventVersion: 1;
  occurredAt: string;
  payload: InboundMessage;
}
