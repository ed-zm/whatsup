import type { VerifySmsRequestDto, VerifySmsResponseDto } from '../dto/auth.dto';
import type { OtpHasher } from '../ports/otp-hasher';
import type { TokenService } from '../ports/token-service';
import type { AuthRepository } from '../../domain/repositories/auth-repository';
import { normalizePhoneNumber } from './send-sms.use-case';

const SIX_DIGIT_OTP = /^[0-9]{6}$/;

export class VerifySmsUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly otpHasher: OtpHasher,
    private readonly tokenService: TokenService,
    private readonly jwtExpiresIn: string,
  ) {}

  async execute(input: VerifySmsRequestDto): Promise<VerifySmsResponseDto> {
    const phoneNumber = normalizePhoneNumber(input.phoneNumber);
    const otpCode = input.otpCode.trim();

    if (!SIX_DIGIT_OTP.test(otpCode)) {
      throw new Error('otpCode must contain exactly 6 digits');
    }

    const otp = await this.authRepository.findLatestPendingOtp(phoneNumber, 'registration');

    if (!otp) {
      throw new Error('Invalid or expired OTP');
    }

    if (otp.expiresAt.getTime() <= Date.now()) {
      await this.authRepository.markOtpExpired(otp.id);
      throw new Error('Invalid or expired OTP');
    }

    if (!this.otpHasher.verify(otpCode, phoneNumber, otp.otpHash)) {
      await this.authRepository.incrementOtpAttempts(otp.id);
      throw new Error('Invalid or expired OTP');
    }

    await this.authRepository.markOtpVerified(otp.id);

    const user = await this.authRepository.findOrCreateVerifiedUser(phoneNumber);
    const roles = await this.authRepository.getUserRoles(user.id);
    const accessToken = this.tokenService.sign({
      userId: user.id,
      phoneNumber: user.phoneNumber,
      roles,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.jwtExpiresIn,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        roles,
      },
    };
  }
}
