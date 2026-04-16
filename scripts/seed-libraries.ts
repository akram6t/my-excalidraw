import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const LIBRARY_DIR = path.join(process.cwd(), 'upload');

const LIBRARY_FILES = [
  'post-it.excalidrawlib',
  'db-eng.excalidrawlib',
  'algorithms-and-data-structures-arrays-matrices-trees.excalidrawlib',
  'cloud.excalidrawlib',
  'awesome-icons.excalidrawlib',
  'data-viz.excalidrawlib',
  'stick-figures.excalidrawlib',
  'drwnio.excalidrawlib',
  'architecture-diagram-components.excalidrawlib',
  'software-architecture.excalidrawlib',
];

async function seed() {
  console.log('Seeding libraries...\n');

  for (const filename of LIBRARY_FILES) {
    const filePath = path.join(LIBRARY_DIR, filename);
    const name = filename.replace('.excalidrawlib', '');

    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠ Skipped ${filename} (file not found)`);
      continue;
    }

    const data = fs.readFileSync(filePath, 'utf8');

    try {
      const parsed = JSON.parse(data);
      // Accept both "library" (older) and "libraryItems" (newer) format
      const hasLibrary = parsed.library && Array.isArray(parsed.library);
      const hasLibraryItems = parsed.libraryItems && Array.isArray(parsed.libraryItems);
      if (!hasLibrary && !hasLibraryItems) {
        console.log(`  ⚠ Skipped ${filename} (invalid library format)`);
        continue;
      }
    } catch {
      console.log(`  ⚠ Skipped ${filename} (invalid JSON)`);
      continue;
    }

    await prisma.library.upsert({
      where: { name },
      update: { data },
      create: { name, data },
    });

    const sizeKB = Math.round(data.length / 1024);
    console.log(`  ✓ ${name} (${sizeKB}KB, ${filename})`);
  }

  console.log('\nDone!');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
