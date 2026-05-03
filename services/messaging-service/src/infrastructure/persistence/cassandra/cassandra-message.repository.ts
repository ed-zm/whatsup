import cassandra from 'cassandra-driver';
import type { InboundMessage } from '../../../domain/entities/inbound-message';
import type {
  MessageRepository,
  PersistedMessageReference,
} from '../../../application/ports/message-repository';

const INSERT_MESSAGE_CQL = `
  INSERT INTO messages_by_conversation_day (
    conversation_id,
    message_day,
    sent_at,
    message_id,
    sender_user_id,
    recipient_user_ids,
    message_type,
    body,
    media_url,
    reply_to_message_id,
    client_message_id,
    status,
    metadata,
    created_at,
    edited_at,
    deleted_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

export class CassandraMessageRepository implements MessageRepository {
  constructor(private readonly client: cassandra.Client) {}

  async insertMessage(message: InboundMessage): Promise<PersistedMessageReference> {
    const sentAt = new Date(message.sentAt);
    const messageDay = toCassandraDate(sentAt);
    const storageMessageId = cassandra.types.TimeUuid.fromDate(sentAt);
    const metadata = {
      ...(message.metadata ?? {}),
      originalMessageId: message.messageId,
    };

    await this.client.execute(
      INSERT_MESSAGE_CQL,
      [
        cassandra.types.Uuid.fromString(message.conversationId),
        messageDay,
        sentAt,
        storageMessageId,
        cassandra.types.Uuid.fromString(message.senderUserId),
        message.recipientUserIds.map((userId) => cassandra.types.Uuid.fromString(userId)),
        message.type,
        message.body ?? null,
        message.mediaUrl ?? null,
        message.replyToMessageId ? cassandra.types.TimeUuid.fromString(message.replyToMessageId) : null,
        message.clientMessageId ?? null,
        'persisted',
        metadata,
        new Date(),
        null,
        null,
      ],
      { prepare: true },
    );

    return {
      conversationId: message.conversationId,
      messageDay: messageDay.toString(),
      sentAt,
      storageMessageId: storageMessageId.toString(),
    };
  }

  async disconnect(): Promise<void> {
    await this.client.shutdown();
  }
}

function toCassandraDate(date: Date): cassandra.types.LocalDate {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  return cassandra.types.LocalDate.fromString(
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  );
}
