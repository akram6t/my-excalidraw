import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET whiteboard by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const whiteboard = await db.whiteboard.findUnique({ where: { id } });

    if (!whiteboard) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Parse stored JSON string into an object for the frontend
    let parsedData = null;
    if (whiteboard.data && whiteboard.data !== '{}') {
      try {
        parsedData = JSON.parse(whiteboard.data);
      } catch {
        parsedData = null;
      }
    }

    return NextResponse.json({
      id: whiteboard.id,
      title: whiteboard.title,
      data: parsedData,
    });
  } catch (error) {
    console.error('GET whiteboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST create whiteboard
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, projectId } = body;

    if (!title || !projectId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

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

    return NextResponse.json(whiteboard, { status: 201 });
  } catch (error) {
    console.error('POST whiteboard error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}

// PUT update whiteboard (title and/or scene data)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, data } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Build update payload
    const updateData: Record<string, string> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (data !== undefined) {
      // data arrives as a JSON string from the frontend
      updateData.data = typeof data === 'string' ? data : JSON.stringify(data);
    }

    const whiteboard = await db.whiteboard.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(whiteboard);
  } catch (error) {
    console.error('PUT whiteboard error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE whiteboard
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.whiteboard.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE whiteboard error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
