export interface SmsGateway {
  sendOtp(phoneNumber: string, otpCode: string): Promise<void>;
}
