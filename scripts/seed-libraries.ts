import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = process.env.DB_NAME || 'my-excalidraw';

const LIBRARY_DIR = path.join(process.cwd(), 'upload');

const LIBRARY_FILES = [
  'algorithms-and-data-structures-arrays-matrices-trees.excalidrawlib',
  'architecture-diagram-components.excalidrawlib',
  'awesome-icons.excalidrawlib',
  'basic-shapes.excalidrawlib',
  'bubbles.excalidrawlib',
  'cloud.excalidrawlib',
  'computers.excalidrawlib',
  'data-sources.excalidrawlib',
  'data-viz.excalidrawlib',
  'db-eng.excalidrawlib',
  'drwnio.excalidrawlib',
  'emojis.excalidrawlib',
  'gadgets.excalidrawlib',
  'it-logos.excalidrawlib',
  'logos.excalidrawlib',
  'mathematical-symbols.excalidrawlib',
  'post-it.excalidrawlib',
  'robots.excalidrawlib',
  'software-architecture.excalidrawlib',
  'some-handdrawn-signs.excalidrawlib',
  'stick-figures.excalidrawlib',
  'stick-people.excalidrawlib',
  'webpage-frames.excalidrawlib',
];

const LibrarySchema = new mongoose.Schema(
  { name: { type: String, required: true, unique: true }, data: { type: String, required: true } },
  { timestamps: true }
);

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
  console.log('Connected!\n');

  const Library = mongoose.models.Library || mongoose.model('Library', LibrarySchema);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const filename of LIBRARY_FILES) {
    const filePath = path.join(LIBRARY_DIR, filename);
    const name = filename.replace('.excalidrawlib', '');

    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠ Skipped ${filename} (file not found)`);
      skipped++;
      continue;
    }

    const data = fs.readFileSync(filePath, 'utf8');

    try {
      const parsed = JSON.parse(data);
      const hasLibrary = parsed.library && Array.isArray(parsed.library);
      const hasLibraryItems = parsed.libraryItems && Array.isArray(parsed.libraryItems);
      if (!hasLibrary && !hasLibraryItems) {
        console.log(`  ⚠ Skipped ${filename} (invalid library format)`);
        skipped++;
        continue;
      }
    } catch {
      console.log(`  ⚠ Skipped ${filename} (invalid JSON)`);
      skipped++;
      continue;
    }

    const existing = await Library.findOne({ name }).lean();
    if (existing) {
      await Library.updateOne({ name }, { data });
      updated++;
      const sizeKB = Math.round(data.length / 1024);
      console.log(`  ↻ ${name} (${sizeKB}KB) — updated`);
    } else {
      await Library.create({ name, data });
      created++;
      const sizeKB = Math.round(data.length / 1024);
      console.log(`  ✓ ${name} (${sizeKB}KB) — created`);
    }
  }

  console.log(`\nDone! ${created} created, ${updated} updated, ${skipped} skipped.`);

  const total = await Library.countDocuments();
  console.log(`Total libraries in DB: ${total}`);

  await mongoose.disconnect();
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  });
