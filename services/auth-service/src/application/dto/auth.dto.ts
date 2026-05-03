export interface SendSmsRequestDto {
  phoneNumber: string;
}

export interface SendSmsResponseDto {
  message: string;
  expiresAt: string;
}

export interface VerifySmsRequestDto {
  phoneNumber: string;
  otpCode: string;
}

export interface VerifySmsResponseDto {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: {
    id: string;
    phoneNumber: string;
    roles: string[];
  };
}
