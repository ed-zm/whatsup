export interface OtpHasher {
  hash(otpCode: string, phoneNumber: string): string;
  verify(otpCode: string, phoneNumber: string, expectedHash: string): boolean;
}
