import { randomInt } from 'node:crypto';
import { ValidationError } from '../errors/auth-errors';
import type { SendSmsRequestDto, SendSmsResponseDto } from '../dto/auth.dto';
import type { OtpHasher } from '../ports/otp-hasher';
import type { OtpRateLimiter } from '../ports/otp-rate-limiter';
import type { SmsGateway } from '../ports/sms-gateway';
import type { OtpRepository } from '../../domain/repositories/otp-repository';

const E164_PHONE_NUMBER = /^\+[1-9][0-9]{7,14}$/;

export class RequestSmsCodeUseCase {
  constructor(
    private readonly otpRepository: OtpRepository,
    private readonly otpHasher: OtpHasher,
    private readonly smsGateway: SmsGateway,
    private readonly otpRateLimiter: OtpRateLimiter,
    private readonly otpTtlMinutes: number,
  ) {}

  async execute(input: SendSmsRequestDto): Promise<SendSmsResponseDto> {
    const phone = normalizePhoneNumber(input.phoneNumber);

    await this.otpRateLimiter.assertCanRequestOtp(phone);

    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + this.otpTtlMinutes * 60_000);

    await this.otpRepository.create({
      phone,
      otpHash: this.otpHasher.hash(otpCode, phone),
      expiresAt,
    });

    await this.smsGateway.sendOtp(phone, otpCode);

    return {
      message: 'OTP sent',
      expiresAt: expiresAt.toISOString(),
    };
  }
}

export function normalizePhoneNumber(phoneNumber: string): string {
  const normalized = phoneNumber.trim();

  if (!E164_PHONE_NUMBER.test(normalized)) {
    throw new ValidationError('phoneNumber must use E.164 format, for example +15551234567');
  }

  return normalized;
}

function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}
