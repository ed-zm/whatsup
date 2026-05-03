export const SocketEvents = {
  textMessage: 'TEXT_MESSAGE',
  ping: 'PING',
  pong: 'PONG',
  error: 'ERROR',
  ack: 'ACK',
} as const;

export type SocketEventType = (typeof SocketEvents)[keyof typeof SocketEvents];

export interface SocketEnvelope<TPayload = unknown> {
  type: SocketEventType;
  requestId?: string;
  payload?: TPayload;
}

export interface TextMessagePayload {
  conversationId: string;
  recipientUserIds: string[];
  body: string;
  clientMessageId?: string;
  replyToMessageId?: string;
  metadata?: Record<string, string>;
}
