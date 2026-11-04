# 0012 — Cookie consent, CSP and quality gates

- Status: Accepted
- Date: 2026-11-04

## Context

Phase 4 (requirements 16.6, 17.5, 19, 20.2, 23) needs a cookie consent manager, security headers, SEO metadata and automated checks. The site has one first-party cookie (`hb_consent`), one optional third-party embed (the Google Maps iframe) and a cookieless, first-party aggregated counter. The admin uses two first-party session cookies. On the development host (Windows), native binaries such as Tailwind's oxide and Playwright's browsers cannot be relied on.

## Decision

1. **Build the consent manager in-house** (`apps/web/components/consent/consent-manager.tsx`) instead of using a CMP (Consent Management Platform).
   - It renders a banner with three buttons of identical style ("Aceptar todas", "Rechazar no esenciales", "Configurar preferencias") and a native `<dialog>` with category switches.
   - It writes the versioned `hb_consent` cookie (180 days, `SameSite=Lax`, `Secure` over https).
   - It posts evidence to `POST /api/v1/public/consents`: a random id, the categories and the policy version. No IP is stored.
   - The server layout reads the cookie, so the map is server-rendered already loaded for visitors who granted functional consent.
   - Changing `CONSENT_POLICY_VERSION` asks every visitor again.
   - A CMP would add a third-party script, its own cookies, and weight against the 170 KB JavaScript budget to manage two categories.
2. **CSP with a per-request nonce in `proxy.ts`**, following the Next.js 16 guide.
   - Scripts: `'self' 'nonce-…' 'strict-dynamic'`. `'unsafe-eval'` is added only in `next dev`.
   - Styles: `'self' 'unsafe-inline'`, because React `style` attributes cannot carry a nonce. The residual risk is CSS injection, not script execution.
   - Images: `'self' data: blob:` plus the origin of `S3_PUBLIC_URL`.
   - Frames: Google Maps only. `frame-ancestors 'none'`.
   - `upgrade-insecure-requests` is sent only when `SITE_URL` is https.
   - Nonces require dynamic rendering. Public pages already render per request (ADR 0011) and the admin is `force-dynamic`.
   - Static headers are set in `next.config.ts`: nosniff, Referrer-Policy, Permissions-Policy, `X-Frame-Options: DENY`, COOP, and HSTS for production builds.
   - The API (JSON only) sends `default-src 'none'; frame-ancestors 'none'` via helmet.
3. **Deployment flags instead of build flags.**
   - `SITE_URL`, `SITE_INDEXABLE` and `LEGAL_APPROVED` are read per request, in root `generateMetadata`, `robots.ts`, `sitemap.ts` and the legal pages, so one image serves staging (noindex) and production.
   - Indexing is opt-in (`SITE_INDEXABLE=true`), so a forgotten staging flag can never get indexed.
4. **Quality gates run in containers.**
   - Playwright and axe run in the official `mcr.microsoft.com/playwright` image (Compose profile `e2e`, host network) against a production build (`WEB_COMMAND=start`).
   - Lighthouse CI runs in the same image with Playwright's Chromium. Budgets live in `lighthouserc.json`.
   - In CI, the e2e job is blocking and the Lighthouse job is non-blocking, because shared runners make lab metrics noisy.
5. **Old room slugs keep answering 308** (ADR 0011). A literal 301 would cost an API lookup in `proxy.ts` on every room request.

## Consequences

- Every new third-party embed or tool must add a consent category check, a cookie-inventory row (`components/legal/legal-documents.tsx`) and a CSP source.
- `SITE_INDEXABLE=true` and `SITE_URL=https://…` must be set in production (T8 deploy guide).
- The analytics counter is first party and cookieless, but it stays behind analytics consent (conservative default, requirement 11.2). Changing that is a legal decision for the hotel.
