# ADR 0014: Production deployment on a single VPS behind Cloudflare

- Status: accepted
- Date: 2026-11-04

## Context

The owner deploys the platform himself on one Linux VPS with the domain on Cloudflare (requirement 24). The deployment needs reproducible images, HTTPS, a single public entry (requirement 12.4), minimal exposure, and tested backups (requirement 22).

## Decision

- **Images.** We use multi-stage Dockerfiles built from the monorepo root on `node:24-bookworm-slim`. We chose glibc because sharp, `@node-rs/argon2` and the Prisma schema engine ship glibc binaries, and all three were verified in the image. Each Dockerfile uses `turbo prune --docker` with a cached install layer.
  - The web image uses Next.js `output: 'standalone'`. The `/api/v1` rewrite target (`API_INTERNAL_URL`) is compiled in at build time. Turborepo runs the build with `--env-mode=loose` so this value is not stripped.
  - The API image installs production dependencies only and contains no source maps.
  - Both images run as non-root with `tini`, a read-only root filesystem and healthchecks.
- **Migrations.** `prisma` is a runtime dependency of the API. It was already installed in production as the peer of `@prisma/client`. A one-shot `migrate` service runs `prisma migrate deploy` from the API image, and `api` starts only after it succeeds. The operational scripts run from the same image as compiled JavaScript (`node dist/scripts/*.js`): base seed, `admin:create`, and `media:import`. The demo seed is never run in production.
- **Ingress (primary).** Caddy on 443 with a Cloudflare Origin CA certificate, Cloudflare SSL in "Full (strict)", and the host firewall (ufw + `DOCKER-USER`) admitting only Cloudflare's IP ranges. With Cloudflare as the only path to the origin, `TRUST_CLOUDFLARE=true` is safe.
- **Ingress (alternative).** Cloudflare Tunnel (`cloudflared`, `tunnel` profile), with no inbound ports.
- **Media.** Cloudflare R2 with a public custom domain (`media.<domain>`) is recommended. Self-hosted RustFS remains available behind the `storage` profile. The S3 configuration is fully driven by environment variables.
- **Backups.** A `backup` service runs a daily `pg_dump` (custom format, checksum, local retention) and can copy dumps off-site to S3/R2 and mirror the media bucket. `restore.sh` restores a dump, and a restore drill compares row counts.

## Consequences

- One `docker compose` file and one env file (`deploy/.env.production`, git-ignored) define production. CI builds all three images on every push, without pushing them.
- The API image is about 940 MB uncompressed, mostly the Prisma CLI tree. This is the price of a single image that can also run migrations.
- Changing `API_INTERNAL_URL` requires rebuilding the web image. The other web flags are read at runtime.
- Prisma migrations are forward-only. Rolling back a schema change means restoring the backup taken before the update.
- Cloudflare IP ranges are pinned in the Caddyfile and fetched by the firewall script. Both must be refreshed when Cloudflare publishes changes.
