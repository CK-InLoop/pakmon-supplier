import { ContainerClient } from '@azure/storage-blob';
import {
  deleteFromR2 as deleteR2Object,
  isR2PublicUrl,
  uploadToR2,
} from '@/lib/r2-storage';

const AZURE_SAS_URL = process.env.AZURE_SAS_URL?.trim() || '';
const SAS_TOKEN = AZURE_SAS_URL.includes('?') ? AZURE_SAS_URL.split('?')[1] : '';

let containerClient: ContainerClient | null = null;

if (AZURE_SAS_URL) {
  try {
    containerClient = new ContainerClient(AZURE_SAS_URL);
  } catch (error) {
    console.error('Failed to initialize legacy Azure Blob Storage client:', error);
  }
}

export function isAzureBlobUrl(blobUrl: string): boolean {
  try {
    return new URL(blobUrl).hostname === 'pakmon.blob.core.windows.net';
  } catch {
    return false;
  }
}

/**
 * Backwards-compatible upload entry point used by existing route handlers.
 * New uploads are stored in Cloudflare R2; legacy Azure media remains readable.
 */
export async function uploadToAzure(
  file: Buffer,
  filename: string,
  contentType: string,
  userId?: string,
  productId?: string,
): Promise<string> {
  return uploadToR2(file, filename, contentType, userId, productId);
}

/**
 * Deletes media from its current provider. Azure URLs are retained for legacy
 * records while R2 URLs use the configured R2 public URL as the ownership check.
 */
export async function deleteFromAzure(blobUrl: string): Promise<void> {
  if (isR2PublicUrl(blobUrl)) {
    await deleteR2Object(blobUrl);
    return;
  }

  if (!isAzureBlobUrl(blobUrl) || !containerClient) {
    return;
  }

  try {
    const url = new URL(blobUrl);
    const blobName = url.pathname.split('/').slice(2).join('/');
    await containerClient.getBlockBlobClient(blobName).delete();
  } catch (error: any) {
    console.warn('Legacy Azure delete failed:', error.message);
  }
}

/**
 * Preserves access to legacy private Azure media. Public R2 URLs and all other
 * URLs are returned unchanged, so Azure credentials are never added to R2 URLs.
 */
export function getAzureSignedUrl(blobUrl: string): string {
  if (!blobUrl || !isAzureBlobUrl(blobUrl) || !SAS_TOKEN || blobUrl.includes('?')) {
    return blobUrl;
  }

  return `${blobUrl}?${SAS_TOKEN}`;
}

// Temporary aliases allow existing handlers to switch to R2 upload naming while
// still deleting both legacy Azure and new R2 records during the data migration.
export { uploadToR2 };
export const deleteFromR2 = deleteFromAzure;
