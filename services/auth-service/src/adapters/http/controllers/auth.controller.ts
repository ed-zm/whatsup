import type { NextFunction, Request, Response } from 'express';
import type { SendSmsUseCase } from '../../../application/use-cases/send-sms.use-case';
import type { VerifySmsUseCase } from '../../../application/use-cases/verify-sms.use-case';

export class AuthController {
  constructor(
    private readonly sendSmsUseCase: SendSmsUseCase,
    private readonly verifySmsUseCase: VerifySmsUseCase,
  ) {}

  sendSms = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.sendSmsUseCase.execute({
        phoneNumber: String(request.body?.phoneNumber ?? ''),
      });

      response.status(202).json(result);
    } catch (error) {
      next(error);
    }
  };

  verifySms = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.verifySmsUseCase.execute({
        phoneNumber: String(request.body?.phoneNumber ?? ''),
        otpCode: String(request.body?.otpCode ?? ''),
      });

      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
