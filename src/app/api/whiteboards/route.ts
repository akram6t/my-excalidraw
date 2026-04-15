import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET whiteboard by ID
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

    return NextResponse.json(whiteboard);
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

    return NextResponse.json(whiteboard, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create whiteboard' },
      { status: 500 }
    );
  }
}

// PUT update a whiteboard
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

    const whiteboard = await db.whiteboard.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(data !== undefined && { data }),
      },
    });

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

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete whiteboard' },
      { status: 500 }
    );
  }
}
