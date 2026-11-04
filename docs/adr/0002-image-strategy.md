# 0002 — Image strategy: sharp at upload + S3-compatible storage (option A)

- Status: Accepted
- Date: 2026-11-04

## Context

Req. 15.3–15.4 require EXIF/GPS stripping, orientation fix, responsive WebP/AVIF variants and a placeholder, and ask to choose between (A) variants generated at upload with `sharp` and served from S3/CDN, or (B) an on-the-fly transformation provider. The deployment target is a self-managed VPS behind Cloudflare; the hotel's source photos are 960–1280 px phone images (see `docs/assets/photo-inventory.md`).

## Decision

Option **A**:

- `apps/api` `media` module validates the real file type (magic bytes), then `sharp` auto-rotates, strips all metadata, and writes variants at **640, 960, 1280, 1920** px wide (never upscaling beyond the source width) in **AVIF + WebP**, plus a tiny blurred placeholder (data URI) and dominant colour stored on `MediaAsset`.
- Objects stored in S3-compatible storage under random keys (MinIO in dev; MinIO or any S3 provider in prod), served via a public bucket path behind Cloudflare cache.
- `next/image` uses a **custom loader** that picks the precomputed variant; Next.js built-in optimization is not used for media.
- The same pipeline runs for `media:import` from `assets-source/` + `assets-manifest.json`.

## Consequences

- Predictable cost, no third-party vendor, full privacy control over guest-facing media.
- Upload is slower (variant generation) — acceptable for an admin-only workflow; enforce size limits.
- Current photos max out at 1280 px: the 1920 variant is skipped for them until originals arrive.
- Video (if ever approved) is uploaded pre-encoded; no server transcoding in v1.
