import type { MediaUploadRequest, PresignedUploadUrl } from '../../domain/entities/media-upload';
import type { AuthenticatedPrincipal } from '../../domain/entities/authenticated-principal';
import type { MediaStorage } from '../ports/media-storage';

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'audio/mpeg',
  'application/pdf',
]);

export class CreatePresignedMediaUploadUrlUseCase {
  constructor(private readonly mediaStorage: MediaStorage) {}

  async execute(
    principal: AuthenticatedPrincipal,
    request: MediaUploadRequest,
  ): Promise<PresignedUploadUrl> {
    validateUploadRequest(request);

    return this.mediaStorage.createPresignedUploadUrl({
      ...request,
      userId: principal.userId,
    });
  }
}

function validateUploadRequest(request: MediaUploadRequest): void {
  if (!request.fileName.trim()) {
    throw new Error('fileName is required');
  }

  if (!ALLOWED_CONTENT_TYPES.has(request.contentType)) {
    throw new Error('contentType is not allowed');
  }

  if (!Number.isInteger(request.sizeBytes) || request.sizeBytes <= 0 || request.sizeBytes > MAX_UPLOAD_BYTES) {
    throw new Error(`sizeBytes must be between 1 and ${MAX_UPLOAD_BYTES}`);
  }
}
