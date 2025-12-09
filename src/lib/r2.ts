import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Use R2 token for authentication (not AWS S3 credentials)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  // Add R2-specific configuration
  forcePathStyle: true,
});

export async function uploadToR2(
  file: Buffer,
  filename: string,
  contentType: string,
  userId?: string,
  productId?: string
): Promise<string> {
  // Build key with userId_productId_timestamp_filename format
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const userPart = userId || 'unknown';
  const productPart = productId || 'new';
  const key = `suppliers/${userPart}_${productPart}_${Date.now()}_${sanitizedFilename}`;

  try {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: "chatbot-flavi", // Using the correct bucket name directly
        Key: key,
        Body: file,
        ContentType: contentType,
      })
    );

    // Return public URL
    return `${process.env.R2_PUBLIC_URL}/${key}`;
  } catch (error: any) {
    console.error('R2 Upload Error Details:', {
      code: error.Code || error.name,
      message: error.message,
      bucket: "chatbot-flavi",
      endpoint: process.env.R2_ENDPOINT,
    });

    if (error.Code === 'AccessDenied' || error.name === 'AccessDenied') {
      throw new Error(
        'Access denied to R2 bucket. Please check: ' +
        '1) Your R2 API token has "Object Read & Write" permissions, ' +
        '2) The token is assigned to the correct bucket, ' +
        '3) The bucket name is correct (current: "chatbot-flavi"). ' +
        '4) Make sure you\'re using the right bucket name (chatbot-flavi vs chat-flavi). ' +
        'See R2_CONFIGURATION_FIX.md for detailed instructions.'
      );
    }

    if (error.Code === 'NoSuchBucket' || error.name === 'NoSuchBucket') {
      throw new Error(
        `R2 bucket "chatbot-flavi" does not exist. ` +
        'Please create the bucket in Cloudflare Dashboard or update R2_BUCKET_NAME in your .env file.'
      );
    }

    if (error.Code === 'InvalidArgument' || error.name === 'InvalidArgument') {
      throw new Error(
        'Invalid R2 credentials. Please verify your R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in .env file. ' +
        'Access keys should be generated from Cloudflare Dashboard → R2 → Manage R2 API Tokens.'
      );
    }

    throw error;
  }
}

export async function deleteFromR2(key: string): Promise<void> {
  // Extract key from full URL if needed
  // Handles both custom domain and old R2 dev URLs
  let actualKey = key;

  if (key.startsWith('http://') || key.startsWith('https://')) {
    // It's a full URL, extract the path
    try {
      const url = new URL(key);
      // Remove leading slash from pathname
      actualKey = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
    } catch {
      // If URL parsing fails, try simple string replacement
      const publicUrl = process.env.R2_PUBLIC_URL;
      if (publicUrl && key.includes(publicUrl)) {
        actualKey = key.replace(`${publicUrl}/`, '');
      } else if (key.includes('.r2.dev')) {
        // Handle old R2 dev URLs
        const match = key.match(/\.r2\.dev\/(.+)$/);
        if (match) {
          actualKey = match[1];
        }
      }
    }
  }

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: "chatbot-flavi", // Using the correct bucket name directly
      Key: actualKey,
    })
  );
}

export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: "chatbot-flavi", // Using the correct bucket name directly
    Key: key,
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
}

// Generate signed URLs for images and PDFs to display them
export async function getImageUrl(imageUrl: string, expiresIn: number = 3600): Promise<string> {
  try {
    // Extract key from full URL if it's a full URL
    let key = imageUrl;

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      try {
        const url = new URL(imageUrl);
        key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
      } catch {
        // Fallback to simple replacement
        const publicUrl = process.env.R2_PUBLIC_URL;
        if (publicUrl && imageUrl.includes(publicUrl)) {
          key = imageUrl.replace(`${publicUrl}/`, '');
        } else if (imageUrl.includes('.r2.dev')) {
          const match = imageUrl.match(/\.r2\.dev\/(.+)$/);
          if (match) key = match[1];
        }
      }
    }

    return await getPresignedUrl(key, expiresIn);
  } catch (error) {
    console.error('Error generating image URL:', error);
    // Return original URL as fallback
    return imageUrl;
  }
}

export async function getPdfUrl(pdfUrl: string, expiresIn: number = 3600): Promise<string> {
  try {
    // Extract key from full URL if it's a full URL
    let key = pdfUrl;

    if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
      try {
        const url = new URL(pdfUrl);
        key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
      } catch {
        // Fallback to simple replacement
        const publicUrl = process.env.R2_PUBLIC_URL;
        if (publicUrl && pdfUrl.includes(publicUrl)) {
          key = pdfUrl.replace(`${publicUrl}/`, '');
        } else if (pdfUrl.includes('.r2.dev')) {
          const match = pdfUrl.match(/\.r2\.dev\/(.+)$/);
          if (match) key = match[1];
        }
      }
    }

    return await getPresignedUrl(key, expiresIn);
  } catch (error) {
    console.error('Error generating PDF URL:', error);
    // Return original URL as fallback
    return pdfUrl;
  }
}

// Generate multiple signed URLs for arrays of images/PDFs
export async function getImageUrls(imageUrls: string[], expiresIn: number = 3600): Promise<string[]> {
  try {
    const signedUrls = await Promise.all(
      imageUrls.map(url => getImageUrl(url, expiresIn))
    );
    return signedUrls;
  } catch (error) {
    console.error('Error generating image URLs:', error);
    return imageUrls; // Return original URLs as fallback
  }
}

export async function getPdfUrls(pdfUrls: string[], expiresIn: number = 3600): Promise<string[]> {
  try {
    const signedUrls = await Promise.all(
      pdfUrls.map(url => getPdfUrl(url, expiresIn))
    );
    return signedUrls;
  } catch (error) {
    console.error('Error generating PDF URLs:', error);
    return pdfUrls; // Return original URLs as fallback
  }
}

export { r2Client };

