# 0008 — Admin authentication, sessions, CSRF and rate limiting

- Status: Accepted
- Date: 2026-11-04

## Context

Requirements 12.4, 12.5, 16.1–16.3 and 16.7 ask for server-side sessions with an opaque token, generic login errors, lockout and rate limiting per IP and account, `HttpOnly`/`Secure`/`SameSite` cookies with idle and absolute expiry, CSRF protection on writes, and authorization with NestJS Guards (not middleware). The browser only talks to the Next.js origin; Next rewrites `/api/v1/*` to the API (ADR 0005), so the API cookie is first-party and CORS stays disabled.

## Decision

**Sessions** (`apps/api/src/modules/auth`)

- Login (`POST /api/v1/auth/login`) issues a 256-bit random token (`base64url`). Only its SHA-256 lands in `Session.tokenHash`; optional `ipHash`/`userAgentHash` are HMACs keyed with `SESSION_SECRET`, never raw values.
- Cookie: `__Host-hb_session` when Secure (production default), `hb_session` in plain-http development. Attributes: `HttpOnly`, `SameSite=Lax`, `Path=/`, no `Domain`, `Max-Age` = absolute lifetime. The `__Host-` prefix makes browsers reject the cookie unless it is Secure, host-only and `Path=/`, so a sibling subdomain cannot plant it.
- Expiry: absolute `SESSION_ABSOLUTE_HOURS` (default 12) stored in `expiresAt`; idle `SESSION_IDLE_MINUTES` (default 120) from `lastSeenAt`, refreshed at most once a minute. Expired sessions are deleted when presented.
- Rotation: login always creates a new session and revokes the one sent with the request (fixation); password change revokes every session of the admin and opens a new one; `admin:create --reset-password` revokes all. Logout deletes the session server-side and clears the cookies.
- A session is also rejected when the admin is inactive or its `passwordChangedAt` is newer than the session.

**Login hardening**

- Same 401 message (`Invalid email or password.`) for unknown email, wrong password, locked and inactive accounts. Unknown emails and locked accounts still run an Argon2 verification against a dummy hash so timing does not reveal them.
- Account lockout: `LOGIN_MAX_ATTEMPTS` (5) consecutive failures lock the account for `LOGIN_LOCK_MINUTES` (15) via `AdminUser.lockedUntil`; the counter resets on success. Lockouts go to `AuditLog` (`auth.lockout`) and every failure is logged as a structured security event without the password or email.
- Per IP + account limit: 10 attempts / 15 min (in memory) → 429, on top of the per-IP route limit.

**CSRF: Origin check + session-bound token** (both, as 12.4 asks)

1. Every unsafe request (`POST/PUT/PATCH/DELETE`), public ones included, is rejected with 403 when `Sec-Fetch-Site` is present and not `same-origin`/`none`, or when `Origin` is present and not in `WEB_ORIGINS`. This also blocks login CSRF and cross-site posts to `/public/events` and `/public/consents`.
2. Authenticated unsafe requests must send `x-csrf-token` = `HMAC-SHA256(SESSION_SECRET, "csrf:" + sessionId)` (base64url), compared in constant time. This is the OWASP "signed double-submit / HMAC" pattern: nothing extra is stored, a token is useless outside its session and cannot be forged without the secret. Requests without `Origin` (server-to-server calls from Next) still need the token.

The token is returned in the JSON body of `POST /auth/login`, `POST /auth/change-password` and `GET /auth/me`, and copied into a readable `hb_csrf` cookie for convenience. The server never trusts the cookie copy; it recomputes the HMAC from the session.

Alternatives rejected: `@fastify/csrf-protection` (needs its own secret cookie or session store and adds nothing over the HMAC token here); Origin-only (12.4 asks for a token as well, and some privacy tools strip `Origin`); `SameSite=Strict` (breaks the first navigation from an external link into `/admin`; Lax plus the token covers CSRF).

**Authorization**: one global `SessionAuthGuard` (APP_GUARD) denies every route by default and runs the CSRF policy right after resolving the session, so the order between the two checks cannot drift. Public routes opt out of the session part with `@Public()` (health, `/public/*`, login). The admin and its role are carried on `request.admin`. Since 2026-11-09 a `PermissionGuard` runs after this guard and checks per-route role permissions; roles are database rows instead of the `ADMIN`/`EDITOR` enum (see [ADR 0017](0017-admin-roles-permissions.md)).

**Rate limiting**: `@nestjs/throttler` as a global guard, in-memory storage (single API instance, ADR 0001), tracker = client IP. Limits per minute per IP, all env-configurable: default 300 (every route), login 10, public writes (events, consents) 60, uploads 30. Answers 429.

**Client IP**: Fastify `trustProxy` from `TRUST_PROXY` (`false` by default; `true`, hop count or proxy IP/CIDR list). `CF-Connecting-IP` is only read when `TRUST_CLOUDFLARE=true`, which is safe only if the origin firewall accepts traffic exclusively from Cloudflare (T8 deploy guide).

## Consequences

- The web must forward the session cookie on server-side admin fetches and send `x-csrf-token` on every admin mutation (contract in `docs/api.md`). `WEB_ORIGINS` must list the public origin(s) of the site.
- Changing `SESSION_SECRET` invalidates every CSRF token (admins log in again) but not the stored session hashes.
- In-memory rate limit and login counters reset on restart and are per process; scaling the API horizontally requires a shared store (Redis) — documented as a follow-up, not needed for v1.
- 2FA (TOTP) remains a later improvement (16.1).
