import type { OtpPurpose, OtpVerification } from '../entities/otp-verification';
import type { User } from '../entities/user';

export interface UserWithRolesAndPermissions {
  user: User;
  roles: string[];
  permissions: string[];
}

export interface AuthRepository {
  createOtpVerification(input: {
    phoneNumber: string;
    otpHash: string;
    purpose: OtpPurpose;
    expiresAt: Date;
  }): Promise<OtpVerification>;

  findLatestPendingOtp(phoneNumber: string, purpose: OtpPurpose): Promise<OtpVerification | null>;

  incrementOtpAttempts(otpId: string): Promise<void>;

  markOtpVerified(otpId: string): Promise<void>;

  markOtpExpired(otpId: string): Promise<void>;

  findUserByPhoneNumber(phoneNumber: string): Promise<User | null>;

  findOrCreateVerifiedUser(phoneNumber: string): Promise<User>;

  getUserRoles(userId: string): Promise<string[]>;

  getUserPermissions(userId: string): Promise<string[]>;

  findUserWithRolesAndPermissions(userId: string): Promise<UserWithRolesAndPermissions | null>;
}
