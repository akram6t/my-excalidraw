import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Library } from '@/lib/models';

/**
 * GET /api/libraries
 * Returns all libraries as Excalidraw LibraryItems format.
 *
 * Handles two .excalidrawlib formats:
 * - "library": ExcalidrawElement[][] — each inner array is one library item group
 * - "libraryItems": already formatted as LibraryItem[]
 */
export async function GET() {
  try {
    await connectDB();

    const libraries = await Library.find().sort({ name: 1 }).lean();

    // Convert all libraries into a flat array of LibraryItems
    const allItems: Array<{
      id: string;
      status: string;
      elements: unknown[];
      name: string;
    }> = [];

    for (const lib of libraries) {
      const parsed = JSON.parse(lib.data);
      const source = lib.name;

      if (parsed.library && Array.isArray(parsed.library)) {
        // Older format: library is ExcalidrawElement[][]
        for (let i = 0; i < parsed.library.length; i++) {
          const group = parsed.library[i];
          if (!Array.isArray(group) || group.length === 0) continue;
          allItems.push({
            id: `${source}__${i}`,
            status: 'loaded',
            elements: group,
            name: source,
          });
        }
      }

      if (parsed.libraryItems && Array.isArray(parsed.libraryItems)) {
        // Newer format: already LibraryItem[]
        for (const item of parsed.libraryItems) {
          if (item.elements && Array.isArray(item.elements)) {
            allItems.push({
              id: item.id || `${source}__${Math.random().toString(36).slice(2, 8)}`,
              status: item.status || 'loaded',
              elements: item.elements,
              name: item.name || source,
            });
          }
        }
      }
    }

    return NextResponse.json({ items: allItems, total: allItems.length });
  } catch (error) {
    console.error('GET /api/libraries error:', error);
    return NextResponse.json({ error: 'Failed to load libraries' }, { status: 500 });
  }
}

/**
 * POST /api/libraries
 * Create or update a library.
 * Body: { name: string, data: string (JSON of .excalidrawlib file) }
 */
export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, data } = body;

    if (!name || !data) {
      return NextResponse.json(
        { error: 'name and data are required' },
        { status: 400 }
      );
    }

    const existing = await Library.findOne({ name }).lean();

    if (existing) {
      await Library.updateOne({ name }, { data });
      return NextResponse.json({ success: true, updated: true, name });
    }

    await Library.create({ name, data });
    return NextResponse.json({ success: true, created: true, name }, { status: 201 });
  } catch (error) {
    console.error('POST /api/libraries error:', error);
    return NextResponse.json({ error: 'Failed to save library' }, { status: 500 });
  }
}

/**
 * DELETE /api/libraries
 * Delete a library by name.
 * Query: ?name=xxx
 */
export async function DELETE(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    await Library.deleteOne({ name });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/libraries error:', error);
    return NextResponse.json({ error: 'Failed to delete library' }, { status: 500 });
  }
}
