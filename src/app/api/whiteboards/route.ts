import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { uploadToStorage, downloadFromStorage, sceneStorageKey } from '@/lib/tigris';

// GET whiteboard by ID — fetches scene from cloud storage (fallback to DB)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const whiteboard = await db.whiteboard.findUnique({
      where: { id },
    });

    if (!whiteboard) {
      return NextResponse.json(
        { error: 'Whiteboard not found' },
        { status: 404 }
      );
    }

    // Try to get scene data from cloud storage first
    const cloudData = await downloadFromStorage(sceneStorageKey(id));
    const sceneData = cloudData || whiteboard.data;

    // Parse the scene data
    let parsedData = null;
    if (sceneData) {
      try {
        parsedData = JSON.parse(sceneData);
      } catch {
        parsedData = null;
      }
    }

    return NextResponse.json({
      ...whiteboard,
      data: parsedData,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch whiteboard' },
      { status: 500 }
    );
  }
}

// POST create a new whiteboard
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, projectId } = body;

    if (!title || !projectId) {
      return NextResponse.json(
        { error: 'Title and projectId are required' },
        { status: 400 }
      );
    }

    // Get max order for this project
    const maxOrder = await db.whiteboard.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const whiteboard = await db.whiteboard.create({
      data: {
        title: title.trim(),
        projectId,
        order: (maxOrder?.order ?? -1) + 1,
      },
    });

    // Try to initialize an empty scene in cloud storage (non-blocking)
    const emptyScene = JSON.stringify({
      type: 'excalidraw',
      version: 2,
      source: 'whiteboard-studio',
      elements: [],
      appState: {},
      files: {},
    });
    try {
      await uploadToStorage(sceneStorageKey(whiteboard.id), emptyScene, 'application/json');
    } catch {
      // Cloud storage optional — falls back to local DB
    }

    return NextResponse.json(whiteboard, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create whiteboard' },
      { status: 500 }
    );
  }
}

// PUT update a whiteboard — saves scene data to cloud storage + title to DB
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, data } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Update metadata in DB
    const whiteboard = await db.whiteboard.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
      },
    });

    // Save scene data to cloud storage
    if (data !== undefined) {
      const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
      try {
        await uploadToStorage(sceneStorageKey(id), jsonStr, 'application/json');
      } catch (storageError) {
        console.error('Cloud storage save failed, keeping in DB fallback:', storageError);
        // Fallback: also save in DB
        await db.whiteboard.update({
          where: { id },
          data: { data: jsonStr },
        });
      }
    }

    return NextResponse.json(whiteboard);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update whiteboard' },
      { status: 500 }
    );
  }
}

// DELETE a whiteboard
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    await db.whiteboard.delete({
      where: { id },
    });

    // Note: We keep the cloud storage data as-is for potential recovery
    // In production, you'd also call deleteFromStorage(sceneStorageKey(id))

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete whiteboard' },
      { status: 500 }
    );
  }
}
