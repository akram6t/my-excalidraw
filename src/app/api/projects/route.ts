import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Project, Whiteboard } from '@/lib/models';
import { getAuthUserId } from '@/lib/auth-helper';

// GET all projects for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const projects = await Project.find({ userId }).sort({ updatedAt: -1 }).lean();

    // Fetch whiteboards for each project
    const projectsWithBoards = await Promise.all(
      projects.map(async (project) => {
        const whiteboards = await Whiteboard.find({ projectId: project._id.toString() })
          .sort({ order: 1 })
          .lean();

        return {
          id: project._id.toString(),
          name: project.name,
          description: project.description,
          color: project.color,
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
          whiteboards: whiteboards.map((w) => ({
            id: w._id.toString(),
            title: w.title,
            data: w.data,
            order: w.order,
            projectId: w.projectId,
            createdAt: w.createdAt.toISOString(),
            updatedAt: w.updatedAt.toISOString(),
          })),
        };
      })
    );

    return NextResponse.json(projectsWithBoards);
  } catch (error) {
    console.error('GET /api/projects error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST create a new project for the authenticated user
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { name, description, color } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const project = await Project.create({
      userId,
      name: name.trim(),
      description: description?.trim() || null,
      color: color || '#6366f1',
    });

    // Create default whiteboard
    const whiteboard = await Whiteboard.create({
      title: 'Untitled',
      order: 0,
      projectId: project._id.toString(),
    });

    return NextResponse.json(
      {
        id: project._id.toString(),
        name: project.name,
        description: project.description,
        color: project.color,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        whiteboards: [
          {
            id: whiteboard._id.toString(),
            title: whiteboard.title,
            data: whiteboard.data,
            order: whiteboard.order,
            projectId: whiteboard.projectId,
            createdAt: whiteboard.createdAt.toISOString(),
            updatedAt: whiteboard.updatedAt.toISOString(),
          },
        ],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/projects error:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

// PUT update a project (only if owned by the authenticated user)
export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { id, name, description, color } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (color !== undefined) updateData.color = color;

    // Only update if the project belongs to the authenticated user
    const project = await Project.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true }
    ).lean();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const whiteboards = await Whiteboard.find({ projectId: id })
      .sort({ order: 1 })
      .lean();

    return NextResponse.json({
      id: project._id.toString(),
      name: project.name,
      description: project.description,
      color: project.color,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      whiteboards: whiteboards.map((w) => ({
        id: w._id.toString(),
        title: w.title,
        data: w.data,
        order: w.order,
        projectId: w.projectId,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('PUT /api/projects error:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE a project (only if owned by the authenticated user)
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
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Only delete if the project belongs to the authenticated user
    const project = await Project.findOneAndDelete({ _id: id, userId }).lean();
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Delete all whiteboards belonging to this project
    await Whiteboard.deleteMany({ projectId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/projects error:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
