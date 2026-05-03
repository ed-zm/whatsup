import { InvalidOtpError, ValidationError } from '../errors/auth-errors';
import type { VerifySmsRequestDto, VerifySmsResponseDto } from '../dto/auth.dto';
import type { OtpHasher } from '../ports/otp-hasher';
import type { TokenService } from '../ports/token-service';
import type { AuthRepository } from '../../domain/repositories/auth-repository';
import type { OtpRepository } from '../../domain/repositories/otp-repository';
import { normalizePhoneNumber } from './request-sms-code.use-case';

const SIX_DIGIT_OTP = /^[0-9]{6}$/;

export class VerifySmsCodeUseCase {
  constructor(
    private readonly otpRepository: OtpRepository,
    private readonly authRepository: AuthRepository,
    private readonly otpHasher: OtpHasher,
    private readonly tokenService: TokenService,
    private readonly jwtExpiresIn: string,
  ) {}

  async execute(input: VerifySmsRequestDto): Promise<VerifySmsResponseDto> {
    const phone = normalizePhoneNumber(input.phoneNumber);
    const otpCode = input.otpCode.trim();

    if (!SIX_DIGIT_OTP.test(otpCode)) {
      throw new ValidationError('otpCode must contain exactly 6 digits');
    }

    const otp = await this.otpRepository.findLatestValidByPhone(phone);

    if (!otp || !this.otpHasher.verify(otpCode, phone, otp.otpHash)) {
      throw new InvalidOtpError();
    }

    const markedAsUsed = await this.otpRepository.markUsed(otp.id);

    if (!markedAsUsed) {
      throw new InvalidOtpError();
    }

    const user = await this.authRepository.findOrCreateVerifiedUser(phone);
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
