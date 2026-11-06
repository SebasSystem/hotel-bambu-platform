import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { DEMO_MARKER } from '../seeds/demo-data.js';
import { ImageValidationError, processImage } from '../modules/media/image-pipeline.js';
import {
  assignRoomPhotos,
  manifestSchema,
  planImport,
  type ImportCandidate,
} from '../modules/media/import-manifest.js';
import { storeProcessedImage } from '../modules/media/media-storage.js';
import { S3ObjectStorage, s3EnvSchema } from '../modules/media/object-storage.js';
import { createScriptPrisma, loadLocalEnv, log, runScript } from './lib/script-runtime.js';

/**
 * media:import (requirement 15.5): reads assets-source/photos + docs/assets/assets-manifest.json,
 * skips `discard` entries and exact duplicates (SHA-256), processes each photo (real type check,
 * auto-orient, metadata stripped, AVIF/WebP variants, placeholder), uploads to S3 under random
 * keys and creates READY MediaAsset rows with the manifest alt text.
 *
 * Linking: room photos are spread over the room types that have [DEMO] rooms (least-loaded first,
 * same kind first) and draft types that receive a cover are published; when no demo rooms exist
 * (e.g. an approved one-time production import) room photos go to the gallery instead. Every other photo becomes a GalleryItem,
 * published only when the manifest marks it "ok" without identifiable people.
 *
 * Re-runnable: photos whose checksum already exists are skipped.
 * Overrides: MEDIA_SOURCE_DIR, MEDIA_MANIFEST.
 */

const REPO_ROOT = path.resolve(import.meta.dirname, '../../../..');

interface ImportedPhoto {
  candidate: ImportCandidate;
  mediaAssetId: string;
}

await runScript('media:import', async () => {
  loadLocalEnv();
  const s3Env = s3EnvSchema.parse(process.env);
  const sourceDir = process.env['MEDIA_SOURCE_DIR'] ?? path.join(REPO_ROOT, 'assets-source/photos');
  const manifestPath =
    process.env['MEDIA_MANIFEST'] ?? path.join(REPO_ROOT, 'docs/assets/assets-manifest.json');

  const manifest = manifestSchema.parse(JSON.parse(await readFile(manifestPath, 'utf8')));
  const candidates = planImport(manifest);
  log(`media:import: ${manifest.length} manifest entries, ${candidates.length} after discards`);

  const prisma = createScriptPrisma();
  const storage = new S3ObjectStorage(s3Env);
  const seen = new Set<string>();
  const imported: ImportedPhoto[] = [];
  const skipped = { duplicate: 0, existing: 0, missing: 0, invalid: 0 };

  try {
    for (const candidate of candidates) {
      let original: Buffer;
      try {
        original = await readFile(path.join(sourceDir, candidate.file));
      } catch {
        skipped.missing += 1;
        console.warn(`  skip (missing file): ${candidate.file}`);
        continue;
      }

      let processed;
      try {
        processed = await processImage(original);
      } catch (error) {
        if (!(error instanceof ImageValidationError)) throw error;
        skipped.invalid += 1;
        console.warn(`  skip (invalid image): ${candidate.file}: ${error.message}`);
        continue;
      }

      if (seen.has(processed.checksum)) {
        skipped.duplicate += 1;
        continue;
      }
      seen.add(processed.checksum);
      const existing = await prisma.mediaAsset.findUnique({
        where: { checksum: processed.checksum },
        select: { id: true },
      });
      if (existing) {
        skipped.existing += 1;
        continue;
      }

      const stored = await storeProcessedImage(storage, processed);
      const asset = await prisma.mediaAsset.create({
        data: {
          storageKey: stored.storageKey,
          kind: 'IMAGE',
          mimeType: processed.mimeType,
          checksum: processed.checksum,
          sizeBytes: processed.sizeBytes,
          width: processed.width,
          height: processed.height,
          variants: stored.variants as object[],
          blurDataUrl: processed.blurDataUrl,
          dominantColor: processed.dominantColor,
          altText: candidate.altText,
          status: 'READY',
        },
        select: { id: true },
      });
      imported.push({ candidate, mediaAssetId: asset.id });
      log(
        `  imported ${candidate.file} -> ${stored.storageKey} (${stored.variants.length} variants)`,
      );
    }

    const demoTypes = await prisma.roomType.findMany({
      where: { rooms: { some: { name: { startsWith: DEMO_MARKER } } } },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, type: true },
    });
    const roomPhotos = demoTypes.length > 0 ? imported.filter((p) => p.candidate.isRoomPhoto) : [];
    const galleryPhotos = imported.filter((p) => !roomPhotos.includes(p));

    await prisma.$transaction(async (tx) => {
      const nextOrder = new Map<string, number>();
      for (const { photo, room: type } of assignRoomPhotos(
        roomPhotos.map((p) => ({ ...p, roomType: p.candidate.roomType })),
        demoTypes,
      )) {
        const order =
          nextOrder.get(type.id) ??
          (await tx.roomTypeImage.count({ where: { roomTypeId: type.id } }));
        nextOrder.set(type.id, order + 1);
        const hasCover = await tx.roomTypeImage.count({
          where: { roomTypeId: type.id, isCover: true },
        });
        await tx.roomTypeImage.create({
          data: {
            roomTypeId: type.id,
            mediaAssetId: photo.mediaAssetId,
            sortOrder: order,
            isCover: hasCover === 0,
          },
        });
      }

      const galleryStart = await tx.galleryItem.count();
      await tx.galleryItem.createMany({
        data: galleryPhotos.map((p, index) => ({
          mediaAssetId: p.mediaAssetId,
          category: p.candidate.galleryCategory,
          sortOrder: galleryStart + index,
          published: p.candidate.publishable,
        })),
      });

      // Demo room types meet the publication rule once they have a cover with alt text; their
      // demo rooms are published with them.
      const ready = await tx.roomType.findMany({
        where: {
          id: { in: demoTypes.map((t) => t.id) },
          status: 'DRAFT',
          images: { some: { isCover: true, mediaAsset: { altText: { not: null } } } },
        },
        select: { id: true },
      });
      const readyIds = ready.map((t) => t.id);
      await tx.roomType.updateMany({
        where: { id: { in: readyIds } },
        data: { status: 'PUBLISHED' },
      });
      await tx.room.updateMany({
        where: { roomTypeId: { in: readyIds }, name: { startsWith: DEMO_MARKER }, status: 'DRAFT' },
        data: { status: 'PUBLISHED' },
      });
    });

    log(
      `media:import done: ${JSON.stringify({
        imported: imported.length,
        linkedToRooms: roomPhotos.length,
        gallery: galleryPhotos.length,
        skipped,
      })}`,
    );
  } finally {
    storage.destroy();
    await prisma.$disconnect();
  }
});
