import { NextRequest, NextResponse } from 'next/server';
import { uploadToStorage, fileStorageKey } from '@/lib/tigris';

/**
 * Upload a binary file (image, etc.) to Tigris cloud storage.
 * Body: FormData with fields:
 *   - boardId: string
 *   - fileId: string
 *   - mimeType: string
 *   - file: File/Blob
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const boardId = formData.get('boardId') as string;
    const fileId = formData.get('fileId') as string;
    const mimeType = formData.get('mimeType') as string;
    const file = formData.get('file') as File | null;

    if (!boardId || !fileId || !file) {
      return NextResponse.json(
        { error: 'boardId, fileId, and file are required' },
        { status: 400 }
      );
    }

    const key = fileStorageKey(boardId, fileId, mimeType);
    const buffer = Buffer.from(await file.arrayBuffer());

    const url = await uploadToStorage(key, buffer, mimeType || 'application/octet-stream');

    return NextResponse.json({ success: true, url, key });
  } catch (error) {
    console.error('Failed to upload file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file to cloud storage' },
      { status: 500 }
    );
  }
}
