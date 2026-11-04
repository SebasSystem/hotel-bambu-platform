# Admin panel (`apps/web/app/admin`)

Private, Spanish-language panel for hotel staff (requirements 9, 10, 18.2). Code and comments are in English. The API is the authority for sessions, CSRF, publication rules and permissions ([ADR 0008](adr/0008-auth-sessions-csrf.md), [API reference](api.md)); the panel only mirrors validation for fast feedback.

## Routes

| Route | Content |
|---|---|
| `/admin/login` | Login (generic error on any credential failure) |
| `/admin` | Dashboard: rooms by status, active services, current promotions, incomplete content, last change, 30-day aggregates |
| `/admin/hotel` | Profile, logo/hero image, contact, location, check-in/out, opening hours, RNT, ESCNNA notice |
| `/admin/whatsapp` | WhatsApp number and message templates (allowed variables, preview, test link) |
| `/admin/rooms`, `/new`, `/[id]` | List (order, publish/unpublish), create, edit (fields, beds, amenities, rate), images (order, cover), status, delete, "Ver en el sitio" |
| `/admin/amenities`, `/services`, `/promotions`, `/faq`, `/policies`, `/social` | Generic list + inline form (`ResourceManager`) with toggles, ordering and delete confirmation |
| `/admin/media` | Upload (alt text required), preview, edit alt/caption, delete (409 when in use), filter "sin texto alternativo" |
| `/admin/gallery` | Add from media, category, publish, featured, order, remove (media is kept) |
| `/admin/content` | Fixed landing sections (title, subtitle, text, CTA label, image, enabled) |
| `/admin/account` | Session info, change password (rotates the session and CSRF token) |

## Data flow

- **Reads**: Server Components call `serverApi` (`lib/api/server.ts`) → `API_INTERNAL_URL/api/v1`, forwarding the incoming `cookie` header. A 401 redirects to `/admin/login`. Admin pages are `force-dynamic`; nothing private is cached.
- **Writes**: Client Components call `browserApi` (`lib/api/browser.ts`) → same-origin `/api/v1/*` (Next.js rewrite), so the browser sends `Origin`/`Sec-Fetch-Site` and the first-party cookie. Every unsafe method adds `x-csrf-token`: the token from `GET /auth/me` (set by `AdminProvider` in the panel layout), falling back to the readable `hb_csrf` cookie. A 401 sends the browser to `/admin/login?next=…`. After a mutation the page calls `router.refresh()` to re-render from the API.
- **Errors**: `ApiError { status, details[] }` (`lib/api/client.ts`). `applyApiError` maps 400/422 `details[].path` (e.g. `beds.0.count`) to react-hook-form fields and returns the rest as a Spanish message; `describeApiError` covers toasts (403 CSRF, 409 conflicts, 422 publication rules, 429).
- **Guard**: `proxy.ts` (Next.js 16 name for middleware) only checks the presence of `hb_session` / `__Host-hb_session` for `/admin/*` (except the login page) and adds `X-Robots-Tag: noindex, nofollow` and `Cache-Control: private, no-store`. Real authorization stays in the API.

## Forms

- react-hook-form + `@hookform/resolvers/zod` with the **shared** schemas from `@hotel-bambu/shared` (Zod 4). `formResolver` (`lib/forms/resolver.ts`) adds Spanish messages: default Zod issues through `spanishErrorMap`, English custom messages from the schemas through `translateMessage` (`lib/forms/messages.ts`). Submit handlers receive the parsed output (`''` → `null`, dates coerced), which the API re-validates.
- Accessibility (18.3): every control has a `<label>`; hints and errors are linked with `aria-describedby`, invalid fields get `aria-invalid` and the first invalid field receives focus; ordering uses up/down buttons (no drag-and-drop dependency); confirmations use the native `<dialog>` (focus trap, Esc) and return focus; toasts live in an `aria-live` region; status is shown as text, not only color; skip link to the main content.
- Unsaved changes warn on page unload (`useUnsavedChangesWarning`).

## UI primitives

Local, dependency-free components in `components/admin/` (shadcn/ui-style classes on the brand tokens in `styles/tokens.css`): `ui.tsx` (Button, Card, Badge, PageHeader…), `fields.tsx` (Field, TextField, SelectField, CheckboxField…), `feedback.tsx` (toasts + confirm), `media-picker.tsx` (library picker; only `READY` images with alt text are selectable), `resource-manager.tsx` (generic CRUD list). Icons: `lucide-react`.

## Media previews

Embedded media (rooms, gallery, sections, hotel) carries stored variant keys; the panel builds preview URLs with the same `S3_PUBLIC_URL` variable as the API (default `http://localhost:9000/hotel-media`), read by the panel layout on the server. It must be reachable from the browser.

## Tests

`pnpm --filter @hotel-bambu/web test` (Vitest; component tests opt into jsdom with `// @vitest-environment jsdom`): API client (CSRF only on unsafe methods, 401 hook, error details, FormData), error-to-field mapping and Spanish messages, proxy guard, login form, `ResourceManager` server-error mapping.

## Local development

See the README section "Web dev in a Linux container" when Next.js cannot run on the host.
