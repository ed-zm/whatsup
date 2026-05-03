import type { NextFunction, Request, Response } from 'express';
import type { RequestSmsCodeUseCase } from '../../../application/use-cases/request-sms-code.use-case';
import type { VerifySmsCodeUseCase } from '../../../application/use-cases/verify-sms-code.use-case';

export class AuthController {
  constructor(
    private readonly requestSmsCodeUseCase: RequestSmsCodeUseCase,
    private readonly verifySmsCodeUseCase: VerifySmsCodeUseCase,
  ) {}

  sendSms = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.requestSmsCodeUseCase.execute({
        phoneNumber: String(request.body?.phoneNumber ?? ''),
      });

      response.status(202).json(result);
    } catch (error) {
      next(error);
    }
  };

  verifySms = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.verifySmsCodeUseCase.execute({
        phoneNumber: String(request.body?.phoneNumber ?? ''),
        otpCode: String(request.body?.otpCode ?? ''),
      });

      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
