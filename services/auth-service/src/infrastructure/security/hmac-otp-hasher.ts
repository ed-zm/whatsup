import { createHmac, timingSafeEqual } from 'node:crypto';
import type { OtpHasher } from '../../application/ports/otp-hasher';

export class HmacOtpHasher implements OtpHasher {
  constructor(private readonly pepper: string) {}

  hash(otpCode: string, phoneNumber: string): string {
    return createHmac('sha256', this.pepper).update(`${phoneNumber}:${otpCode}`).digest('hex');
  }

  verify(otpCode: string, phoneNumber: string, expectedHash: string): boolean {
    const actualHash = this.hash(otpCode, phoneNumber);
    const actual = Buffer.from(actualHash, 'hex');
    const expected = Buffer.from(expectedHash, 'hex');

    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
}
