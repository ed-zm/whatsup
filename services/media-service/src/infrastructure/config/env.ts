export interface MediaServiceConfig {
  port: number;
  jwtSecret: string;
  awsRegion: string;
  s3Endpoint?: string;
  s3ForcePathStyle: boolean;
  s3BucketName: string;
  presignedUrlExpiresInSeconds: number;
}

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const config: MediaServiceConfig = {
  port: Number(process.env.PORT ?? 3003),
  jwtSecret: required('JWT_SECRET'),
  awsRegion: required('AWS_REGION'),
  s3Endpoint: process.env.S3_ENDPOINT ?? process.env.AWS_ENDPOINT_URL_S3,
  s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  s3BucketName: required('S3_BUCKET_NAME'),
  presignedUrlExpiresInSeconds: Number(process.env.S3_PRESIGNED_URL_TTL_SECONDS ?? 300),
};
