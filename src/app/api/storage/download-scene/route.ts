import { NextRequest, NextResponse } from 'next/server';
import { downloadFromStorage, sceneStorageKey } from '@/lib/tigris';

/**
 * Download whiteboard scene data from Tigris cloud storage.
 * Query: ?boardId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');

    if (!boardId) {
      return NextResponse.json(
        { error: 'boardId is required' },
        { status: 400 }
      );
    }

    const key = sceneStorageKey(boardId);
    const data = await downloadFromStorage(key);

    if (!data) {
      return NextResponse.json(
        { error: 'Scene not found in cloud storage' },
        { status: 404 }
      );
    }

    try {
      const parsed = JSON.parse(data);
      return NextResponse.json({ success: true, data: parsed });
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse scene data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to download scene:', error);
    return NextResponse.json(
      { error: 'Failed to download scene from cloud storage' },
      { status: 500 }
    );
  }
}
