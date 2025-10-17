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
  contentType: string
): Promise<string> {
  const key = `suppliers/${Date.now()}-${filename}`;

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
  const actualKey = key.includes(process.env.R2_PUBLIC_URL!)
    ? key.replace(`${process.env.R2_PUBLIC_URL}/`, '')
    : key;

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
    const key = imageUrl.includes(process.env.R2_PUBLIC_URL!)
      ? imageUrl.replace(`${process.env.R2_PUBLIC_URL}/`, '')
      : imageUrl;

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
    const key = pdfUrl.includes(process.env.R2_PUBLIC_URL!)
      ? pdfUrl.replace(`${process.env.R2_PUBLIC_URL}/`, '')
      : pdfUrl;

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

