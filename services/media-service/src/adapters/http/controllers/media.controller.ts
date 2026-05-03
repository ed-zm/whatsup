import type { NextFunction, Response } from 'express';
import type { CreatePresignedMediaUploadUrlUseCase } from '../../../application/use-cases/create-presigned-media-upload-url.use-case';
import type { AuthenticatedRequest } from '../types/authenticated-request';

export class MediaController {
  constructor(private readonly createPresignedUrlUseCase: CreatePresignedMediaUploadUrlUseCase) {}

  getPresignedUrl = async (
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!request.auth) {
        response.status(401).json({ message: 'Authentication required' });
        return;
      }

      const result = await this.createPresignedUrlUseCase.execute(request.auth, {
        fileName: String(request.query.fileName ?? ''),
        contentType: String(request.query.contentType ?? ''),
        sizeBytes: Number(request.query.sizeBytes ?? 0),
      });

      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
