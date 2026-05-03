import type { MediaUploadRequest, PresignedUploadUrl } from '../../domain/entities/media-upload';

export interface CreatePresignedUploadUrlInput extends MediaUploadRequest {
  userId: string;
}

export interface MediaStorage {
  createPresignedUploadUrl(input: CreatePresignedUploadUrlInput): Promise<PresignedUploadUrl>;
}
