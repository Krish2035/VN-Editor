import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const S3_BUCKET = process.env.S3_BUCKET || 'vn-editor-media';
const S3_REGION = process.env.S3_REGION || 'us-east-1';
const S3_ENDPOINT = process.env.S3_ENDPOINT; // For Cloudflare R2 or MinIO
const S3_PUBLIC_CDN_URL = process.env.S3_PUBLIC_CDN_URL;

export const isS3Configured = Boolean(
  process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
);

export const s3Client = new S3Client({
  region: S3_REGION,
  ...(S3_ENDPOINT ? { endpoint: S3_ENDPOINT } : {}),
  ...(isS3Configured
    ? {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!
        }
      }
    : {})
});

export interface PresignedUploadResult {
  uploadUrl: string;
  s3Key: string;
  publicUrl: string;
  isCloudStorage: boolean;
  expiresInSec: number;
}

/**
 * Generates a presigned S3 PUT URL for direct client-to-cloud upload (Pillars 48, 88)
 */
export const generatePresignedUploadUrl = async (
  filename: string,
  mimeType: string,
  userId: string
): Promise<PresignedUploadResult> => {
  const ext = path.extname(filename);
  const s3Key = `users/${userId}/media/${Date.now()}_${uuidv4().substring(0, 8)}${ext}`;

  if (!isS3Configured) {
    // Local development fallback
    return {
      uploadUrl: `/api/v1/media/upload`,
      s3Key,
      publicUrl: `/uploads/${filename}`,
      isCloudStorage: false,
      expiresInSec: 900
    };
  }

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    ContentType: mimeType
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
  const publicUrl = S3_PUBLIC_CDN_URL
    ? `${S3_PUBLIC_CDN_URL}/${s3Key}`
    : `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${s3Key}`;

  return {
    uploadUrl,
    s3Key,
    publicUrl,
    isCloudStorage: true,
    expiresInSec: 900
  };
};

/**
 * Generates a presigned download GET URL for secure media access
 */
export const generatePresignedDownloadUrl = async (s3Key: string): Promise<string> => {
  if (!isS3Configured) {
    return s3Key;
  }

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};
