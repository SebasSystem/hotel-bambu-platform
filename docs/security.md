# Security

This document summarizes the threat model (requirement 16.7) and the controls that address each threat. Design decisions are recorded in [ADR 0008](adr/0008-auth-sessions-csrf.md) (auth, sessions and CSRF) and [ADR 0012](adr/0012-consent-csp-and-quality-gates.md) (CSP, consent and quality gates). No system is absolutely secure: review this document whenever a dependency, provider or feature changes.

## Architecture in one paragraph

The browser only talks to the Next.js origin. Next.js serves the public site and the admin panel, and proxies `/api/v1/*` to the NestJS API (requirement 12.4). The API owns PostgreSQL and the S3 bucket. Admins authenticate with an opaque server-side session in an HttpOnly cookie. Public visitors have no account and submit no forms. The only public writes are the aggregated analytics counter and the consent evidence.

## Threats and controls

| Threat | Controls | Where |
|---|---|---|
| SQL injection | Prisma parameterized queries only; strict Zod schemas reject unknown fields | `apps/api`, `packages/shared` |
| XSS | React escaping; `dangerouslySetInnerHTML` only for JSON-LD (escaped `<`); admin text is plain text (no HTML); CSP with per-request nonce and `'strict-dynamic'`; no third-party scripts | `components/seo/json-ld.tsx`, `apps/web/proxy.ts` |
| CSRF | `SameSite=Lax` session cookie, `Origin`/`Sec-Fetch-Site` check against `WEB_ORIGINS` on every unsafe request, plus an HMAC session-bound `x-csrf-token` | `apps/api/src/modules/auth/csrf.ts` |
| Clickjacking | `frame-ancestors 'none'` + `X-Frame-Options: DENY` (web and API) | `proxy.ts`, `next.config.ts`, `app.setup.ts` |
| Brute force / user enumeration | Argon2id; generic 401; rate limits per IP and per IP+account; account lockout | auth module, [configuration.md](configuration.md) |
| Endpoint abuse | Per-IP rate limits (default, login, public writes, uploads); body size limits; `429` | `rate-limit.config.ts` |
| Malicious files | JPEG/PNG/WebP only, real signature check (`file-type`), size limits, re-encoded by sharp (EXIF stripped), random keys, no user SVG | media module |
| Secret exposure | Secrets only in environment variables; `.env` ignored by git; production refuses weak/missing secrets; logs redact cookies, CSRF and revalidation headers | `config/env.ts`, logger |
| Unauthorized access | Every `/admin/*` API route requires a session; `proxy.ts` redirects without a cookie (optimistic only); admin pages `private, no-store`, `noindex` | API guards, `proxy.ts` |
| Insecure CORS | CORS disabled: same-origin proxy | `app.setup.ts` |
| SSRF | The server never fetches user-supplied URLs; social links are validated https URLs on known hosts and only rendered | shared schemas |
| Session theft | HttpOnly, `Secure` + `__Host-` prefix in production, absolute and idle expiry, rotation on login and password change, server-side invalidation | ADR 0008 |
| Tracking without consent | No third-party scripts; the analytics counter and the map load only after consent; evidence without IP | `components/consent` |

## HTTP headers

**Web (Next.js)**:

- `Content-Security-Policy`, per request, from `proxy.ts`:
  - `default-src 'self'`
  - `script-src 'self' 'nonce-…' 'strict-dynamic'`
  - `style-src 'self' 'unsafe-inline'`
  - `img-src 'self' data: blob: <S3_PUBLIC_URL origin>`
  - `font-src 'self'`
  - `connect-src 'self'`
  - `frame-src https://www.google.com https://maps.google.com`
  - `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`
  - `upgrade-insecure-requests` when `SITE_URL` is https
- From `next.config.ts`:
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-Frame-Options: DENY`
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Permissions-Policy`: camera, microphone, geolocation, payment, usb, sensors and topics disabled
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`, production builds only
- `X-Powered-By` is removed.
- `/admin` responses also get `Cache-Control: private, no-store` and `X-Robots-Tag: noindex, nofollow`.

**API (helmet)**:

- `Content-Security-Policy: default-src 'none';base-uri 'none';form-action 'none';frame-ancestors 'none'`
- `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: no-referrer`, HSTS, CORP/COOP `same-origin`
- `Cache-Control: no-store`, except on public GETs

Check them locally:

```bash
curl -sI http://localhost:3000/ | grep -iE 'content-security|strict-transport|referrer|permissions|x-frame|nosniff'
curl -sI http://localhost:4000/api/v1/health | grep -iE 'content-security|x-frame'
```

**Known trade-off.** `style-src` allows `'unsafe-inline'` because React `style` attributes (image placeholders, motion indices) cannot carry a nonce. Style injection cannot execute script, and the site renders no untrusted HTML.

## Operations checklist (production)

- [ ] HTTPS everywhere (Cloudflare "Full (strict)"). Set `SITE_URL=https://…` (this enables `upgrade-insecure-requests`). Add HSTS preload only after confirming every subdomain serves HTTPS.
- [ ] `TRUST_PROXY` / `TRUST_CLOUDFLARE` match the real proxy chain, and the origin accepts only Cloudflare (see [configuration.md](configuration.md)).
- [ ] Strong, unique `SESSION_SECRET` and `REVALIDATE_SECRET`. The database user and the bucket keys have minimum permissions. The bucket is public-read for objects only.
- [ ] `pnpm audit` and Dependabot/Renovate are enabled. Dependencies are reviewed monthly.
- [ ] Backups of PostgreSQL and the bucket, with a tested restore (requirement 22).
- [ ] Admin accounts are personal, and passwords are changed after handover. Failed logins and lockouts are reviewed in the logs.
- [ ] Any new third-party embed or script: add the CSP source, a consent category check and a row in the cookie inventory.

## Tests that cover these controls

- API integration tests cover: session, CSRF (403), foreign origin, generic login error, upload validation, headers, and consent evidence without IP.
- Web unit tests cover: CSP builder and proxy guard (`lib/proxy.test.ts`), consent cookie parsing and versioning, JSON-LD escaping.
- E2E (`pnpm e2e`) covers: security headers, admin redirect, `no-store`/`noindex` on the admin, consent behavior, and no CSP violations on the home page.
