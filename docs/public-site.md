# Public site (`apps/web/app/(site)`)

Spanish (es-CO) public pages for visitors. Requirements 4, 5, 8, 17.5–17.6 and 21 apply. The design follows direction A, "Refugio sereno" (`docs/design/art-direction.md`). Every piece of hotel content comes from `GET /api/v1/public/*`, and interface strings live in `lib/i18n/es.ts`. A block whose data is missing is not rendered; no block is ever shown empty.

## Routes

| Route | Content |
|---|---|
| `/` | Narrative home. Sections follow the order and enabled flags in admin › Contenido: hero, about (only with text), room types (individual / pareja…), services band (highlighted services + amenities in every room), gallery teaser, location (only with an address or coordinates), FAQ (`showOnHome`), closing CTA with contact details |
| `/habitaciones` | All published rooms, filterable with `?tipo=individual\|pareja\|doble\|familiar` |
| `/habitaciones/[slug]` | Detail: photos + lightbox, rate box, WhatsApp message that names the room, beds/area, amenities, current promotions, other rooms. Old slug → 308 to the current one; unknown → 404 |
| `/servicios`, `/galeria` (`?categoria=`), `/ubicacion`, `/preguntas-frecuentes`, `/politicas-del-hotel`, `/contacto` | Inner pages |
| `/legal/{tratamiento-de-datos,aviso-de-privacidad,cookies}` | Legal templates filled from the hotel profile; draft banner and `noindex` until `LEGAL_APPROVED=true` ([legal-checklist.md](legal-checklist.md)) |
| `/robots.txt`, `/sitemap.xml` | Per request: `Disallow: /` unless `SITE_INDEXABLE=true`; sitemap lists public pages + published rooms (`lastModified`) |
| any other URL | Branded 404 inside the site shell (rooms, WhatsApp), via `app/(site)/[...missing]` |
| `POST /api/revalidate` | On-demand revalidation (see ADR 0011) |

## Data and caching

`lib/public/api.ts` defines the loaders. The site profile is required. Every other list is optional: a failure is logged and the page renders without that block. Responses are tagged with `CACHE_TAGS` and invalidated by the API through `/api/revalidate`. See [ADR 0011](adr/0011-public-rendering-and-images.md).

## WhatsApp (requirement 5)

- `lib/public/whatsapp.ts#whatsAppLink(site, context)` renders the admin template for the given context (`GENERAL`, `ROOM` with `{{habitacion}}`, `PROMOTION` with `{{promocion}}`). It then calls the shared `buildWhatsAppUrl`. When no valid number is configured it returns `null`, and every CTA (header, hero, cards, detail, contact, floating button) is hidden.
- Links open in a new tab with `rel="noopener noreferrer"`. Button text is dark on `#25D366`.
- `WHATSAPP_CLICK`, `MAP_CLICK`, `PAGE_VIEW` and `ROOM_VIEW` events are sent only when `hasConsent('analytics')` is true (see Cookie consent).

## Rates

`formatRoomPrice` produces text like "Desde $ 120.000 por noche, impuestos incluidos" (`Intl.NumberFormat('es-CO')`, COP, no decimals). A room without a rate shows "Consulta la tarifa por WhatsApp" (or "…con el hotel" when WhatsApp is not configured). The room detail page and the footer add "El precio final y la disponibilidad se confirman por WhatsApp."

## Map

`MapEmbed` shows a static placeholder until the visitor clicks "Cargar mapa", or loads directly when functional consent exists (server-rendered from the cookie). Withdrawing that consent unloads it. The Google Maps iframe may set third-party cookies (requirement 17.5). "Cómo llegar" always links to Google Maps, using the admin `mapUrl` or a directions URL.

## Cookie consent (requirement 17.5)

`components/consent/consent-manager.tsx` (in-house, no CMP; [ADR 0012](adr/0012-consent-csp-and-quality-gates.md)):

- **Banner.** On a first visit, a server-rendered banner offers three buttons of identical style: "Aceptar todas", "Rechazar no esenciales" and "Configurar preferencias". It links to the cookie and data policies.
- **Preferences dialog.** A native `<dialog>` with switches: necessary (always on), functional (the map) and analytics (the aggregated counter). Marketing is prepared but never granted: there is no marketing technology.
- **Storage.** The decision is saved in `hb_consent` (versioned JSON, 180 days, `SameSite=Lax`, `Secure` over https). Evidence goes to `POST /api/v1/public/consents` with a random id, the categories and the version. No IP is sent.
- **Asking again.** Changing `CONSENT_POLICY_VERSION` in `lib/consent/consent.ts` shows the banner again to everyone.
- **Footer.** "Configurar cookies" in the footer and on `/legal/cookies` reopens the dialog.

## SEO (requirement 19)

- **Per-page metadata.** Every page builds its canonical, Open Graph and Twitter card with `lib/seo/metadata.ts#pageMetadata`. Room pages use the room cover; other pages use `public/brand/og-default.png` (1200×630, generated from the brand).
- **JSON-LD** (`lib/seo/json-ld.ts`, only fields the hotel filled in):
  - `Hotel` on `/` and `/ubicacion`
  - `HotelRoom` on room pages, wrapped in an `Offer` only when a rate exists
  - `BreadcrumbList` on inner pages (`PageHeader path`)
  - `FAQPage` on `/preguntas-frecuentes`
- **Old room slugs** answer 308, a permanent redirect ([ADR 0011](adr/0011-public-rendering-and-images.md)).
- **Errors.** Error pages are in Spanish and branded: `(site)/error.tsx` and `app/global-error.tsx`.

## Security headers

A per-request CSP nonce comes from `proxy.ts`. Static headers come from `next.config.ts`. See [security.md](security.md).

## Motion

- **CSS first.** `MotionBoot` adds `.js-motion` after hydration, so content stays visible without JS. Fade-up reveals, staggered cards, the self-drawing leaf on kickers, the header turning from transparent to solid, the FAB entrance, card hover zoom and the lightbox fade are all CSS.
- **GSAP 3.15** (free standard licence, plugins included) is used only in client components on the home page: the hero title (SplitText, lines with masks) and the "Sobre nosotros" photo swap (ScrollTrigger, desktop only).
- Every animation is gated by `prefers-reduced-motion: no-preference` / `gsap.matchMedia()`.
- The desktop hero cross-fade (6 s) has a pause button.

## Accessibility

- Skip link to `#contenido`, plus landmarks (header, nav, main, footer).
- One H1 per page, followed by ordered H2/H3.
- Visible focus ring.
- The mobile menu and lightbox use native modal `<dialog>` (focus trap, Esc).
- Alt text comes from media.
- Touch targets are at least 44 px. `inert` is set on the hidden floating button.

## Tests

Vitest covers:

- price formatting
- WhatsApp messages with room/promotion context
- the revalidation handler (401/400/503/200, constant-time compare)
- consent cookie versioning and serialization
- the CSP builder and the proxy
- JSON-LD builders and escaping
- media `srcset`, map links and room-type grouping

Playwright (`e2e/`, `pnpm e2e`) covers:

- home, rooms and room detail
- the WhatsApp CTA (number and room name)
- consent (reject leaves no map, functional consent loads it, analytics events only with consent)
- admin FAQ edit → visible on the public site
- admin redirect
- reduced motion
- 404, headers, robots/sitemap, and legal `noindex`
- axe on 11 pages plus the consent UI

Lighthouse CI: `pnpm lighthouse`, budgets in `lighthouserc.json`.
