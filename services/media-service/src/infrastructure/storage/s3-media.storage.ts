import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  CreatePresignedUploadUrlInput,
  MediaStorage,
} from '../../application/ports/media-storage';
import type { PresignedUploadUrl } from '../../domain/entities/media-upload';

export class S3MediaStorage implements MediaStorage {
  private readonly client: S3Client;

  constructor(
    region: string,
    private readonly bucketName: string,
    private readonly expiresInSeconds: number,
    endpoint?: string,
    forcePathStyle = false,
  ) {
    this.client = new S3Client({
      region,
      endpoint,
      forcePathStyle,
    });
  }

  async createPresignedUploadUrl(input: CreatePresignedUploadUrlInput): Promise<PresignedUploadUrl> {
    const key = createObjectKey(input.userId, input.fileName);
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: input.contentType,
      ContentLength: input.sizeBytes,
      ServerSideEncryption: 'AES256',
    });
    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: this.expiresInSeconds,
    });

    return {
      uploadUrl,
      method: 'PUT',
      key,
      expiresInSeconds: this.expiresInSeconds,
      headers: {
        'content-type': input.contentType,
      },
    };
  }
}

function createObjectKey(userId: string, fileName: string): string {
  const extension = sanitizeExtension(extname(fileName));
  const today = new Date().toISOString().slice(0, 10);

  return `users/${userId}/uploads/${today}/${randomUUID()}${extension}`;
}

function sanitizeExtension(extension: string): string {
  return /^[a-zA-Z0-9.]{1,12}$/.test(extension) ? extension.toLowerCase() : '';
}
