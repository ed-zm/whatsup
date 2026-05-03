export interface MediaUploadRequest {
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface PresignedUploadUrl {
  uploadUrl: string;
  method: 'PUT';
  key: string;
  expiresInSeconds: number;
  headers: {
    'content-type': string;
  };
}
