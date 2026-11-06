# 0015 — One amenity catalog (hotel and room scopes) and multi-slide hero

- Status: Accepted
- Date: 2026-11-05
- Amends: [0006](0006-data-model.md) (the `Service` model is removed)
- Amended by: [0016](0016-room-types-and-single-sources.md) (room amenities link to room types; `HotelProfile.heroMedia` and the hero fallback to it are gone)

## Context

ADR 0006 kept hotel-level features in `Service` and per-room comforts in `Amenity` + `RoomAmenity`.
This duplicated Wi-Fi: it was both the room amenity "Wi-Fi" and the service "Internet en todos los
pisos" (`docs/research/amenity-model.md` §1). The research recommended keeping two tables and adding
categories and a charge flag. On 2026-11-05 the owner decided otherwise. Hotel "services" must not
be a separate public page, admin section or backend module. One "Comodidades" module covers both
levels.

The redesign (mockup spec §7 Home) also needs an ordered list of hero photos instead of the single
`HotelProfile.heroMedia`.

## Decision

**Amenities.** `Amenity` gets `scope AmenityScope` (`HOTEL` | `ROOM`, default `ROOM`). `iconKey`,
`active`, `showOnHome` and `sortOrder` stay unchanged. There are no categories and no charge flag.

- `ROOM` amenities are assigned per room through `RoomAmenity`. The API refuses HOTEL ids in
  `amenityIds` (422, path `amenityIds`) and refuses to move an amenity that rooms still use to
  `HOTEL` (409). Public room payloads list only active `ROOM` amenities.
- `HOTEL` amenities apply to the whole hotel. `GET /public/site` returns `hotelAmenities` (every
  active one, with `showOnHome`) next to `homeAmenities` (`ROOM` + `showOnHome`). The home panel
  that D2 built from highlighted services now shows the HOTEL amenities with `showOnHome`. The
  room detail shows the room's equipment plus one "En todo el hotel: …" line. The `Hotel` JSON-LD
  `amenityFeature` lists the hotel amenities followed by the home room amenities.
- Removed: the `Service` model and table, the `services` API module (`/admin/services`,
  `/public/services`), its shared schemas, the `services` cache tag, the public `/servicios` page
  with its nav, footer, sitemap and consent-source entries, and the admin "Servicios" section. The
  analytics source value `services` stays in the enum so that stored aggregates still validate.
- The dashboard counter `activeServices` becomes `activeHotelAmenities`.

**Migration** `20261105120000_amenity_scope_hero_slides` runs in one transaction and is safe on
existing data:

1. Every `Service` row becomes a `HOTEL` amenity. It keeps its id. `highlighted` becomes
   `showOnHome`. A missing icon becomes `sparkles`. The service image is dropped from the row but
   the asset stays in the media library. A same-named amenity becomes the HOTEL one.
2. "Internet en todos los pisos" becomes "Wi-Fi en todo el hotel", with the `wifi` icon and an
   updated description unless an admin edited it.
3. The room amenity "Wi-Fi" loses its room links. It is merged into the HOTEL Wi-Fi, which inherits
   its home flag, or renamed into it when no service existed. Any remaining room link on a HOTEL
   amenity is deleted.
4. One `AuditLog` row with no admin (`system.migration`) records the move. Then `Service` is
   dropped.

`20261105130000_clear_restated_amenity_descriptions` clears the two seeded HOTEL descriptions that
only restated the name ("El hotel cuenta con …"). The site renders a description only when one is
present.

**Hero slides.** New `HeroSlide` table with `mediaAssetId` (unique, `onDelete: Restrict`), an
optional `altText` override, an optional `caption`, `active` and `sortOrder`. The admin CRUD at
`/admin/hero-slides` supports `PUT /order`, revalidates the `site` tag and refuses an active slide
whose media is not READY or has no alt text (422). `GET /public/site` returns `heroSlides` (active
and publishable, in order, alt override applied). The web hero uses them when there is at least
one. Otherwise it keeps D2's fallback: hotel hero, then featured gallery photos and room covers, up
to 3. `MediaService.remove` counts hero slides as usage (409). The admin manages the slides in
"Contenido de la landing › Carrusel principal". `heroVideoMedia` stays private, because the design
has no video.

## Consequences

- One catalog to maintain. The admin filters it by scope ("Todo el hotel" / "Habitaciones"), and
  the room form offers only `ROOM` amenities.
- `sortOrder` is shared by both scopes. Lists are filtered by scope before they are shown, so
  ordering within a scope is what matters.
- The free/paid information the research suggested (`charge`) is not modelled. Copy such as
  "Wi-Fi gratis" must stay out until the hotel confirms it.
- `/servicios` now answers 404. A permanent redirect to `/` belongs to the SEO task (D6,
  `next.config` redirects).
- Integration tests cover the migration in a scratch database (`src/test/migration.integration.spec.ts`).
  That test applies the init migration, inserts the legacy rows and then runs the new migrations.
