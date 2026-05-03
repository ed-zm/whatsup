import type { InboundMessage } from '../../domain/entities/inbound-message';

export interface OfflineMessageNotifier {
  notifyOfflineRecipient(userId: string, message: InboundMessage): Promise<void>;
}
