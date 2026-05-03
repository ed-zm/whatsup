import type { InboundMessage } from '../../domain/entities/inbound-message';
import type { RoutedRecipient } from '../../domain/entities/routing-target';

export interface MessageRouter {
  routeMessage(message: InboundMessage): Promise<RoutedRecipient[]>;
  disconnect(): Promise<void>;
}
