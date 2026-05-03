export type OtpPurpose = 'registration' | 'login' | 'phone_change';
export type OtpStatus = 'pending' | 'verified' | 'expired' | 'blocked';

export interface OtpVerification {
  id: string;
  phoneNumber: string;
  otpHash: string;
  purpose: OtpPurpose;
  status: OtpStatus;
  attemptsCount: number;
  maxAttempts: number;
  sentAt: Date;
  expiresAt: Date;
  verifiedAt: Date | null;
}
