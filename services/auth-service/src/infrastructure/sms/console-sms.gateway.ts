import type { SmsGateway } from '../../application/ports/sms-gateway';

export class ConsoleSmsGateway implements SmsGateway {
  async sendOtp(phoneNumber: string, otpCode: string): Promise<void> {
    console.info(`[sms:simulated] Sending OTP ${otpCode} to ${phoneNumber}`);
  }
}
