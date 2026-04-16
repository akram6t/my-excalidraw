import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: process.env.TIGRIS_STORAGE_ENDPOINT || 'https://t3.storage.dev',
  region: 'auto',
  credentials: {
    accessKeyId: process.env.TIGRIS_STORAGE_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.TIGRIS_STORAGE_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.TIGRIS_STORAGE_BUCKET || 'my-excalidraw';
const PUBLIC_BASE_URL = process.env.TIGRIS_PUBLIC_URL || 'https://my-excalidraw.t3.tigrisfiles.io';

/**
 * Upload data (string/buffer) to Tigris storage
 */
export async function uploadToStorage(key: string, data: string | Buffer, contentType?: string): Promise<string> {
  const isBuffer = Buffer.isBuffer(data);
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: data,
    ContentType: contentType || (typeof data === 'string' ? 'application/json' : 'application/octet-stream'),
  });

  await s3Client.send(command);

  // Return the public URL
  return `${PUBLIC_BASE_URL}/${key}`;
}

/**
 * Download data from Tigris storage as string
 */
export async function downloadFromStorage(key: string): Promise<string | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    const body = response.Body;

    if (!body) return null;

    const bytes = await body.transformToByteArray();
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
  } catch (error) {
    console.error(`Failed to download from storage [${key}]:`, error);
    return null;
  }
}

/**
 * Download data from Tigris storage as Buffer
 */
export async function downloadBufferFromStorage(key: string): Promise<Buffer | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    const body = response.Body;

    if (!body) return null;

    const bytes = await body.transformToByteArray();
    return Buffer.from(bytes);
  } catch (error) {
    console.error(`Failed to download buffer from storage [${key}]:`, error);
    return null;
  }
}

/**
 * Delete an object from Tigris storage
 */
export async function deleteFromStorage(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
  } catch (error) {
    console.error(`Failed to delete from storage [${key}]:`, error);
  }
}

/**
 * Build storage key for a whiteboard scene
 */
export function sceneStorageKey(boardId: string): string {
  return `scenes/${boardId}/scene.json`;
}

/**
 * Build storage key for a binary file
 */
export function fileStorageKey(boardId: string, fileId: string, mimeType?: string): string {
  const ext = mimeTypeToExt(mimeType);
  return `files/${boardId}/${fileId}${ext}`;
}

function mimeTypeToExt(mime?: string): string {
  if (!mime) return '';
  const map: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
    'image/webp': '.webp',
    'image/bmp': '.bmp',
    'image/x-excalidraw': '.excalidraw',
    'application/json': '.json',
  };
  return map[mime] || '';
}

export { BUCKET_NAME, PUBLIC_BASE_URL };
