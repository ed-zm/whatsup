export interface PushTokenRepository {
  findActiveFcmTokensByUserId(userId: string): Promise<string[]>;
  disconnect(): Promise<void>;
}
