import { ContainerClient } from '@azure/storage-blob';

// SAS URL provided by user
const AZURE_SAS_URL = process.env.AZURE_SAS_URL || "https://pakmon.blob.core.windows.net/pakmon?sp=racwdl&st=2026-01-05T08:42:31Z&se=2030-12-31T16:57:31Z&spr=https&sv=2024-11-04&sr=c&sig=VDn7ZB931YrJDYORMvPbyRUEBbgMlv%2BhdcyFxgiYg%2Bc%3D";

// Extract SAS token part (everything after the ?)
const SAS_TOKEN = AZURE_SAS_URL.includes('?') ? AZURE_SAS_URL.split('?')[1] : '';

let containerClient: ContainerClient | null = null;

try {
    containerClient = new ContainerClient(AZURE_SAS_URL);
} catch (error) {
    console.error('Failed to initialize Azure ContainerClient:', error);
}

/**
 * Uploads a file to Azure Blob Storage using the SAS URL
 */
export async function uploadToAzure(
    file: Buffer,
    filename: string,
    contentType: string,
    userId?: string,
    productId?: string
): Promise<string> {
    if (!containerClient) {
        throw new Error('Azure Storage Client not initialized. Check your SAS URL.');
    }

    // Build blob name with folders: suppliers/user_product_timestamp_filename
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const userPart = userId || 'unknown';
    const productPart = productId || 'new';
    const blobName = `suppliers/${userPart}_${productPart}_${Date.now()}_${sanitizedFilename}`;

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    try {
        await blockBlobClient.uploadData(file, {
            blobHTTPHeaders: { blobContentType: contentType }
        });

        // The URL property of the blockBlobClient includes the SAS token if initialized with one
        // We only want the base URL for storage in the DB
        return blockBlobClient.url.split('?')[0];
    } catch (error: any) {
        console.error('Azure Upload Error:', error.message);
        throw new Error(`Azure Upload Failed: ${error.message}`);
    }
}

/**
 * Deletes a file from Azure Blob Storage
 * Note: Requires 'd' (delete) permission in SAS token
 */
export async function deleteFromAzure(blobUrl: string): Promise<void> {
    if (!containerClient) return;

    try {
        // Extract blob name from URL
        const url = new URL(blobUrl);
        const pathParts = url.pathname.split('/');
        // pathname is /container/blobname...
        const blobName = pathParts.slice(2).join('/');

        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.delete();
    } catch (error: any) {
        console.warn('Azure Delete Failed (might be already deleted):', error.message);
    }
}

/**
 * Generates a "signed URL" by appending the SAS token to the base blob URL.
 * Since the user-provided SAS token is long-lived and contains full container permissions,
 * we can simply append it to any blob in the container.
 */
export function getAzureSignedUrl(blobUrl: string): string {
    if (!blobUrl) return '';
    if (!SAS_TOKEN) return blobUrl;

    // Avoid double appending
    if (blobUrl.includes('?')) {
        return blobUrl;
    }

    return `${blobUrl}?${SAS_TOKEN}`;
}
