import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

function getRequiredEnv(name: 'R2_ACCESS_KEY_ID' | 'R2_SECRET_ACCESS_KEY' | 'R2_BUCKET_NAME' | 'R2_ENDPOINT' | 'R2_PUBLIC_BASE_URL'): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required R2 configuration: ${name}`);
  }

  return value;
}

let client: S3Client | undefined;

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: getRequiredEnv('R2_ENDPOINT'),
      forcePathStyle: true,
      credentials: {
        accessKeyId: getRequiredEnv('R2_ACCESS_KEY_ID'),
        secretAccessKey: getRequiredEnv('R2_SECRET_ACCESS_KEY'),
      },
    });
  }

  return client;
}

function getPublicBaseUrl(): URL {
  return new URL(getRequiredEnv('R2_PUBLIC_BASE_URL').replace(/\/+$/, '') + '/');
}

function sanitizePathSegment(value: string | undefined, fallback: string): string {
  const sanitized = value?.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^_+|_+$/g, '');
  return sanitized || fallback;
}

function sanitizeFilename(filename: string): string {
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^_+|_+$/g, '');
  return sanitized || 'upload';
}

function createPublicUrl(key: string): string {
  const baseUrl = getPublicBaseUrl();
  return new URL(key.split('/').map(encodeURIComponent).join('/'), baseUrl).toString();
}

function getKeyFromPublicUrl(fileUrl: string): string | null {
  try {
    const file = new URL(fileUrl);
    const base = getPublicBaseUrl();

    if (file.origin !== base.origin) {
      return null;
    }

    const basePath = base.pathname.replace(/\/$/, '');
    if (basePath && !file.pathname.startsWith(`${basePath}/`)) {
      return null;
    }

    const keyPath = file.pathname.slice(basePath.length).replace(/^\/+/, '');
    return keyPath ? decodeURIComponent(keyPath) : null;
  } catch {
    return null;
  }
}

export function isR2PublicUrl(fileUrl: string): boolean {
  return Boolean(getKeyFromPublicUrl(fileUrl));
}

export async function uploadToR2(
  file: Buffer,
  filename: string,
  contentType: string,
  userId?: string,
  resourceId?: string,
): Promise<string> {
  const key = [
    'media',
    sanitizePathSegment(userId, 'unknown'),
    sanitizePathSegment(resourceId, 'new'),
    `${Date.now()}-${randomUUID()}-${sanitizeFilename(filename)}`,
  ].join('/');

  await getClient().send(new PutObjectCommand({
    Bucket: getRequiredEnv('R2_BUCKET_NAME'),
    Key: key,
    Body: file,
    ContentType: contentType || 'application/octet-stream',
  }));

  return createPublicUrl(key);
}

export async function deleteFromR2(fileUrl: string): Promise<void> {
  const key = getKeyFromPublicUrl(fileUrl);
  if (!key) {
    throw new Error('Refusing to delete a URL outside the configured R2 public base URL.');
  }

  await getClient().send(new DeleteObjectCommand({
    Bucket: getRequiredEnv('R2_BUCKET_NAME'),
    Key: key,
  }));
}
