import { REVALIDATE_SECRET_HEADER } from '@hotel-bambu/shared';
import { MEDIA_CACHE_TAGS, storedVariants } from '../modules/media/media-url.js';
import { S3ObjectStorage, s3EnvSchema } from '../modules/media/object-storage.js';
import {
  planMissingVariants,
  regenerateMissingVariants,
} from '../modules/media/regenerate-variants.js';
import { createScriptPrisma, loadLocalEnv, log, runScript } from './lib/script-runtime.js';

/**
 * media:variants: adds the variant widths that existing media lack (after VARIANT_WIDTHS changes),
 * derived from each asset's widest stored variant. Idempotent: assets that already have every
 * planned variant are skipped, so it is safe to re-run. Existing objects are never rewritten.
 *
 *   pnpm --filter @hotel-bambu/api media:variants            # render, upload, update the rows
 *   pnpm --filter @hotel-bambu/api media:variants --dry-run  # only list what is missing
 *
 * Needs the S3 variables and DATABASE_URL. When WEB_INTERNAL_URL + REVALIDATE_SECRET are set, the
 * public pages that show media are revalidated at the end so they list the new srcset entries.
 */

async function revalidateWeb(): Promise<string> {
  const base = process.env['WEB_INTERNAL_URL'];
  if (!base) return 'skipped (WEB_INTERNAL_URL unset; pages refresh on their next revalidation)';
  try {
    const response = await fetch(`${base.replace(/\/+$/, '')}/api/revalidate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [REVALIDATE_SECRET_HEADER]: process.env['REVALIDATE_SECRET'] ?? '',
      },
      body: JSON.stringify({ tags: MEDIA_CACHE_TAGS }),
      signal: AbortSignal.timeout(5_000),
    });
    return response.ok ? `ok (${MEDIA_CACHE_TAGS.join(', ')})` : `answered ${response.status}`;
  } catch (error) {
    return `failed: ${error instanceof Error ? error.message : String(error)}`;
  }
}

await runScript('media:variants', async () => {
  loadLocalEnv();
  const dryRun = process.argv.includes('--dry-run');
  const s3Env = s3EnvSchema.parse(process.env);
  const prisma = createScriptPrisma();
  const storage = new S3ObjectStorage(s3Env);
  const totals = { assets: 0, complete: 0, updated: 0, variantsAdded: 0, failed: 0 };

  try {
    const assets = await prisma.mediaAsset.findMany({
      where: { kind: 'IMAGE', status: 'READY' },
      orderBy: { createdAt: 'asc' },
      select: { id: true, storageKey: true, width: true, variants: true },
    });
    totals.assets = assets.length;

    for (const asset of assets) {
      const missing = planMissingVariants(asset.width, storedVariants(asset.variants));
      if (missing.length === 0) {
        totals.complete += 1;
        continue;
      }
      const label = missing.map((t) => `${t.width}.${t.format}`).join(' ');
      if (dryRun) {
        log(`  ${asset.id}: missing ${label}`);
        continue;
      }
      try {
        const result = await regenerateMissingVariants(asset, storage);
        await prisma.mediaAsset.update({
          where: { id: asset.id },
          data: { variants: result.variants as object[] },
        });
        totals.updated += 1;
        totals.variantsAdded += result.added.length;
        log(`  ${asset.id}: added ${label}`);
      } catch (error) {
        // One broken asset (e.g. a missing object) must not stop the others.
        totals.failed += 1;
        console.warn(
          `  ${asset.id}: failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    log(`media:variants ${dryRun ? '(dry run) ' : ''}done: ${JSON.stringify(totals)}`);
    if (!dryRun && totals.updated > 0) log(`revalidation: ${await revalidateWeb()}`);
    if (totals.failed > 0) process.exitCode = 1;
  } finally {
    storage.destroy();
    await prisma.$disconnect();
  }
});
