import { randomUUID } from 'node:crypto';
import { Kafka, type Producer } from 'kafkajs';
import type { MessageBus, PublishTextMessageInput } from '../../../application/ports/message-bus';

const MESSAGES_INBOUND_TOPIC = 'messages.inbound.v1';

interface KafkaEventEnvelope<TPayload> {
  eventId: string;
  eventType: string;
  eventVersion: 1;
  occurredAt: string;
  payload: TPayload;
}

interface InboundTextMessagePayload {
  messageId: string;
  clientMessageId?: string;
  conversationId: string;
  senderUserId: string;
  recipientUserIds: string[];
  type: 'text';
  body: string;
  replyToMessageId?: string;
  metadata?: Record<string, string>;
  sentAt: string;
  requestedAt: string;
}

export class KafkaMessageBus implements MessageBus {
  private readonly producer: Producer;

  constructor(clientId: string, brokers: string[]) {
    const kafka = new Kafka({ clientId, brokers });
    this.producer = kafka.producer({
      allowAutoTopicCreation: false,
      idempotent: true,
    });
  }

  async connect(): Promise<void> {
    await this.producer.connect();
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
  }

  async publishTextMessage(input: PublishTextMessageInput): Promise<string> {
    const now = new Date().toISOString();
    const messageId = randomUUID();
    const event: KafkaEventEnvelope<InboundTextMessagePayload> = {
      eventId: randomUUID(),
      eventType: 'messages.inbound.text',
      eventVersion: 1,
      occurredAt: now,
      payload: {
        messageId,
        clientMessageId: input.clientMessageId,
        conversationId: input.conversationId,
        senderUserId: input.senderUserId,
        recipientUserIds: input.recipientUserIds,
        type: 'text',
        body: input.body,
        replyToMessageId: input.replyToMessageId,
        metadata: input.metadata,
        sentAt: now,
        requestedAt: now,
      },
    };

    await this.producer.send({
      topic: MESSAGES_INBOUND_TOPIC,
      messages: [
        {
          key: input.conversationId,
          value: JSON.stringify(event),
          headers: {
            eventType: event.eventType,
            eventVersion: String(event.eventVersion),
          },
        },
      ],
    });

    return messageId;
  }
}
