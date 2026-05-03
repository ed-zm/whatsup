import { randomInt } from 'node:crypto';
import type { SendSmsRequestDto, SendSmsResponseDto } from '../dto/auth.dto';
import type { OtpHasher } from '../ports/otp-hasher';
import type { SmsGateway } from '../ports/sms-gateway';
import type { AuthRepository } from '../../domain/repositories/auth-repository';

const E164_PHONE_NUMBER = /^\+[1-9][0-9]{7,14}$/;

export class SendSmsUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly otpHasher: OtpHasher,
    private readonly smsGateway: SmsGateway,
    private readonly otpTtlMinutes: number,
  ) {}

  async execute(input: SendSmsRequestDto): Promise<SendSmsResponseDto> {
    const phoneNumber = normalizePhoneNumber(input.phoneNumber);
    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + this.otpTtlMinutes * 60_000);

    await this.authRepository.createOtpVerification({
      phoneNumber,
      otpHash: this.otpHasher.hash(otpCode, phoneNumber),
      purpose: 'registration',
      expiresAt,
    });

    await this.smsGateway.sendOtp(phoneNumber, otpCode);

    return {
      message: 'OTP sent',
      expiresAt: expiresAt.toISOString(),
    };
  }
}

export function normalizePhoneNumber(phoneNumber: string): string {
  const normalized = phoneNumber.trim();

  if (!E164_PHONE_NUMBER.test(normalized)) {
    throw new Error('phoneNumber must use E.164 format, for example +15551234567');
  }

  return normalized;
}

function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}
