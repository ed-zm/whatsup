export interface PushNotificationMessage {
  tokens: string[];
  title: string;
  body: string;
  data: Record<string, string>;
}

export interface PushNotificationGateway {
  sendMulticast(message: PushNotificationMessage): Promise<void>;
}
