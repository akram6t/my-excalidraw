import { NextRequest, NextResponse } from 'next/server';
import { uploadToStorage, sceneStorageKey } from '@/lib/tigris';

/**
 * Upload whiteboard scene data to Tigris cloud storage.
 * Body: { boardId: string, data: object (elements, appState, files) }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { boardId, data } = body;

    if (!boardId || !data) {
      return NextResponse.json(
        { error: 'boardId and data are required' },
        { status: 400 }
      );
    }

    const key = sceneStorageKey(boardId);
    const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);

    const url = await uploadToStorage(key, jsonStr, 'application/json');

    return NextResponse.json({ success: true, url, key });
  } catch (error) {
    console.error('Failed to upload scene:', error);
    return NextResponse.json(
      { error: 'Failed to upload scene to cloud storage' },
      { status: 500 }
    );
  }
}
