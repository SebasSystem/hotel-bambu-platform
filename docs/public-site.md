# Public site (`apps/web/app/(site)`)

Spanish (es-CO) public pages for visitors. Requirements 4, 5, 8, 17.5–17.6, 19–21 apply. The design is the owner-approved mockup ported to the platform ([mockup-design-spec.md](design/mockup-design-spec.md), tokens in `styles/tokens.css`). Every piece of hotel content comes from `GET /api/v1/public/*`, and interface strings live in `lib/i18n/es.ts`. A block whose data is missing is not rendered; no block is ever shown empty, and nothing is invented (no rate, bed, distance or review the hotel did not enter).

## Routes

| Route | Content |
|---|---|
| `/` | Home, in this order (sections can be switched off in admin › Contenido › Secciones de la portada): hero carousel (H1 "Hotel Bambú Plaza", "Hotel en Mocoa, Putumayo", tagline, "Desde $X COP/noche" only when a published type has a rate, contact CTA + "Ver habitaciones"); room type cards; facts strip (address, room count, hotel amenities with a benefit line; the RNT is in the footer only); "Estamos en Mocoa." location (address, phone, nearby places when present, consent-gated map, "Cómo llegar"); "Sobre nosotros" (only with profile text); reviews slot (renders nothing until reviews exist); policies summary; gallery strip; closing CTA |
| `/habitaciones` | Published room types, filterable with `?tipo=individual\|pareja\|doble\|familiar` (chips only for kinds that exist) |
| `/habitaciones/[slug]` | Room type: photos + lightbox, generated factual lead (or the hotel's description), capacity, beds/area when set, room amenities, the hotel-wide amenities line, rate or "Consultar tarifa", contact CTA, links to location, policies and the other types. An old slug answers a permanent redirect (308) to the current one; unknown → 404 |
| `/galeria` (`?categoria=`) | "Galería de fotos": masonry with category filters and lightbox |
| `/ubicacion` | "Ubicación y cómo llegar": address, phone, contact CTA, nearby places, map, directions link (the former `/contacto`) |
| `/politicas-del-hotel` | "Políticas y preguntas frecuentes": check-in/out when set, policies and the visible FAQ (the former `/preguntas-frecuentes`) |
| `/legal/{tratamiento-de-datos,aviso-de-privacidad,cookies}` | Legal templates filled from the hotel profile; draft banner and `noindex` until `LEGAL_APPROVED=true` ([legal-checklist.md](legal-checklist.md)) |
| `/contacto`, `/preguntas-frecuentes`, `/servicios` | 301 to `/ubicacion`, `/politicas-del-hotel` and `/` (`lib/public/redirects.ts`, applied in `next.config.ts`) |
| `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` | See [seo.md](seo.md) |
| any other URL | Branded 404 (`noindex`) with the contact CTA and links to every section and room type, via `app/(site)/[...missing]` |
| `POST /api/revalidate` | On-demand revalidation (see ADR 0011) |

## Data and caching

`lib/public/api.ts` defines the loaders. The site profile is required. Every other list is optional: a failure is logged and the page renders without that block. Responses are tagged with `CACHE_TAGS` and invalidated by the API through `/api/revalidate`. See [ADR 0011](adr/0011-public-rendering-and-images.md).

## Contact CTAs (requirement 5)

- One rule site-wide (`lib/public/cta.ts`, rendered by `ContactCtaLink`): WhatsApp when a valid number is set in admin › Información del hotel, otherwise a `tel:` link "Llamar al 310 679 8260" from `HotelProfile.phone`. Mobile menu, hero, room cards, room type page, location, guest information, closing CTA and 404 all use it.
- The header shows both channels (owner review 2026-11-08), all from the hotel profile: on desktop an "Escribir por WhatsApp" button plus the phone (`phoneContact`) as a `tel:` link next to it (a round icon below 1280 px, icon + number from 1280 px); with only a phone, the phone button. On phones the header keeps a call icon when a phone exists (a WhatsApp icon otherwise) and WhatsApp lives in the floating button.
- WhatsApp messages come from code defaults plus the editable greeting (`buildWhatsAppMessage` in `packages/shared`: `GENERAL`, or `ROOM_TYPE` naming the room). Links open in a new tab with `rel="noopener noreferrer"`. Opening WhatsApp is not a booking, and the copy says so.
- The floating WhatsApp button only exists when a number is set (it has no phone fallback). It sits at least 24 px from the bottom-right corner, and the footer keeps bottom padding taller than the button so its last row is never covered.
- `WHATSAPP_CLICK`, `MAP_CLICK`, `PAGE_VIEW` and `ROOM_VIEW` events are sent only when `hasConsent('analytics')` is true (see Cookie consent).

## Rates

`lib/public/rates.ts` derives "Desde $ 120.000 COP/noche" from the published types with a rate (nightly rates first; an `OTHER` unit never feeds a "desde" claim). A type without a rate shows "Consultar tarifa" with "Te la confirmamos al consultar tus fechas." The room type page adds "El precio final y la disponibilidad se confirman directamente con el hotel."

## Images

- Photos use `components/site/picture.tsx`: a `<picture>` with the API's pre-generated AVIF and WebP variants (480, 640, 750, 960, 1280 and 1920 px, never above the source width), intrinsic size against CLS, and the blur + dominant colour placeholder. There is no runtime optimizer ([ADR 0011](adr/0011-public-rendering-and-images.md)).
- The `sizes` of every slot live in `lib/public/image-sizes.ts` and match the rendered width measured from 360 to 1920 px (`image-sizes.test.ts`), so phones pick the 640/750 files and thumbnails the 480 one. When a layout changes, update the matching entry and its measurements.
- The LCP photo of each page (first hero slide, first room card, main room photo, first gallery photo) is `priority`: eager, `fetchpriority=high` and a `<link rel=preload>` of the same srcset. Later hero slides and the room thumbnails load after the page `load` event.
- Media are served from `S3_PUBLIC_URL` (the bucket or a CDN), a separate origin. Media uploaded before a width was added get it with `pnpm --filter @hotel-bambu/api media:variants` (README). Performance notes and the CDN recommendation are in [seo.md](seo.md#performance-mobile).

## Map

`MapEmbed` shows a static placeholder until the visitor clicks "Cargar mapa", or loads directly when functional consent exists (server-rendered from the cookie). Withdrawing that consent unloads it. The Google Maps iframe may set third-party cookies (requirement 17.5). "Cómo llegar" always links to Google Maps, using the admin `mapUrl` or a directions URL from the coordinates.

## Cookie consent (requirement 17.5)

`components/consent/consent-manager.tsx` (in-house, no CMP; [ADR 0012](adr/0012-consent-csp-and-quality-gates.md)):

- **Banner.** On a first visit, a server-rendered banner offers three buttons of identical style: "Aceptar todas", "Rechazar no esenciales" and "Configurar preferencias". It links to the cookie and data policies.
- **Preferences dialog.** A native `<dialog>` with switches: necessary (always on), functional (the map) and analytics (the aggregated counter). Marketing is prepared but never granted: there is no marketing technology.
- **Storage.** The decision is saved in `hb_consent` (versioned JSON, 180 days, `SameSite=Lax`, `Secure` over https). Evidence goes to `POST /api/v1/public/consents` with a random id, the categories and the version. No IP is sent.
- **Asking again.** Changing `CONSENT_POLICY_VERSION` in `lib/consent/consent.ts` shows the banner again to everyone.
- **Footer.** "Configurar cookies" in the footer and on `/legal/cookies` reopens the dialog.

## SEO (requirement 19)

Metadata limits, canonicals, Open Graph, JSON-LD (`Hotel` with `makesOffer`, `HotelRoom`, `BreadcrumbList`; no `FAQPage`), sitemap, robots and the redirect audit are described in [seo.md](seo.md). Error pages are in Spanish and branded: `(site)/error.tsx` and `app/global-error.tsx`.

## Security headers

A per-request CSP nonce comes from `proxy.ts`. Static headers come from `next.config.ts`. See [security.md](security.md).

## Motion

- **CSS only** (no animation library). `MotionBoot` adds `.js-motion` after hydration, so content stays visible without JS; elements already on screen are marked visible first, so nothing above the fold flashes. Fade-up reveals, staggered cards, the self-drawing leaf on kickers, the header turning solid on scroll, the FAB entrance, card hover zoom, the lightbox fade and the hero title rise (a CSS keyframe) are all CSS.
- Every animation sits under `prefers-reduced-motion: no-preference`; with reduced motion the carousel also starts paused.
- The hero carousel rotates every 5.5 s with a pause button (`aria-pressed`), previous/next, swipe and a "01 / 03" index; focus inside it pauses the rotation, inactive slides are `inert`, and a single slide shows no controls.

## Accessibility

- Skip link to `#contenido`, plus landmarks (header, nav, main, footer).
- One H1 per page, followed by ordered H2/H3.
- Visible focus ring (green on light surfaces, gold on dark).
- The mobile menu and the lightbox are modal: focus moves in and is trapped, Escape and the backdrop close them, the rest of the page is `inert`, and focus returns to the control that opened them.
- Alt text comes from media (required at upload).
- Touch targets are at least 44 px.

## Tests

Vitest covers, among others:

- rates, the CTA rule, the trust strip, room-type labels, filters and leads
- WhatsApp links (number, greeting, room type)
- the carousel reducer, `HeroCarousel`, `MobileMenu`, `PhotoGallery` and the lightbox
- image `srcset` and the `sizes` of every slot (`image-sizes.test.ts`)
- page SEO, metadata limits, JSON-LD builders, sitemap, robots and the redirect map
- the revalidation handler (401/400/503/200, constant-time compare)
- consent cookie versioning and serialization
- the CSP builder and the proxy

Playwright (`e2e/`, `pnpm e2e`) covers:

- home order, trust strip and chips; rooms, room type pages and the gallery lightbox
- contact CTAs: WhatsApp with a number, phone fallback without one, header overflow on phones
- consent (reject leaves no map, functional consent loads it, analytics events only with consent)
- admin edits visible on the public site (revalidation), the admin dashboard, drawer and switches
- the three 301s, merged pages, one H1 per page, footer NAP = JSON-LD
- 404, headers, robots/sitemap, and legal `noindex`
- axe on every public page and every admin page, desktop and mobile

Lighthouse CI: `pnpm lighthouse`, budgets in `lighthouserc.json`.
