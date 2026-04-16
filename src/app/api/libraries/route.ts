import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

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
    const libraries = await db.library.findMany({
      orderBy: { name: 'asc' },
      select: { name: true, data: true },
    });

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
