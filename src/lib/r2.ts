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
        Bucket: process.env.R2_BUCKET_NAME!,
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
      bucket: process.env.R2_BUCKET_NAME,
      endpoint: process.env.R2_ENDPOINT,
    });

    if (error.Code === 'AccessDenied' || error.name === 'AccessDenied') {
      throw new Error(
        'Access denied to R2 bucket. Please check: ' +
        '1) Your R2 API token has "Object Read & Write" permissions, ' +
        '2) The token is assigned to the correct bucket, ' +
        '3) The bucket name is correct (current: "' + process.env.R2_BUCKET_NAME + '"). ' +
        '4) Make sure you\'re using the right bucket name (chatbot-flavi vs chat-flavi). ' +
        'See R2_CONFIGURATION_FIX.md for detailed instructions.'
      );
    }

    if (error.Code === 'NoSuchBucket' || error.name === 'NoSuchBucket') {
      throw new Error(
        `R2 bucket "${process.env.R2_BUCKET_NAME}" does not exist. ` +
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
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: actualKey,
    })
  );
}

export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
}

export { r2Client };

