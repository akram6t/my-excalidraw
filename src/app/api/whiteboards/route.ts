import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Whiteboard, Project } from '@/lib/models';
import { getAuthUserId } from '@/lib/auth-helper';

// Helper: verify that a project belongs to the authenticated user
async function verifyProjectOwnership(
  projectId: string,
  userId: string
): Promise<boolean> {
  const project = await Project.findOne({ _id: projectId, userId }).lean();
  return !!project;
}

// GET whiteboard by ID (verify ownership through its project)
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const whiteboard = await Whiteboard.findById(id).lean();
    if (!whiteboard) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Verify ownership: the project must belong to this user
    const isOwner = await verifyProjectOwnership(whiteboard.projectId, userId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      id: whiteboard._id.toString(),
      title: whiteboard.title,
      data: parsedData,
    });
  } catch (error) {
    console.error('GET whiteboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST create whiteboard (verify project ownership)
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { title, projectId } = body;

    if (!title || !projectId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Verify the project belongs to this user
    const isOwner = await verifyProjectOwnership(projectId, userId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the max order for this project
    const maxBoard = await Whiteboard.findOne({ projectId })
      .sort({ order: -1 })
      .lean();

    const whiteboard = await Whiteboard.create({
      title: title.trim(),
      projectId,
      order: (maxBoard?.order ?? -1) + 1,
    });

    return NextResponse.json(
      {
        id: whiteboard._id.toString(),
        title: whiteboard.title,
        data: whiteboard.data,
        order: whiteboard.order,
        projectId: whiteboard.projectId,
        createdAt: whiteboard.createdAt.toISOString(),
        updatedAt: whiteboard.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST whiteboard error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}

// PUT update whiteboard (verify ownership through its project)
export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { id, title, data } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Find the whiteboard first to get its projectId
    const existing = await Whiteboard.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: 'Whiteboard not found' }, { status: 404 });
    }

    // Verify ownership
    const isOwner = await verifyProjectOwnership(existing.projectId, userId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (data !== undefined) {
      // data arrives as a JSON string from the frontend
      updateData.data = typeof data === 'string' ? data : JSON.stringify(data);
    }

    const whiteboard = await Whiteboard.findByIdAndUpdate(id, updateData, { new: true }).lean();

    return NextResponse.json({
      id: whiteboard!._id.toString(),
      title: whiteboard!.title,
      data: whiteboard!.data,
      order: whiteboard!.order,
      projectId: whiteboard!.projectId,
      createdAt: whiteboard!.createdAt.toISOString(),
      updatedAt: whiteboard!.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('PUT whiteboard error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE whiteboard (verify ownership through its project)
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Find the whiteboard first to verify ownership
    const existing = await Whiteboard.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: 'Whiteboard not found' }, { status: 404 });
    }

    const isOwner = await verifyProjectOwnership(existing.projectId, userId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await Whiteboard.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE whiteboard error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
