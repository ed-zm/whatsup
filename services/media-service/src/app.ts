import express from 'express';
import { MediaController } from './adapters/http/controllers/media.controller';
import { errorHandler } from './adapters/http/middlewares/error-handler.middleware';
import { createMediaRouter } from './adapters/http/routes/media.routes';
import { CreatePresignedMediaUploadUrlUseCase } from './application/use-cases/create-presigned-media-upload-url.use-case';
import { config } from './infrastructure/config/env';
import { JwtTokenVerifier } from './infrastructure/security/jwt-token-verifier';
import { S3MediaStorage } from './infrastructure/storage/s3-media.storage';

export function createApp() {
  const app = express();
  const tokenVerifier = new JwtTokenVerifier(config.jwtSecret);
  const mediaStorage = new S3MediaStorage(
    config.awsRegion,
    config.s3BucketName,
    config.presignedUrlExpiresInSeconds,
    config.s3Endpoint,
    config.s3ForcePathStyle,
  );
  const mediaController = new MediaController(
    new CreatePresignedMediaUploadUrlUseCase(mediaStorage),
  );

  app.use(express.json());
  app.use('/api/media', createMediaRouter(mediaController, tokenVerifier));
  app.use(errorHandler);

  return app;
}
