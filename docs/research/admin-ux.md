# Admin panel UI/UX: diagnosis and redesign proposal (R1b)

Status: research + proposal (task R1b). Implementation is task R5c. Owner feedback: "the admin looks bad/basic".
Inputs: full-page Playwright captures of the local v1 admin at 1366 px desktop (dashboard, rooms list, room editor, media library), code in `apps/web/app/admin/(panel)/` and `apps/web/components/admin/`, requirements 9, 10, 18.2, 18.3.
Reference screenshots of third-party tools were **not** captured in this pass. The findings below come from public documentation (sources at the end). R1c added visual references in §6 and a visual spec in §7. Where §6.2 revises a point in §3, §6.2 takes precedence.

## 1. Diagnosis

The functional base is solid: accessible labels, `aria-describedby` errors, unsaved-changes warning, confirm dialogs, API-mirrored validation. The problems are information architecture, hierarchy and density, not plumbing.

| # | Area | Problem (observed) | Why it hurts non-technical staff |
|---|---|---|---|
| D1 | Navigation | 14 flat items with no grouping (`admin-shell.tsx`). "Comodidades" vs "Servicios" and "Medios" vs "Galería" are near-synonyms. | Users can't tell where things live. The amenity confusion the owner reported starts here. |
| D2 | Dashboard | 4 big serif counters ("16 / 0 / 3 / 0") with "Gestionar" links. "Contenido pendiente" lists only "16 habitaciones publicadas sin tarifa". The many empty hotel fields (address, phone, WhatsApp, check-in/out, map) are not mentioned, even though the site silently hides them. No quick actions, no recent changes. | The panel doesn't tell the hotel what to do next. The site is visibly incomplete, yet the dashboard looks "done". |
| D3 | Rooms list | 16 near-identical rows. The most prominent row action is an outlined **"Despublicar"** button. "Editar" is a small link. Ordering is only up/down arrows (moving room 16 to the top takes 15 clicks). "Sin tarifa" ×16 with no call to action. No search, filter (type/status) or bulk action (e.g. set rate for all "Pareja" rooms). | The visual weight is on a risky action. Repetitive work is done row by row. |
| D4 | Room editor | One ~2,500 px scroll with 7 bordered fieldsets. Status actions (Despublicar / Desactivar / **Eliminar**) sit together at the very top. **Two save models**: images have their own "Guardar imágenes" button (`room-images.tsx`), separate from the sticky "Guardar cambios". The technical `slug` field sits next to the name. Amenities are a flat, uncategorized checkbox list. There is no per-room publication checklist and no preview of how the room card looks. Image rows show long alt text as the label with small thumbnails. | Easy to save one half and lose the other. Delete sits next to everyday actions. No feedback on "what's missing to publish". |
| D5 | Media | The native file input renders the browser string **"Choose File No file chosen"** in English inside a Spanish UI (`media-library.tsx`). It takes one file at a time, with no drag-and-drop, although req. 9.7 asks for "ordenar (arrastrar)". The upload form fills the first screen and the library (36 items) starts below the fold, in only 3 columns of large cards. Photos of a staff member are shown with no "authorization pending" flag (`pendientes-hotel.md` C). | Uploading the hotel's photo set is tedious, and the library is hard to scan. |
| D6 | Visual language | A large display serif (page H1 around 44 px) is used for admin page titles and counters, the same as the marketing site. Low density, cream on white cards with weak separation, and legend-style fieldsets that look dated. Badges are tiny. | It reads as an unfinished marketing page rather than a tool. |
| D7 | Mobile | Below `md`, the sidebar collapses to a header toggle that expands the full 14-item list inline. The rooms table is wide. Row actions are small text links. | It's hard to update quickly from a phone, which hotel staff will do. |

(The mid-page "Guardar cambios" bar and the short sidebar in the full-page screenshots are capture artifacts of `sticky` elements. They are not layout bugs.)

What the v1 admin captures showed, in short: a full-height forest-green sidebar with 14 ungrouped links; a dashboard of four large serif counters (16 / 0 / 3 / 0) with "Gestionar" links and one pending item; a rooms table of 16 near-identical rows whose most prominent control is an outlined "Despublicar" button; a ~2,500 px room editor with seven bordered fieldsets and status actions grouped at the top; and a media page whose upload form fills the first screen, shows the English "Choose File / No file chosen" string, and pushes a 3-column grid of 36 items below the fold. The rows D1–D7 above are the detailed record. The image files (`admin-dashboard.png`, `admin-rooms.png`, `admin-room-edit.png`, `admin-media.png`) were transient evidence, deleted when the feature closes; see [`design-research.md` § Screenshot policy](./design-research.md#screenshot-and-copyright-policy).

## 2. Patterns from references

- **Grouped navigation** with collapsible sections: shadcn/ui `Sidebar` (`SidebarGroup` + `SidebarGroupLabel`, wrap in `Collapsible` to fold). It collapses to an icon rail and becomes an off-canvas `Sheet` on mobile. — [shadcn Sidebar](https://ui.shadcn.com/docs/components/radix/sidebar)
- **Setup checklist with progress**: Shopify Polaris "Setup guide" composition, an "interactive checklist with visual progress tracking". Each step has a heading, description and action button, with a progress indicator for overall completion. Shopify advises ≤5 visible steps, dismissible, and completable later. — [Polaris setup guide](https://shopify.dev/docs/api/app-home/patterns/compositions/setup-guide), [Shopify onboarding guidance](https://shopify.dev/docs/apps/design/user-experience/onboarding). Airbnb and Booking.com extranets use the same idea for listing completeness. Booking.com's own "Unknown" default for facilities pushes partners to complete data ([Hospitable](https://help.hospitable.com/en/articles/11152209-booking-com-managed-facilities)).
- **Categorized amenity editing**: Airbnb groups amenities in the listing editor (Your space → Amenities) by category, with "Essentials" as a one-click bundle ([Airbnb 2343](https://www.airbnb.co.uk/help/article/2343)). Booking.com separates property facilities from room facilities in the extranet "Facilities & services" ([SiteMinder guide](https://www.siteminder.com/r/trends-advice/hotel-management-tips-ideas/booking-com-extranet/)). Cloudbeds attaches amenities per accommodation type with custom entries allowed ([Cloudbeds](https://myfrontdesk.cloudbeds.com/hc/en-us/articles/360038464274)).
- **Accessible drag-and-drop sorting**: dnd-kit `@dnd-kit/sortable` with `KeyboardSensor` + `sortableKeyboardCoordinates` (arrow keys move to the nearest item), plus its accessibility announcements. The docs now label this API "Legacy" and point to a newer "Latest" package line (`@dnd-kit/react`). Choose one at implementation time and check its React 19 support. — [dnd-kit sortable](https://dndkit.com/presets/sortable)
- **Resource editor layout** (Shopify admin product page, Sanity/Payload document views): main column of section cards plus a right sidebar with status/visibility, organization and a preview link. One save bar appears when the form is dirty ("Cambios sin guardar · Descartar · Guardar"). Destructive actions go in a "danger zone" at the bottom.

## 3. Redesign proposal

### 3.1 Navigation IA (grouped, Spanish labels)

```
Resumen
HOTEL
  Información del hotel
  Servicios del hotel          (was "Servicios": hotel-level facilities)
  Políticas
  Preguntas frecuentes
HABITACIONES
  Habitaciones
  Equipamiento de habitaciones (was "Comodidades": room-level amenities)
  Promociones
SITIO WEB
  Contenido de la portada      (was "Contenido de la landing")
  Galería
  Biblioteca de fotos          (was "Medios")
CONTACTO
  WhatsApp
  Redes sociales
— footer: Ver el sitio ↗ · Mi cuenta · Cerrar sesión
```

Each item shows a small count or warning dot where something is incomplete (e.g. "Información del hotel •").

### 3.2 Dashboard

1. **"Lo que falta para completar el sitio"**: a setup checklist with a progress bar ("9 de 16 listos"). Each item deep-links to the exact field (`/admin/hotel#phone`). Items come from the panel-editable fields in `docs/pendientes-hotel.md`:
   - Hotel: address, municipality, map coordinates/link, how-to-arrive, phone, WhatsApp number, e-mail, check-in/out times, short + full description, logo, hero image, RNT (optional, "decisión del hotel").
   - Rooms: `[DEMO]` rooms still present (detect the `[DEMO]` prefix), rooms without a rate, rooms with fewer than 3 photos, rooms without a full description.
   - Content: policies (count 0), FAQ (count 0), social links (0), images without alt text, Wi-Fi charge unknown (from `amenity-model.md`).
   - Collapsed by default once complete. Optional items are shown as "opcional".
2. **Quick actions** row: Nueva habitación · Subir fotos · Editar tarifas · Mensajes de WhatsApp · Ver el sitio ↗.
3. **Status strip** (compact, sans-serif numbers): published / draft / inactive rooms, active promotions, highlighted services.
4. **Recent changes**: the last 5 `AuditLog` entries ("Habitación 101 publicada · hace 2 h").
5. Metrics card (secondary, existing 30-day aggregates).

### 3.3 Rooms list

- Compact table (desktop) / card list (mobile). Columns: drag handle · cover thumbnail · name + type · rate (or an inline **"Agregar tarifa"** link) · completeness ("5/6") · status badge · overflow menu (`DropdownMenu`: Editar, Ver en el sitio, Duplicar, Despublicar, Desactivar, Eliminar…). The whole row links to the editor, and there are no prominent per-row state buttons.
- Toolbar: search, filters (Tipo: Individual/Pareja; Estado), "Nueva habitación".
- Reordering: drag-and-drop (dnd-kit) plus the keyboard alternative (focus handle → Space → arrows → Space). Keep a "Mover a…" menu action for screen-reader users as a fallback. Save the order immediately with an undo toast.
- Bulk actions on selected rows: Publicar/Despublicar, **Establecer tarifa**, **Asignar equipamiento**. With 16 identical-spec rooms, this removes most of the repetitive work.

### 3.4 Room editor

Two-column layout (≥1024 px). Single column below that, with the sidebar cards first.

- **Main column**: section cards with a sticky in-page section nav (scroll-spy anchors). Tabs are avoided because they hide validation errors in other tabs.
  1. *General*: name, type, capacity, short + full description. The `slug` moves to a collapsed "Avanzado" disclosure together with SEO.
  2. *Fotos*: dropzone (multi-file, with a hidden native `<input type=file multiple>` whose label is Spanish), a sortable thumbnail grid (dnd-kit + keyboard), "Portada" as a star toggle on the thumbnail, and an alt-text field per photo with a missing-alt warning. Photo changes join the **same** dirty form and save bar (remove "Guardar imágenes").
  3. *Camas*: bed rows (as today).
  4. *Tarifa*: COP input with live formatting preview ("Se mostrará: Desde $120.000 por noche, impuestos incluidos"), unit, taxes, notes.
  5. *Equipamiento*: checkboxes **grouped by category** (Baño, Entretenimiento, Clima…, from `amenity-model.md`) in a 2–3 column grid. A read-only note lists the hotel services that apply to every room ("Wi-Fi en todo el hotel: se gestiona en Servicios del hotel"), so staff stop looking for Wi-Fi here.
  6. *Avanzado* (collapsed): slug with redirect note, SEO title and description with character counters and a Google snippet preview.
  7. *Zona de peligro*: Desactivar / Eliminar, with explanations.
- **Sidebar (sticky)**:
  - *Estado*: status badge, a primary "Publicar" or "Despublicar" button, "Ver en el sitio ↗".
  - *Para publicar*: a live checklist mirroring the API publication rule (name, slug, short description, capacity, cover with alt text), then *Recomendado* (rate, ≥3 photos, full description). Each item links to its field.
  - *Vista previa*: the actual public `RoomCard` component rendered with the form values.
- **Save bar**: appears only when dirty. "Cambios sin guardar · Descartar · Guardar cambios" (`Ctrl/⌘+S`).

### 3.5 Media library ("Biblioteca de fotos")

- Upload as a full-width dropzone at the top (drag files or "Elegir fotos"), multi-file with a per-file queue showing progress and processing status (`UPLOADING → PROCESSING → READY`). Alt text is requested per file in the queue. Files stay unpublishable until it is filled, as today.
- A denser grid (4–6 columns) with filter chips (Todas · Sin texto alternativo · Sin usar · En galería · En habitaciones) and search by alt text.
- Click opens a side `Sheet`: large preview, alt/caption edit, "Usada en: Habitación 101, Galería" (turning the current 409 into information), replace, delete.
- An optional "Requiere autorización" flag for photos with people (owner decision, `pendientes-hotel.md` C).

### 3.6 Forms, feedback, empty states

- Keep react-hook-form + shared Zod. Move help text under fields in muted 13–14 px. Required marks stay. Labels sentence case.
- Use `Switch` for on/off settings (active, highlighted), checkboxes for multi-select, and segmented controls for short enums (unit, charge).
- Empty states: icon, one sentence, one primary action ("Aún no hay promociones. Crea la primera para mostrarla en la portada. [Nueva promoción]").
- Toasts stay in the existing `aria-live` region. Undo for reorder and unpublish.
- Typography: a sans UI font for everything except an optional small serif brand wordmark. Page titles around 24–28 px. A neutral surface (white main and subtle gray-green sidebar or keep the forest sidebar) with clearer card borders. Status badges at least 12 px with text and an icon (not color only, 18.3).

### 3.7 Mobile

- Sidebar becomes a `Sheet` drawer with the grouped nav. A bottom sticky save bar. Tables become card lists. All touch targets ≥44 px. The room editor's sidebar cards move above the sections (status + checklist first).
- The most common phone tasks (change rate, publish/unpublish, upload photo, edit WhatsApp) are reachable in ≤2 taps from the dashboard quick actions.

## 4. Component choices

| Need | Choice | License | Notes |
|---|---|---|---|
| Primitives (tabs not used; dropdown menu, popover, collapsible, switch, sheet/dialog, tooltip) | **shadcn/ui** (copied source, Tailwind v4) on **Radix UI** primitives | MIT / MIT | Code lives in the repo (`components/admin/ui/*`). Only the imported Radix packages are bundled. Keep the existing native `<dialog>` confirm if preferred. |
| Sidebar | shadcn `Sidebar` block | MIT | Grouped and collapsible, with a mobile sheet. |
| Drag-and-drop sort (room images, rooms, gallery, services, FAQ) | **dnd-kit** (`@dnd-kit/core` + `@dnd-kit/sortable`, or the newer `@dnd-kit/react`) | MIT | Keyboard sensor + announcements. Always keep a non-drag alternative. Measure with `next build` output, as it loads only in admin route chunks. |
| File drop | Native drag events + `<input type=file multiple>` | — | No dependency needed. `react-dropzone` (MIT) only if edge cases pile up. |
| Command palette (optional) | `cmdk` via shadcn `Command` | MIT | "Ir a Habitación 203…". Nice to have, low priority. |
| Icons | `lucide-react` (already used) | ISC | |

Bundle and performance: the admin is a separate, authenticated route group, so these dependencies must not appear in public-site chunks. Verify with the Next.js build output and keep the public Lighthouse budgets (R6) unaffected. Update `docs/admin-panel.md`, which currently says "ordering uses up/down buttons (no drag-and-drop dependency)", to "drag-and-drop with keyboard alternative".

## 5. Top changes, prioritized

1. Grouped navigation with unambiguous names (D1).
2. Dashboard setup checklist driven by `pendientes-hotel.md` fields, plus quick actions (D2).
3. Room editor: one save model, sticky status/checklist/preview sidebar, slug/SEO under "Avanzado", danger zone (D4).
4. Categorized amenity checkboxes plus a note on hotel-wide services (D4 + amenity model).
5. Rooms list: overflow menu instead of a prominent "Despublicar", filters, bulk rate/amenity actions (D3).
6. Drag-and-drop ordering with a keyboard alternative (rooms, photos, gallery) (D3–D5, req. 9.7).
7. Media: multi-file Spanish dropzone with an upload queue, dense filterable grid, details sheet (D5).
8. Visual system: sans UI type, compact headers, readable badges, empty states, mobile drawer and card lists (D6–D7).

## Sources

- shadcn/ui Sidebar: https://ui.shadcn.com/docs/components/radix/sidebar
- Shopify Polaris setup guide: https://shopify.dev/docs/api/app-home/patterns/compositions/setup-guide · onboarding: https://shopify.dev/docs/apps/design/user-experience/onboarding
- dnd-kit sortable: https://dndkit.com/presets/sortable
- Airbnb amenities editing: https://www.airbnb.co.uk/help/article/2343
- Booking.com extranet (SiteMinder guide): https://www.siteminder.com/r/trends-advice/hotel-management-tips-ideas/booking-com-extranet/ · Facilities API: https://developers.booking.com/connectivity/docs/content-api-modules/facilities-api/introduction-to-facilities-api
- Hospitable on Booking.com facility defaults: https://help.hospitable.com/en/articles/11152209-booking-com-managed-facilities
- Cloudbeds accommodation types: https://myfrontdesk.cloudbeds.com/hc/en-us/articles/360038464274
- Not researched in depth (no primary docs fetched): Mews, Little Hotelier, Sirvoy, Linear. Their patterns above are covered by the cited equivalents. Their marketing pages were captured visually in R1c (§6).

## 6. Visual references (R1c)

Status: R1c, 2026-11-04. These screenshots ground the R1b proposal, which was written without visuals. They were captured with Playwright 1.64.1 (Docker image `mcr.microsoft.com/playwright:v1.64.1-noble`), viewport 1440×900, plus a full-page capture (capped at 3600 px) where useful. Under the project's single screenshot policy ([`design-research.md` § Screenshot policy](./design-research.md#screenshot-and-copyright-policy)), third-party screenshots are **never committed** and all screenshots are deleted when the redesign feature closes. The table therefore cites each source URL and describes what the capture showed; the file names are kept only as a note of the transient evidence. Use the sources as references only. Do not copy any of them.

### 6.1 Reference table

| Screenshot | Source | Pattern shown | Apply to Bambú? |
|---|---|---|---|
| `shadcn-dashboard01.png` | https://ui.shadcn.com/view/new-york-v4/dashboard-01 | Light neutral sidebar with a "Quick Create" primary button on top, small grey group labels ("Documents"), and secondary links (Settings/Help/Search) pinned to the bottom. KPI cards use ~32 px **sans** numbers with a trend pill and a one-line explanation. The data table has a drag handle, checkbox and row "⋮" menu. | **Yes.** Use it for the sidebar structure, a "Nueva habitación" quick action, and the rooms table (handle + checkbox + overflow menu). |
| `shadcn-sidebar07.png`, `shadcn-sidebar08.png`, `shadcn-sidebar03.png` | https://ui.shadcn.com/view/new-york-v4/sidebar-07 (and -08, -03) | Grouped sidebar with collapsible sections. Variant 08 is the **inset** variant: the sidebar sits on a tinted page and the content is a white rounded panel. The panel header has a collapse toggle and a breadcrumb. Variant 03 shows long grouped lists with indented children. | **Yes.** Use the inset variant: a sand-tinted shell with a white content panel and a breadcrumb in the panel header ("Habitaciones › Habitación 101"). |
| `shadcn-tasks.png` | https://ui.shadcn.com/examples/tasks | Table toolbar with a search input, dashed "+ Status" and "+ Priority" facet filter buttons, a "View" column toggle, and a primary "Add Task" on the right. Status is shown as icon + text. | **Yes.** Rooms list toolbar: search, "+ Tipo", "+ Estado", "Nueva habitación". |
| `catalyst-demo.png`, `catalyst-orders.png` | https://catalyst-demo.tailwindui.com/ (and /orders) | Very calm UI: light grey sidebar, white rounded content panel, a ~20 px semibold page title (not a hero), and a single dark primary button top-right. Stats are separated by hairline rules rather than boxed cards, with small coloured delta badges. Tables have no zebra striping, only 1 px row dividers and generous 56 px rows. | **Yes.** This is the closest match to the tone Bambú needs: quiet, few borders, one primary action per page. Use it for page headers and for the dashboard status strip (hairline-separated, not 4 big cards). |
| `catalyst-settings.png`, `catalyst-settings-full.png` | https://catalyst-demo.tailwindui.com/settings | Settings form with a **two-column row** per field (label + help text on the left, control on the right) divided by hairlines. "Reset" and "Save changes" sit at the bottom right. Content is capped at ~900 px wide. | **Yes.** Use it for "Información del hotel", "WhatsApp" and "Redes sociales". It is far easier to scan than the current stacked fieldsets. |
| `tremor-dashboard.png` | https://dashboard.tremor.so/overview | Usage meters: label, a value like "48.1/100M", a thin progress bar, and a one-line footer with an inline action link ("Manage plan"). The sidebar has a workspace switcher and a "Shortcuts" group. | **Yes.** Use the meter row for the setup checklist summary ("Información del hotel 6/12", "Habitaciones con tarifa 0/16") and an "Atajos" group in the sidebar. |
| `tremor-details.png`, `tremor-settings.png` | https://dashboard.tremor.so/details | Dense 40 px table rows, small bordered status badges (Live/Inactive/Archived) and a "…" edit column. The toolbar has facet buttons, search, and Export/View. | **Partly.** The density suits a 16-room list, but use 48–52 px rows for touch. |
| `polaris-setup-guide.png` | https://shopify.dev/docs/api/app-home/patterns/compositions/setup-guide | Text spec for the setup guide: interactive checklist, progress indicator, expandable steps. The live preview iframe did not render headless. | **Yes**, as the textual spec. The visual model is the next row. |
| `dribbble-checklist-1.png` | https://dribbble.com/shots/26191357-Onboarding-checklist-for-a-fintech-dashboard | "Welcome! Let's get you started" card with a segmented progress bar and "20% Complete". Steps are numbered, each with a title and a one-line description. A completed step is struck through and shows a check. The hovered step gets a tinted background and a "→". | **Yes. This is the model for "Lo que falta para completar el sitio":** numbered or checked rows, one sentence each, the whole row is a link, and a segmented bar. |
| `dribbble-room-1.png` | https://dribbble.com/shots/26219804-Guesty-l-Hotel-room-management-dashboard | Hotel rooms listing: a large 16:10 room thumbnail (~115 px) per row, name with room number, price "/ night", status badge, and edit/view/⋮ icon actions. A status summary row (Available/Occupied as %) sits above the list. | **Yes.** It confirms a bigger cover thumbnail with name + type, "Desde $X / noche", and icon/overflow actions instead of a "Despublicar" button. Skip the occupancy KPIs, since Bambú has no bookings. |
| `dribbble-room-2.png` | https://dribbble.com/shots/23548284-Hotel-Management-Room-Rates | Room rates grouped by room type, with in-page tabs (General, Room rates, Cancellation…). The sidebar is grouped into "Daily operations", "Documents", "External sales" and "Inhouse", each with a small label. | **Yes.** Grouping rates by **type** (Individual / Pareja) supports the bulk "Establecer tarifa" action. The sidebar grouping mirrors §3.1. |
| `dribbble-hoteladmin-1.png`, `dribbble-hoteladmin-2.png`, `dribbble-hotel-admin*.png`, `dribbble-pms*.png`, `behance-hotel-admin*.png`, `behance-hotel-1.png` | Dribbble/Behance searches "hotel admin dashboard" and "property management dashboard" | The genre's norm: pastel KPI tiles, donut charts, occupancy calendars, purple/blue accents. | **No, counter-reference.** These are booking-centric dashboards built on metrics Bambú does not have. They show that a pretty dashboard is not a useful one here. Bambú's dashboard should be a **to-do list**, not charts. |
| `dribbble-productedit-1.png` | https://dribbble.com/shots/25973794-MatDash-Product-Page-UI-Add-Edit | Resource editor: a main column of section cards (Inventory, Shipping) and a narrow right column of cards (Thumbnail, a Status select with a green dot, product details and categories). | **Yes.** It visually confirms §3.4: room sections on the left, and Estado / Para publicar / Vista previa on the right. |
| `dribbble-cmsmedia-1.png` | https://dribbble.com/shots/26809044-Media-Library-OTT-Dashboard-UI | Media library as a table: thumbnail, name, tags, created date, status badges (Pending/Failed/Completed) and type tabs (Videos/Audio/Images). The "Upload" button sits in the header instead of an upload form. | **Partly.** Take the **status badge per upload** (Procesando / Lista / Error) and the upload button in the header. Use a grid, not a table, for photos. |
| `dribbble-medialib-2.png` | https://dribbble.com/shots/27820108-Refined-Media-Library-folders-for-WordPress-media | WordPress-style media grid: 5 columns of square tiles with a caption overlay, a left filter rail with counts ("Show all media 225", "Media without folder 114"), and a grid/list toggle. | **Yes.** Use filter chips with counts ("Sin texto alternativo 7", "Sin usar 12") and a 5-column square grid at 1440 px. |
| `payload-home*.png`, `sanity-studio*.png`, `directus-home*.png`, `strapi-home*.png` | payloadcms.com, sanity.io/studio, directus.io, strapi.io (marketing pages) | CMS document editors: stacked label-over-input fields, a slug field with a "Generate" button, a "Published" status pill at the top, a live preview beside the form, and collection lists with drag handles. | **Partly.** Put a status pill at the top of the editor. **Generate** the slug from the name (Sanity's "Generate"), which supports hiding it under "Avanzado". The dark themes do not apply. |
| `mews-pms-full.png` | https://www.mews.com/en/property-management-system | The PMS UI shown in Mews's marketing: room numbers in a left column with **coloured status dots**, a right detail panel (drawer) for the selected item, a light UI, and one accent colour. | **Partly.** Use the detail side panel for the media `Sheet`, and status dot + label. |
| `littlehotelier-full.png`, `sirvoy-full.png`, `lodgify.png`, `cloudbeds-pms-full.png` | littlehotelier.com, sirvoy.com, lodgify.com, cloudbeds.com/property-management-system | Small-hotel software is shown as calendars and light UIs with a single brand accent. Lodgify's app uses a light sidebar with a yellow active pill. Little Hotelier uses a top tab nav. | **Context only.** These confirm that small-property tools stay light and plain. None of them shows a content or room editor publicly. |
| `airbnb-help-2343*.png` | https://www.airbnb.com/help/article/2343 | Text only: Listing editor → Your space → Amenities → "Add +" / "Edit" → "Done". The public page has no UI screenshot. | The flow is confirmed, but there is no visual. |
| `shadcn-blocks*.png`, `tremor-home*.png` | ui.shadcn.com/blocks, tremor.so | Block gallery and component marketing pages. | Index only. |

**Blocked or unusable captures:**

- **Pinterest** (`pinterest-hotel-admin.png`) shows a login modal over the results, so only blurred thumbnails are visible.
- **Tailwind Plus application shells** (`tailwindcss.com/plus/...`) redirect to a login page. The public Catalyst demo was used instead.
- **React-admin demo** (`marmelab.com/react-admin-demo`) requires a login, so it was not used under the "no logins" rule.
- **Refine** (`example.refine.dev`) now serves a storefront, not the admin.
- **shadcn:** `ui.shadcn.com/examples/dashboard` redirects to the homepage (the `/view/new-york-v4/dashboard-01` block works instead), and `/examples/forms` returns 404.
- **Shopify Polaris:** the legacy `polaris-react.shopify.com/patterns/*` pages redirect to a generic references index, and the setup-guide live preview did not render headless.
- **Shopify Help:** the product page shows only a YouTube embed.
- **Booking.com:** the partner help URL returned 404.
- **Cloudbeds:** the marketing page is mostly covered by a cookie banner and a chat panel. Only one small calendar mock is visible.
- **Behance** returned HTTP 403 but still rendered the results.

62 screenshots were captured. About 22 are directly useful: the rows marked **Yes** or **Partly** above.

### 6.2 What the visuals change in the proposal

1. **The sidebar becomes light instead of forest green.** Every calm, credible reference (shadcn, Catalyst, Tremor, Lodgify, Mews) uses a light sidebar with a tinted active item. Bambú's full-height forest sidebar (`admin-dashboard.png`) is the heaviest element on every screen and makes the 14-item list feel louder.
   - **Revision:** a `sand-50` shell with a light sidebar and a white **inset** content panel (shadcn sidebar-08, Catalyst).
   - Brand presence comes from the wordmark, the bamboo active state and the primary buttons.
   - This supersedes the "keep the forest sidebar" option in §3.6.
2. **The dashboard leads with the checklist and drops the counter cards.** The Dribbble and Behance hotel dashboards show that big KPI tiles turn into decoration when there are no bookings.
   - **Revision:** remove the four counter cards.
   - The top of "Resumen" becomes the onboarding checklist card (`dribbble-checklist-1`), with a segmented progress bar and numbered rows that deep-link to the exact field.
   - Below the checklist come a Catalyst-style hairline stats strip (4 small sans numbers) and a Tremor-style meter row per area.
   - §3.2 already put the checklist first. This change turns the counters into a strip instead of cards.
3. **Page headers shrink.** Every reference uses a 20–24 px sans semibold title, an optional one-line description, and the primary action aligned right.
   - **Revision:** a fixed 24 px title (not the `2xl` clamp, which grows to 32 px).
   - Drop the serif from the panel, except for the wordmark.
   - Keep descriptions to one line.
4. **The rooms list gets a bigger thumbnail and no text buttons.** `dribbble-room-1` and `shadcn-dashboard01` confirm the row layout:
   - a 72×48 px cover image;
   - the name with the type on a subline;
   - "Desde $120.000 / noche", or an "Agregar tarifa" link when there is no rate;
   - a status badge, an icon "Ver ↗" link and a "⋮" menu.
   - **Revision:** rows are 56 px tall, and the facet filters are dashed "+ Tipo" and "+ Estado" buttons, as in shadcn tasks.
5. **The room editor follows `dribbble-productedit-1`, which matches §3.4 exactly.** Two additions:
   - A status **pill + "Publicar" button in the panel header** (the CMS pattern), not only in the sidebar card.
   - The slug is generated from the name automatically, with an "Editar" option under "Avanzado" (as in Sanity's "Generate").
6. **Hotel info, WhatsApp and social links use the Catalyst settings layout.** These pages switch to two-column rows (label + help on the left, control on the right) with hairline dividers and a ~960 px max width. This replaces the stacked bordered fieldsets.
7. **The media library loses its upload form card.** Upload becomes a header button plus a page-wide drop target.
   - Photos sit in a 5-column square grid with filter chips that show counts.
   - The upload queue shows a status badge per file (`dribbble-cmsmedia-1`).
   - Selecting a tile opens a right `Sheet`, like Mews's detail panel.

## 7. Visual spec (admin panel, desktop-first, responsive)

### 7.1 Layout grid

- **Shell:**
  - Background `sand-50`.
  - The sidebar is a fixed 248 px. At ≥1024 px it can collapse to a 56 px icon rail. Below 1024 px it becomes an off-canvas `Sheet`.
  - The content panel is inset 8 px from the top, right and bottom, with `radius.lg` (16 px), a white background, a 1 px `border` (sand-200) and no shadow.
- **Panel header:** 56 px tall, sticky, with a bottom hairline.
  - Left: the sidebar toggle and the breadcrumb.
  - Right: "Ver el sitio ↗" as a ghost button.
- **Page container:**
  - Padding is 32 px on desktop and 16 px on mobile.
  - Max width is 1200 px for lists and the dashboard, and 960 px for settings forms.
  - The room editor uses a 12-column grid with 24 px gutters: an 8-column main column and a 4-column side column (min 320 px). The side column is sticky at `top: 72px`.
- **Vertical rhythm:** 4 px base unit. Use a 32 px section gap, 20 px card padding (24 px at ≥1280 px) and a 16 px gap between fields.
- **Breakpoints:**
  - Below 640 px (phone): single column, card lists, and a bottom sticky save bar.
  - 640–1023 px (tablet): single column with the sheet nav.
  - 1024 px and up (desktop): sidebar plus the two-column editor.

### 7.2 Sidebar style

- **Background:** `sand-50`, the same as the shell, with no border. The white panel provides the separation.
- **Top:** the wordmark "Hotel Bambú Plaza" in **Fraunces 18 px semibold**, which is the only serif in the panel. Below it, "Panel de administración" in 12 px `muted-foreground`.
- **Group labels:** 12 px medium in `muted-foreground` (ink-600, 5.9:1 on sand-50) with a 24 px top margin. Use sentence case, not uppercase kicker tracking.
- **Items:** 36 px tall (44 px on touch), 14 px medium in `foreground`, with a 16 px lucide icon in ink-600 and `radius.sm`.
  - Hover: `sand-100`.
  - **Active:** `accent` background (bamboo-100), `accent-foreground` text (bamboo-900, 10.6:1), the icon in bamboo-700, and `aria-current="page"`.
- **Status markers:** either an 8 px `earth-600` dot with an `sr-only` "incompleto" label, or a count badge (12 px, `secondary`).
- **Footer:** the user email (12 px muted), then "Mi cuenta" and "Cerrar sesión" as items.
- **Optional "Atajos" group:** Nueva habitación and Subir fotos.

### 7.3 Typography (admin)

- **Sans:** Manrope, already loaded for the public site. Use `font-variant-numeric: tabular-nums` for tables, prices and counters.
- **Scale:** fixed rem values, with no clamps in the admin.

| Role | Size / line-height | Weight |
|---|---|---|
| Page title | 24 / 32 px | 600 |
| Card or section title | 16 / 24 px | 600 |
| Body, inputs, table cells | 14 / 20 px | 400 (cells), 500 (primary cell) |
| Labels | 14 / 20 px | 500 |
| Help text, meta, group labels | 13 / 18 px (`xs` token) | 400 |
| Badges | 12 / 16 px | 500 |
| Stat numbers | 24 / 32 px | 600, tabular |

- Fraunces appears only in the sidebar wordmark and in the public `RoomCard` preview.

### 7.4 Colour roles (from `docs/design/tokens.json`)

| Role | Token | Notes and measured contrast |
|---|---|---|
| Shell and sidebar background | `background` (sand-50 `#F7F3EA`) | |
| Content panel, cards, popovers | `card` (white) | |
| Text | `foreground` (ink-900) | 15.1:1 on sand-50 |
| Secondary text, help, icons | `muted-foreground` (ink-600 `#56605A`) | 5.9:1 on sand-50; 5.3:1 on sand-100 |
| Primary action, links, focus ring | `primary` bamboo-700, hover bamboo-600, `ring` bamboo-600 | White on bamboo-700 is 7.3:1. Use **one** primary button per view. |
| Active nav, selected rows, "listo" badge | `accent` bamboo-100 with `accent-foreground` bamboo-900 | 10.6:1 |
| Hover and subtle fills, table header | `muted` / `secondary` (sand-100) | |
| Card borders, dividers | `border` (sand-200) | Decorative only: 1.55:1 on white. |
| **Input and checkbox borders** | **New token: `input` → `#8F8670`** (proposed as `sand-500`) | sand-200 fails the WCAG 1.4.11 3:1 rule for control boundaries. `#8F8670` gives 3.61:1 on white and 3.26:1 on sand-50. R5c must confirm this token change. |
| Warnings, "falta", incomplete dot | `promo` earth-600 `#A8582F` | 5.1:1 on white. Always pair it with an icon and text. |
| Danger zone, delete | `destructive` error-600 | 6.5:1 on white. Use an outline button by default, and a solid one only in the confirm dialog. |
| Draft or neutral badge | `secondary` with ink-600 text | |
| Decorative accent | cane-500 | Not used for text in the admin. If a gold label is needed, cane-700 is 5.0:1 on white. |

- **Status badges.** All are 12 px with an icon. Never use colour alone (req. 18.3).

  | Status | Colours | Icon |
  |---|---|---|
  | Publicada | bamboo-100 background, bamboo-900 text | check |
  | Borrador | sand-100 background, ink-600 text | pencil |
  | Inactiva | white background, ink-600 text, border | pause |
  | Incompleta | white background, earth-600 text, border | alert |

- **Charts** (metrics card only): a single bamboo-700 series. Apply the dataviz rules when R5c builds it.

### 7.5 Component list

All components are shadcn/ui on Radix, copied into `components/admin/ui/`. "Local" means a component written for this project.

- **Shell:** `Sidebar` (inset variant, with `SidebarGroup`, `SidebarMenuButton`, `SidebarRail` and the mobile `Sheet`), `Breadcrumb`, `Separator`.
- **Page:**
  - `PageHeader` (local): title, one-line description and an actions slot.
  - `EmptyState` (local).
  - `Card`.
- **Dashboard:**
  - `SetupChecklist` (local): segmented `Progress`, step rows with a check or number, a link on each row, collapsible when complete.
  - `StatStrip` (local): hairline-separated stats.
  - `MeterRow` (local).
  - A `RecentActivity` list.
- **Lists:**
  - `Table` with `DataTableToolbar`: a search `Input`, facet filters via `Popover` + `Command`, and an optional "Ver" column toggle.
  - `Checkbox` for bulk select, plus a bulk-action bar (local) that appears when rows are selected.
  - `DropdownMenu` for the row "⋮" menu, and `Badge` for status.
  - A sortable row handle (dnd-kit).
- **Forms:**
  - A `Form` field wrapper: label, control, help and error.
  - Controls: `Input`, `Textarea` with a character counter, `Select`, `Switch`, `ToggleGroup` (segmented).
  - `Collapsible` for "Avanzado".
  - `SettingsRow` (local): two-column label | control.
  - `SaveBar` (local): sticky, shown only when the form is dirty.
- **Room editor:**
  - Section `Card`s with an in-page scroll-spy nav.
  - `StatusCard` and `PublishChecklist`.
  - `RoomCardPreview`, which reuses the public `RoomCard`.
  - `AmenityGroupGrid`: checkbox groups by category.
  - `DangerZone`.
- **Media:**
  - `Dropzone`: native, multi-file.
  - `UploadQueue`: a `Progress` and a status `Badge` per file.
  - `MediaGrid`: sortable square tiles, with a marker when alt text is missing.
  - Filter chips (`ToggleGroup`) with counts.
  - A detail `Sheet`.
- **Feedback:**
  - `AlertDialog` for destructive confirms, or keep the native `<dialog>`.
  - Toast in the existing `aria-live` region, with undo.
  - `Tooltip`. Icon-only buttons always have an `aria-label` as well.
