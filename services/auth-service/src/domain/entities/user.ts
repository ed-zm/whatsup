export interface User {
  id: string;
  phoneNumber: string;
  displayName: string | null;
  avatarUrl: string | null;
  about: string | null;
  isPhoneVerified: boolean;
  isActive: boolean;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
