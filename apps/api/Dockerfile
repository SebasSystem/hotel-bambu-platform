# syntax=docker/dockerfile:1.7
# Production image for the NestJS API (build context: monorepo root).
#   docker build -f apps/api/Dockerfile -t hotel-bambu-api .
# The same image runs the API (default CMD), migrations (`prisma migrate deploy`) and the compiled
# operational scripts (`node dist/scripts/<name>.js`): see deploy/README.md.
# Debian slim (glibc): sharp, @node-rs/argon2 and the Prisma schema engine ship glibc binaries.

ARG NODE_VERSION=24.22.2
ARG TURBO_VERSION=2.11.10

FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    CI=true \
    TURBO_TELEMETRY_DISABLED=1
# openssl: required by the Prisma schema engine (migrate). ca-certificates: TLS to S3/R2.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && corepack enable
WORKDIR /repo

# 1. Prune the monorepo to the API and its workspace dependencies.
FROM base AS pruner
ARG TURBO_VERSION
COPY . .
RUN npx --yes turbo@${TURBO_VERSION} prune @hotel-bambu/api --docker

# 2. Install all dependencies (cached layer: only manifests + lockfile) and build.
FROM base AS build
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/pnpm-lock.yaml /repo/out/pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store \
 && pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ ./
COPY tsconfig.base.json ./
# `prebuild` runs `prisma generate`; the generated client is compiled into apps/api/dist.
RUN pnpm turbo run build --filter=@hotel-bambu/api \
 && find apps/api/dist packages/shared/dist -name '*.map' -delete \
 && rm -f apps/api/dist/tsconfig.tsbuildinfo

# 3. Production dependencies only (no dev deps, no build tools). The Prisma CLI is a runtime
#    dependency on purpose: the one-shot `migrate` service runs `prisma migrate deploy`.
FROM base AS prod-deps
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/pnpm-lock.yaml /repo/out/pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store \
 && pnpm install --frozen-lockfile --prod --filter @hotel-bambu/api...

# 4. Runtime: compiled API + compiled operational scripts, non-root.
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
ENV NODE_ENV=production \
    API_HOST=0.0.0.0 \
    API_PORT=4000 \
    MEDIA_MANIFEST=/app/media/assets-manifest.json \
    MEDIA_SOURCE_DIR=/import/photos
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates tini \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=prod-deps --chown=root:root /repo/node_modules ./node_modules
COPY --from=prod-deps --chown=root:root /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=prod-deps --chown=root:root /repo/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=build --chown=root:root /repo/packages/shared/package.json ./packages/shared/package.json
COPY --from=build --chown=root:root /repo/packages/shared/dist ./packages/shared/dist
COPY --from=build --chown=root:root /repo/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=root:root /repo/apps/api/dist ./apps/api/dist
COPY --from=build --chown=root:root /repo/apps/api/prisma ./apps/api/prisma
COPY --from=build --chown=root:root /repo/apps/api/prisma.config.ts ./apps/api/prisma.config.ts
# Manifest for the optional one-time `media:import` (photos are mounted at /import/photos).
COPY --chown=root:root docs/assets/assets-manifest.json ./media/assets-manifest.json
WORKDIR /app/apps/api
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.API_PORT||4000)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/main.js"]
