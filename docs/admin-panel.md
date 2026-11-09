# Admin panel (`apps/web/app/admin`)

Private, Spanish-language panel for hotel staff (requirements 9, 10, 18.2). Code and comments are in English. The API is the authority for sessions, CSRF, publication rules and permissions ([ADR 0008](adr/0008-auth-sessions-csrf.md), [API reference](api.md)); the panel only mirrors validation for fast feedback.

## Routes

Navigation (`components/admin/admin-shell.tsx`, grouped, Spanish): Resumen · **Hotel** (Datos del hotel, Ubicación y lugares cercanos) · **Habitaciones** (Tipos de habitación, Habitaciones, Comodidades) · **Contenido** (Secciones de la portada, Carrusel principal, Galería, Fotos y medios, Políticas y preguntas, Redes sociales) · **Usuarios** (Usuarios, Roles) · **Cuenta** (Mi cuenta). Only the sections the role may open are listed; a group left empty is hidden. The user block shows the role name.

| Route | Content |
|---|---|
| `/admin/login` | Login on the brand panel (generic error on any credential failure) |
| `/admin` | "Resumen": content-readiness KPIs (published room types and how many have a rate, photos with alt text, profile completeness, WhatsApp configured), the "Antes de publicar" checklist (9 items computed from real data in `lib/admin/readiness.ts`, each linking to the section that fixes it), recent activity from the audit log (`lib/admin/activity.ts`), 30-day aggregates. No bookings, occupancy or revenue (owner decision) |
| `/admin/hotel` | "Datos del hotel": profile (name, tagline, "Sobre nosotros", meta description), logo, contact, WhatsApp number and greeting (with a preview), location, check-in/out, opening hours, RNT. Sections are anchors (`#datos`, `#whatsapp`, `#ubicacion`, `#horarios`) for the checklist |
| `/admin/nearby-places` | "Ubicación y lugares cercanos": hotel location summary (edited in Datos del hotel) and the nearby places list |
| `/admin/room-types`, `/new`, `/[id]` | "Tipos de habitación" (ADR 0016): table (cards on phones) with an inline publish switch, rate or "Sin tarifa" link, order; create (images can be uploaded or chosen during creation and are stored in the same `POST`), edit (description, beds, amenities, rate `#tarifa`), images (order with up/down buttons, explicit "Usar como portada"; removing the cover hands it to the first image), status, delete, "Ver en el sitio" |
| `/admin/rooms` | Lightweight room list with an inline publish switch: number or name, type, status ("Inactivo" also means out of service), order, and "Comodidades de esta habitación" (owner review A9): the type's amenities are checked by default; unchecking one marks it as missing in that room, checking another ROOM amenity adds it to that room only ("Usar solo las del tipo" resets). Saved as `amenityOverrides` (only differences from the type are stored); the list shows "n comodidades distintas a su tipo" |
| `/admin/amenities` | One catalog; "Todas" is grouped by scope (Del hotel / De habitación), with scope filters |
| `/admin/content` | "Secciones de la portada": show/hide switches labelled by what they control since the home order is fixed in code (DB keys unchanged: SERVICES = amenities in the trust strip, FAQ = guest-info summary («Resumen de información para huéspedes»), CONTACT = final call to action); no order control |
| `/admin/hero-slides` | "Carrusel principal" (the single hero source): landscape and ≥1920 px guidance, warnings on portrait, small or unprocessed photos (also under the chosen image in the form); photos can be uploaded from the slide form |
| `/admin/media` | "Fotos y medios": upload (drag & drop, several files, alt text required per file, optional caption, optional gallery category), preview, edit alt/caption, delete (409 when in use), filter "sin texto alternativo" |
| `/admin/gallery` | Add from media, category, publish, featured, order, remove (media is kept) |
| `/admin/policies` | "Políticas y preguntas": policies and FAQ on one page (`#preguntas`; `/admin/faq` redirects here), `[DEMO]` texts flagged |
| `/admin/social` | Social links (footer) |
| `/admin/users` | "Usuarios": table (name, email, role, status, last login); create (email, name, role, initial password with show/hide and the policy hint), edit (name, role, active), reset password after a confirmation. The current user's role and status are locked with an explanation (their own password changes in Mi cuenta). Notes that a role change or deactivation closes the user's sessions. Read-only without `users.manage` |
| `/admin/roles` | "Roles": cards with description, user count and permission summary; the system role Administrador has a "Sistema" badge and is read-only. Create/edit with name, description and a permission checklist grouped by area ("Ver" / "Gestionar"; Gestionar checks and locks Ver; a warning when `users.manage` is granted). Delete only when unused (otherwise disabled with the reason) |
| `/admin/account` | Session info and role, change password (rotates the session and CSRF token) |

## Permissions

Roles and permissions: [ADR 0017](adr/0017-admin-roles-permissions.md). `lib/admin/access.ts` maps every route to the permission (any of) its API reads need; the same map filters the navigation, picks the first allowed section and filters the dashboard links. Every `(panel)` page starts with `requirePermission(...)` (`lib/admin/session.ts`): without the permission the user is redirected to the first section the role may open with `?acceso=denegado`, and the shell shows "Sección no disponible". `/admin` redirects quietly (it is the landing page after login). The session (`GET /auth/me`) is read once per request with React `cache`. The API stays the authority.

| Route | Permission |
|---|---|
| `/admin` | `dashboard.view`; readiness items and KPIs per area, recent activity and metrics with `activity.view` |
| `/admin/hotel`, `/admin/nearby-places`, `/admin/social` | `hotel.view` |
| `/admin/room-types`, `/[id]`, `/admin/rooms`, `/admin/amenities` | `rooms.view` (`/admin/room-types/new`: `rooms.manage`) |
| `/admin/content`, `/admin/hero-slides`, `/admin/gallery`, `/admin/policies` (`/admin/faq`) | `content.view` |
| `/admin/media` | `media.view` (the picker inside other forms also works with `hotel.manage`, `rooms.manage` or `content.manage`) |
| `/admin/users`, `/admin/roles` | `users.view` (changes: `users.manage`) |
| `/admin/account` | none |

## Data flow

- **Reads**: Server Components call `serverApi` (`lib/api/server.ts`) → `API_INTERNAL_URL/api/v1`, forwarding the incoming `cookie` header. A 401 redirects to `/admin/login`. Admin pages are `force-dynamic`; nothing private is cached.
- **Writes**: Client Components call `browserApi` (`lib/api/browser.ts`) → same-origin `/api/v1/*` (Next.js rewrite), so the browser sends `Origin`/`Sec-Fetch-Site` and the first-party cookie. Every unsafe method adds `x-csrf-token`: the token from `GET /auth/me` (set by `AdminProvider` in the panel layout), falling back to the readable `hb_csrf` cookie. A 401 sends the browser to `/admin/login?next=…`. After a mutation the page calls `router.refresh()` to re-render from the API.
- **Errors**: `ApiError { status, details[] }` (`lib/api/client.ts`). `applyApiError` maps 400/422 `details[].path` (e.g. `beds.0.count`) to react-hook-form fields and returns the rest as a Spanish message; `describeApiError` covers toasts (403 CSRF, 409 conflicts, 422 publication rules, 429). An error `code` wins over the message: 403 `PERMISSION_DENIED` → "No tiene permiso para realizar esta acción.", and the users and roles codes (`SELF_ROLE_CHANGE`, `LAST_ADMINISTRATOR`, `EMAIL_TAKEN`, `ROLE_IN_USE`…) have Spanish texts in `lib/forms/messages.ts`.
- **Guard**: `proxy.ts` (Next.js 16 name for middleware) only checks the presence of `hb_session` / `__Host-hb_session` for `/admin/*` (except the login page) and adds `X-Robots-Tag: noindex, nofollow` and `Cache-Control: private, no-store`. Real authorization stays in the API.

## Forms

- react-hook-form + `@hookform/resolvers/zod` with the **shared** schemas from `@hotel-bambu/shared` (Zod 4). `formResolver` (`lib/forms/resolver.ts`) adds Spanish messages: default Zod issues through `spanishErrorMap`, English custom messages from the schemas through `translateMessage` (`lib/forms/messages.ts`). Submit handlers receive the parsed output (`''` → `null`, dates coerced), which the API re-validates.
- Accessibility (18.3): every control has a `<label>`; hints and errors are linked with `aria-describedby`, invalid fields get `aria-invalid` and the first invalid field receives focus; ordering uses up/down buttons (no drag-and-drop dependency); confirmations use the native `<dialog>` (focus trap, Esc) and return focus; toasts live in an `aria-live` region; status is shown as text, not only color; skip link to the main content.
- Unsaved changes warn on page unload (`useUnsavedChangesWarning`).

## UI primitives

Local, dependency-free components in `components/admin/` on the mockup admin look (docs/design/mockup-design-spec.md §3: 260 px deep-green sidebar, 74 px white topbar, white 16 px cards, green/gray/gold status pills): `admin-shell.tsx` (sidebar, topbar breadcrumb, "Ver sitio"), `admin-drawer.tsx` (navigation drawer below 1000 px: modal, focus trap, Escape, backdrop, inert page), `publish-switch.tsx` (optimistic switch that reverts on API errors), `ui.tsx` (Button, Card, CardHeader, Badge, StatusBadge, Notice, PageHeader…), `fields.tsx` (Field, TextField, SelectField, CheckboxField, FormSection; 48 px inputs at 15 px regular, help text, icon + text errors; input borders use `--color-input-border`, 3.1:1), `feedback.tsx` (toasts + confirm), `media-picker.tsx` (`MediaPicker`: dialog with the tabs "Subir archivos" — default when the library is empty — and "Elegir de la galería"; only `READY` images with alt text are selectable; uploads are selected automatically, single pickers return them at once, multiple pickers add them to "Agregar (n)". `MediaField`: "Subir imagen" / "Elegir de la galería", then preview with "Reemplazar" / "Quitar" and optional warnings), `media-uploader.tsx` (`useMediaUploads` + `MediaUploader`, shared by the library and the picker: drag & drop or file input, client checks matching the API — JPG/PNG/WebP, 15 MB, alt text 1–250 characters — sequential uploads with a per-file status "Subiendo… / Procesando… / Subida", a repeated image (409) reuses the stored asset, polling until `READY`; logic in `lib/admin/media-upload.ts`; not a `<form>` because it renders inside other forms), `resource-manager.tsx` (generic CRUD list). Icons: `lucide-react`.

## Media previews

Embedded media (room types, gallery, hero slides, hotel logo) carries stored variant keys; the panel builds preview URLs with the same `S3_PUBLIC_URL` variable as the API (default `http://localhost:9000/hotel-media`), read by the panel layout on the server. It must be reachable from the browser.

## Tests

`pnpm --filter @hotel-bambu/web test` (Vitest; component tests opt into jsdom with `// @vitest-environment jsdom`): API client (CSRF only on unsafe methods, 401 hook, error details, FormData), error-to-field mapping and Spanish messages, proxy guard, login form, `ResourceManager` server-error mapping, readiness checklist and KPIs, activity wording, the navigation drawer (focus trap, Escape), the publish switch (API call, optimistic state, revert), the upload helpers and picker (upload tab, alt text required, single vs multiple, auto-selection) and the room-type creation with images, the room amenity overrides field, navigation filtering by permissions, the page gate, the dashboard with partial permissions, the permission checklist (Gestionar implies Ver) and the users and roles managers (self-protection, error codes, delete rules). The e2e suite covers the dashboard, grouped navigation, inline publish, section switches, the phone drawer, an Editor user who sees only its sections, and axe on every admin page.

## Local development

See the README section "Web dev in a Linux container" when Next.js cannot run on the host.
