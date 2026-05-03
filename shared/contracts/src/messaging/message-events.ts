export const KafkaTopics = {
  messagesInbound: 'messages.inbound.v1',
  messagesPersisted: 'messages.persisted.v1',
  messagesDeliveryStatus: 'messages.delivery-status.v1',
  usersPresence: 'users.presence.v1',
  authOtpRequested: 'auth.otp-requested.v1',
  authOtpVerified: 'auth.otp-verified.v1',
} as const;

export type KafkaTopic = (typeof KafkaTopics)[keyof typeof KafkaTopics];

export type UUID = string;
export type ISODateTime = string;

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'location';

export type MessageDeliveryStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface KafkaEventEnvelope<TPayload> {
  eventId: UUID;
  eventType: string;
  eventVersion: 1;
  occurredAt: ISODateTime;
  traceId?: string;
  payload: TPayload;
}

export interface MessagePayload {
  messageId: UUID;
  clientMessageId?: string;
  conversationId: UUID;
  senderUserId: UUID;
  recipientUserIds: UUID[];
  type: MessageType;
  body?: string;
  mediaUrl?: string;
  replyToMessageId?: UUID;
  metadata?: Record<string, string>;
  sentAt: ISODateTime;
}

export interface InboundMessagePayload extends MessagePayload {
  requestedAt: ISODateTime;
}

export interface PersistedMessagePayload extends MessagePayload {
  persistedAt: ISODateTime;
  storage: {
    engine: 'cassandra';
    keyspace: string;
    table: 'messages_by_conversation_day';
    partition: {
      conversationId: UUID;
      messageDay: string;
    };
  };
}

export interface MessageDeliveryStatusPayload {
  messageId: UUID;
  conversationId: UUID;
  userId: UUID;
  status: MessageDeliveryStatus;
  occurredAt: ISODateTime;
  failureReason?: string;
}

export type InboundMessageEvent = KafkaEventEnvelope<InboundMessagePayload>;
export type PersistedMessageEvent = KafkaEventEnvelope<PersistedMessagePayload>;
export type MessageDeliveryStatusEvent = KafkaEventEnvelope<MessageDeliveryStatusPayload>;
