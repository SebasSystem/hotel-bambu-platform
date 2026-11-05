# syntax=docker/dockerfile:1.7
# Production image for the Next.js site + admin panel (build context: monorepo root).
#   docker build -f apps/web/Dockerfile --build-arg API_INTERNAL_URL=http://api:4000 -t hotel-bambu-web .
# Uses Next.js `output: 'standalone'`: only the traced server files and production dependencies.
# Runtime flags (SITE_URL, SITE_INDEXABLE, S3_PUBLIC_URL, LEGAL_*, REVALIDATE_SECRET) are read per
# request; API_INTERNAL_URL is also compiled into the `/api/v1/*` rewrite at build time.

ARG NODE_VERSION=24
ARG TURBO_VERSION=2.11.10

FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    CI=true \
    TURBO_TELEMETRY_DISABLED=1 \
    NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /repo

# 1. Prune the monorepo to the web app and its workspace dependencies.
FROM base AS pruner
ARG TURBO_VERSION
COPY . .
RUN npx --yes turbo@${TURBO_VERSION} prune @hotel-bambu/web --docker

# 2. Install (cached layer: manifests + lockfile only) and build.
FROM base AS build
ARG API_INTERNAL_URL=http://api:4000
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/pnpm-lock.yaml /repo/out/pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store \
 && pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ ./
COPY tsconfig.base.json ./
ENV NODE_ENV=production \
    API_INTERNAL_URL=${API_INTERNAL_URL}
# Loose env mode: Turborepo's strict mode would otherwise drop API_INTERNAL_URL from the build.
RUN pnpm turbo run build --filter=@hotel-bambu/web --env-mode=loose \
 && find apps/web/.next/standalone -name '*.map' -delete

# 3. Runtime: standalone server, static assets and public files, non-root.
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
ARG API_INTERNAL_URL=http://api:4000
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    API_INTERNAL_URL=${API_INTERNAL_URL}
RUN apt-get update \
 && apt-get install -y --no-install-recommends tini \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build --chown=root:root /repo/apps/web/.next/standalone ./
COPY --from=build --chown=root:root /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=root:root /repo/apps/web/public ./apps/web/public
# The image optimizer and ISR cache write under .next/cache: the only writable path.
RUN mkdir -p apps/web/.next/cache && chown node:node apps/web/.next/cache
WORKDIR /app/apps/web
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.js"]
