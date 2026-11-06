# Dependency and vulnerability audit, November 2026

Date: 2026-11-06 · Scope: every workspace (`.`, `apps/api`, `apps/web`, `packages/shared`, `e2e`), the Docker base images, and the GitHub Actions in `.github/workflows/ci.yml` · Task: D5 of `odd/tasks/public-site-redesign.md`.

## Summary

- `pnpm audit` went from **3 findings (1 high, 2 moderate)** to **1 moderate**. The remaining one is a documented, time-boxed exception (see [Exceptions](#exceptions)). An OSV batch query over all 1,148 lockfile entries gives the same result.
- **Fastify** had a security release that `pnpm audit` cannot see yet: GHSA-3qgw-9275-xf8w (2026-11-02) is published only in the Fastify repository, not in the GitHub Advisory Database. Fixed by pinning 5.12.8.
- **Caddy** 2.11.9 (2026-11-05) is a security release. We do not use the affected FastCGI paths, but the image moves to 2.11.9.
- **Node.js** has a security release pre-announced for **2026-11-11** (HIGH, affects 24.x). The images are pinned to 24.22.2 today. Bump them when 24.x ships the fix (see [Residual risks](#residual-risks)).
- Supply chain: pnpm 11 install-script allowlist reviewed. The release-age gate is now explicit (strict) and `trustPolicy: no-downgrade` is enabled, with three reviewed exceptions. The lockfile has **no** package version listed by the ChainDrop, Shai-Hulud 2.0, TeamPCP or axios campaign IOC lists.
- Images must be rebuilt (`pnpm prod:build`) for the new base image tags to take effect. No container was started, stopped or pulled during this audit.

## Versions: before and after

Only the changed and the notable entries are listed. Everything else was already on the latest stable version in its line (`pnpm outdated -r`).

### Packages

| Package | Before | After | Change | Why |
| --- | --- | --- | --- | --- |
| pnpm (`packageManager`) | 11.24.0 | 11.28.11 | minor | Latest pnpm 11. pnpm 12 is out of scope (major) |
| Node.js (`engines`) | >=24.11.0 | >=24.22.1 | floor | 24.22.1 is the October 2026 security release. Older 24.x are vulnerable |
| fastify | 5.12.7 | 5.12.8 | patch | **Security**: GHSA-3qgw-9275-xf8w |
| @nestjs/common, core, platform-fastify, testing | 12.3.2 | 12.3.3 | patch | Latest |
| @nestjs/config | 12.0.1 | 12.1.0 | minor | Latest |
| @aws-sdk/client-s3 (and its @aws-sdk/@smithy transitives) | 3.1161.0 | 3.1162.0 | minor | 3.1163.0 is younger than the 24 h release-age gate |
| lucide-react | 1.68.0 | 1.69.0 | minor | Latest |
| @types/node (range) | ^24.0.0 | ^24.19.2 | range | Same resolved version. The range floor now matches the lock |
| basic-ftp (transitive, e2e) | 5.3.1 | 6.2.6 | major, override | **Security**: GHSA-c475-qrg2-pj4r plus four later basic-ftp fixes |
| minimatch (transitive, tooling) | 10.2.6 | 11.0.4 | major, override | **Security**: GHSA-g3hv-75wg-m249 |
| @babel/*, @fastify/cors, file-type, tslib (transitive) | various | patch/minor | refresh | `pnpm update -r --depth Infinity` within the existing ranges |

Unchanged on purpose: next 16.4.5, react/react-dom 19.3.1, prisma/@prisma/client/@prisma/adapter-pg 7.10.1, sharp 0.35.5, zod 4.6.7, vitest 5.1.0, eslint 10.14.0. Each is already the latest stable version in its line, and each includes the 2026 fixes listed below.

### Majors taken and skipped

| Major | Decision | Reason |
| --- | --- | --- |
| basic-ftp 5 → 6 (override) | Taken | Security fix with no 5.x backport. The only breaking change in 6.0 (no separate transfer host by default, which blocks FTP bounce) does not affect us. Lighthouse reaches it only through PAC-proxy resolution in e2e tooling |
| minimatch 10 → 11 (override) | Taken | Security fix with no 10.x backport. eslint, typescript-eslint and @nestjs/cli call only the `minimatch()` / `Minimatch` API, which 11 keeps. Lint, typecheck and the Nest build pass with it |
| actions/upload-artifact v5 → v7 | Taken | Low risk and documented: v6 moved to the Node 24 runtime, and v7 added ESM and optional unzipped single-file uploads. Our usage (`name`, `path`, `retention-days`) is unchanged |
| typescript 6 → 7 | Skipped | Not a security fix. TypeScript 7 is the native (Go) compiler. Next.js, typescript-eslint and the Nest CLI need to confirm support first |
| @types/node 24 → 26 | Skipped | Types must match the runtime, which is Node 24 LTS |
| jsdom 30 → 31 | Skipped | Published 2026-11-05 (inside the release-age gate). Not a security fix. Test-only |
| prisma 7 → 8 | Skipped | npm's `latest` tag for `prisma` points to `8.0.0-rc.30`, a release candidate. Prisma's release-status page says to pin `prisma@7` for Prisma 7 projects. A major ORM migration is out of scope |
| pnpm 11 → 12 | Skipped | `packageManager` major is a project decision. pnpm 11 has no open advisory |
| @playwright/test 1.64.1 → 1.65.0 | Skipped (minor) | Published 2026-11-05 18:30 UTC, inside the 24 h gate. It must move together with the `mcr.microsoft.com/playwright:v1.65.0-noble` image. Take it in the next update |

### Docker images

| Image | File | Before | After | Note |
| --- | --- | --- | --- | --- |
| node (API, web) | `apps/api/Dockerfile`, `apps/web/Dockerfile` | `24-bookworm-slim` (floating) | `24.22.2-bookworm-slim` | Pinned. 24.22.2 (2026-10-27) is the latest 24 LTS |
| node (dev `web` service) | `docker-compose.yml` | `24-bookworm-slim` | `24.22.2-bookworm-slim` | Pinned |
| caddy | `docker-compose.prod.yml` | `2.11.8-alpine` | `2.11.9-alpine` | Security release, 2026-11-05 |
| amazon/aws-cli | both compose files | `2.39.3` | `2.39.5` | Latest |
| postgres | both compose files, `deploy/backup/Dockerfile`, CI service | `18.6-alpine` | unchanged | 18.6 is the current 18.x minor. The next quarterly minor release is due in November |
| rustfs/rustfs | both compose files | `1.0.4` | unchanged | Latest |
| cloudflare/cloudflared | `docker-compose.prod.yml` | `2026.10.7` | unchanged | Latest |
| mcr.microsoft.com/playwright | `docker-compose.yml` | `v1.64.1-noble` | unchanged | Matches `@playwright/test` 1.64.1 |
| hotel-bambu-api/web/backup | `docker-compose.prod.yml` | `${IMAGE_TAG:-latest}` | unchanged | Locally built images, never pulled from a registry. Set `IMAGE_TAG` on deploy |

### GitHub Actions

`actions/checkout@v7`, `actions/setup-node@v7`, `pnpm/action-setup@v6`, `docker/setup-buildx-action@v4` and `docker/build-push-action@v7` are already the latest majors. Only `actions/upload-artifact` changed (v5 → v7).

## Advisories

Sources: `pnpm audit`, an OSV batch query (`api.osv.dev/v1/querybatch`) over every lockfile entry before and after, the GitHub Advisory Database, and vendor release notes.

### Found in our dependency tree

| Advisory | Package | Severity | Published | Status |
| --- | --- | --- | --- | --- |
| [GHSA-3qgw-9275-xf8w](https://github.com/fastify/fastify/security/advisories/GHSA-3qgw-9275-xf8w) (CVE-2026-120216): DoS through an uncaught exception on `handlerTimeout` with streaming responses | fastify >=5.8.0 <5.12.8 | moderate (5.9) | 2026-11-02 | **Fixed** (5.12.8). Our API sets no `handlerTimeout`, so it was not exploitable here. Not yet in the GitHub Advisory Database, so `pnpm audit` did not report it |
| [GHSA-c475-qrg2-pj4r](https://github.com/advisories/GHSA-c475-qrg2-pj4r) (CVE-2026-102990): quadratic CPU in the `Client.list()` parser | basic-ftp <=6.2.0 | high (8.2) | 2026-08-27 | **Fixed** by override (6.2.6). Needs a malicious FTP server. Reachable only from e2e tooling (`@lhci/cli` → `proxy-agent` → `get-uri`) |
| [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) (CVE-2026-118764): globparts amplification DoS | minimatch >=7.0.0 <11.0.1 | moderate (6.9) | 2026-10-27 | **Fixed** by override (11.0.4). Needs attacker-supplied glob patterns. Ours come from our own config files (eslint, Nest CLI) |
| [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) (CVE-2026-118773): AbortSignal cancellation bypass | glob >=9.0.0 <=14.0.1 | moderate (6.3) | 2026-10-27 | **Exception**, see below |

### Checked and already covered by our versions

| Advisory | Affected | Our version | Why it does not apply |
| --- | --- | --- | --- |
| [GHSA-673q-mjm6-r5xr](https://github.com/advisories/GHSA-673q-mjm6-r5xr): Next.js RCE in `use cache` returning typed arrays (critical) | next >=16.0.0 <=16.4.0 | 16.4.5 | Patched in 16.4.1 (published 2026-10-22) |
| [GHSA-2464-fhr4-w9xw](https://github.com/advisories/GHSA-2464-fhr4-w9xw): Next.js RCE in Image Optimization with SVG (critical) | next <=15.5.27, 16.0.0–16.4.0 | 16.4.5, sharp 0.35.5 | Patched. We do not use the runtime image optimizer either (ADR 0011) |
| [GHSA-p3m5-59mp-jv5r](https://github.com/advisories/GHSA-p3m5-59mp-jv5r): Next.js DoS in App Router Server Actions (high) | next <=16.4.0 | 16.4.5 | Patched in 16.4.1 |
| [GHSA-rv78-f8rc-xrxh](https://github.com/advisories/GHSA-rv78-f8rc-xrxh) (CVE-2026-23870), [GHSA-83fc-fqcc-2hmg](https://github.com/react/react/security/advisories/GHSA-83fc-fqcc-2hmg) (CVE-2026-23864), [GHSA-fv66-9v8q-g76r](https://github.com/react/react/security/advisories/GHSA-fv66-9v8q-g76r) (CVE-2025-55182): React Server Components DoS (high, 2026-05-11 and 2026-01-29) and RCE (critical, 2025-12-03) | react-server-dom-* 19.0.x/19.1.x/19.2.x before 19.0.6/19.1.7/19.2.6 | react 19.3.1 (Next bundles its patched RSC server) | Newer than every fixed line |
| [GHSA-36xv-jgw5-4q75](https://github.com/advisories/GHSA-36xv-jgw5-4q75) (CVE-2026-35515, 2026-04-06): SSE output injection (moderate) | @nestjs/core <=11.1.17 | 12.3.3 | Fixed in 11.1.18; Nest 12 includes it. We do not use SSE either |
| [GHSA-jx2c-rxcm-jvmq](https://github.com/advisories/GHSA-jx2c-rxcm-jvmq), [GHSA-mrq3-vjjr-p77c](https://osv.dev/vulnerability/GHSA-mrq3-vjjr-p77c): Fastify content-type tab validation bypass (high) and sendWebStream DoS (low), 2026-02-02 | fastify <=5.7.2 | 5.12.8 | Fixed in 5.7.2/5.7.3 |
| [Node.js October 21, 2026 security releases](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases): TLS hostname bypasses, Brotli OOB write, DNS truncation (high) | Node 24 <24.22.1 | 24.22.2 (host, images, CI via `.nvmrc` `24`) | Fixed. `engines` now enforces >=24.22.1 |
| [Caddy 2.11.8](https://github.com/caddyserver/caddy/releases/tag/v2.11.8) / [2.11.9](https://github.com/caddyserver/caddy/releases/tag/v2.11.9): host-based path escape, FastCGI script confusion, `file` matcher bypass, go-jose (GHSA-r766-rf9f-588h, GHSA-f278-mgc7-46j3, GHSA-25cw-38mq-q7m6, GHSA-q34h-28rj-5hjm, GHSA-9cr8-wmhh-39pm, GHSA-mgcc-cww5-fp2q) | caddy <2.11.9 | 2.11.9 | Our Caddyfile only uses `reverse_proxy` (no `php_fastcgi`, `file_server` or `{host}` paths), so it was not exposed. Upgraded anyway |
| Prisma ORM | — | 7.10.1 | No GitHub, OSV or vendor advisory for Prisma 7. See the provenance note under [Supply chain](#supply-chain) |
| PostgreSQL | — | 18.6 | Current 18.x minor ([versioning](https://www.postgresql.org/support/versioning/)). Re-check after the November minor release |

### Exceptions

**GHSA-3g3m-2fjr-6pw4, glob 13.0.6 (moderate).** Path: `e2e > @lhci/cli > lighthouse > @sentry/node > @sentry/bundler-plugins@11.10.0 > glob@^13.0.6`. The fixed parent, `@sentry/bundler-plugins` 11.11.0 (needs glob ^14.0.3), was published on 2026-11-05 12:42 UTC, inside the 24 h release-age gate. The issue needs code that passes an `AbortSignal` to a glob walk over attacker-influenced patterns. Lighthouse loads Sentry only for error reporting, and only in the dev-only e2e tooling. Nothing ships in the API or web images. Instead of overriding glob to 14 under a parent that pins ^13, we wait for the fixed parent.

**Remove the exception on or after 2026-11-07:** run `pnpm update -r --depth Infinity "@sentry/*"`, then `pnpm audit`. The expected result is 0 vulnerabilities.

## Supply chain

- **Install scripts.** pnpm 11 replaced `onlyBuiltDependencies` with `allowBuilds`, and `strictDepBuilds` defaults to true (an unreviewed build script fails the install). The allowlist in `pnpm-workspace.yaml` allows `@prisma/engines`, `prisma` and `@swc/core`. It denies `esbuild` (its postinstall is only a binary check, and the binaries come from optional dependencies). The install shows no unreviewed build script. sharp and @node-rs/argon2 use prebuilt optional dependencies and need no script.
- **Release age.** pnpm 11 already defaults `minimumReleaseAge` to 1440 minutes, but in non-strict mode. It is now set explicitly to 1440, which makes it strict: resolution fails instead of silently taking a version younger than 24 h. The stale `minimumReleaseAgeExclude` entries (lucide-react 1.68.0, gsap 3.15.1) are removed, because both versions are now older than the gate. Recommendation: keep 1440. For an urgent security patch younger than the gate, add an exact `name@version` exclude with a removal date, never a bare package name.
- **Trust policy.** `trustPolicy: no-downgrade` is enabled. It fails the install when a version has weaker publish evidence (provenance or trusted publisher) than earlier releases, which is how most token-theft takeovers show up. Three exact versions failed and were reviewed and excluded:
  - `prisma@7.10.1`: Prisma publishes the CLI with a bot token since 7.10.0. This is a known, explained change ([prisma/orm#30850](https://github.com/prisma/orm/issues/30850), PR #30035), published by `prismabot`. `@prisma/client` 7.10.1 keeps provenance.
  - `eslint-import-resolver-typescript@3.10.1`: the v3 maintenance line (eslint-config-next pins ^3), published by its maintainer.
  - `chromium-bidi@157.0.8090-0`: published by the official `chrome-devtools-npm` account (via lighthouse/puppeteer, e2e only).

  Each exclusion is version-exact, so the next version is checked again.
- **Exotic sources.** `blockExoticSubdeps` defaults to true in pnpm 11: only direct dependencies may come from git or tarball URLs. We have none.
- **Campaign IOCs.** The lockfile was compared against Datadog's published lists ([indicators-of-compromise](https://github.com/DataDog/indicators-of-compromise)): ChainDrop/keyv campaign (identified 2026-08-04, 444 package versions), Shai-Hulud 2.0, TeamPCP and the axios compromise. Six package names overlap, but no compromised version is installed. No ChainDrop file indicator (`setup.mjs`, `math_init.js`, `.claude/setup.mjs`, `.vscode/tasks.json`, `gh-token-monitor`) is present in the repository, in `node_modules/.pnpm`, or in the user's home directory.
- **The `npx psql` incident.** The npm package `psql` is an unrelated "Parallel MySQL queries" package (0.0.1, last modified 2023-05-09, no install scripts). It is not in the npx cache now. The cache does hold `tsc@2.0.4`, the old placeholder that `npx tsc` installs outside a project. Both are harmless, but they show the risk. Rule: never run `npx <name>` for a binary that is not in this workspace. Use `pnpm exec <bin>` or `pnpm --filter <pkg> <script>`, which fail instead of downloading. For PostgreSQL, use `docker compose exec postgres psql …`.

## Residual risks

1. **Node.js security release on 2026-11-11** ([pre-announcement](https://nodejs.org/en/blog/vulnerability/november-2026-security-releases)): HIGH, affects 24.x. When it ships, bump `ARG NODE_VERSION` in both Dockerfiles, the dev `web` image in `docker-compose.yml`, the `engines` floor and the host Node, then rebuild the images.
2. **glob exception** until 2026-11-07 (above).
3. **Base image OS packages** (Debian bookworm, Alpine) were not scanned, because pulling images was out of scope. After the rebuild, run an image scanner (`docker scout cves` or Trivy) on `hotel-bambu-api`, `hotel-bambu-web` and `hotel-bambu-backup`.
4. **Peer warning (pre-existing):** `@puppeteer/browsers` 3.2.6 wants `proxy-agent >=8.0.1`, but `@lhci/cli` 0.16.0 brings 6.5.0. It affects e2e Lighthouse only, and `@lhci/cli` 0.16.0 is the latest version.
5. **Deprecated transitives:** `glob@7.2.3`, `inflight@1.0.6` and `rimraf@3.0.2` (old tooling chains, no advisory). They go away when their parents update.
6. **Actions are pinned by major tag**, not by commit SHA. Pin them by SHA if the repository becomes public or gains deploy secrets.

## Update policy

- **Monthly:** `pnpm outdated -r` and `pnpm audit`. Take all patch and minor updates (`pnpm update -r --depth Infinity` within ranges), and pin Docker tags to the current patched versions. Record the result in a new `docs/security/dependency-audit-YYYY-MM.md`.
- **Security releases:** apply them within 7 days (critical or high: 48 h) for anything that ships (API, web, images). Watch `pnpm audit`, the GitHub Advisory Database, the Next.js/React, Node.js, Caddy and PostgreSQL release pages, and the Fastify and NestJS repository advisories. Repository advisories can reach the database days later, as GHSA-3qgw-9275-xf8w did.
- **Majors:** take them only when needed for a security fix, or when they are low-risk and documented. Each one is its own commit, with the reason written down.
- **Never** use `latest` tags or dist-tags. Exact pins stay exact (`next`, `fastify`, `@playwright/test`), and Nest uses `~`. Overrides need a comment naming the advisory, plus a removal condition.
- **Release age:** keep the 24 h gate (strict) and `trustPolicy: no-downgrade`. Every exclusion must be an exact version with a reason.
- **After any base-image change:** `pnpm prod:config`, then a rebuild (`pnpm prod:build`), then an image scan.
