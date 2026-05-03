import type { OtpVerification } from '../entities/otp-verification';

export interface OtpRepository {
  create(input: {
    phone: string;
    otpHash: string;
    expiresAt: Date;
  }): Promise<OtpVerification>;

  findLatestValidByPhone(phone: string): Promise<OtpVerification | null>;

  markUsed(otpId: string): Promise<boolean>;
}
