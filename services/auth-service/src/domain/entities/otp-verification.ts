export interface OtpVerification {
  id: string;
  phone: string;
  otpHash: string;
  expiresAt: Date;
  used: boolean;
}
