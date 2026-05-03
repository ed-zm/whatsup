export interface OtpRateLimiter {
  assertCanRequestOtp(phone: string): Promise<void>;
}
