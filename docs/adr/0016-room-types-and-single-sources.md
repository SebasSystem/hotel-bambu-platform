# 0016 — Room types, nearby places and single content sources

- Status: Accepted
- Date: 2026-11-05
- Amends: [0006](0006-data-model.md) (rooms, promotions, WhatsApp templates, landing sections,
  roles) and [0015](0015-amenities-and-hero-slides.md) (room amenities now link to room types,
  `HotelProfile.heroMedia` is gone)

## Context

The owner reviewed the content model on 2026-11-05. Each of the 16 rooms carried its own copy of
the description, rate, beds and photos, although guests choose a *kind* of room, not room 101. The
same text could be written in three places: `HotelProfile`, `LandingSection` and the room. The hero
had three sources (`HotelProfile.heroMedia`, `heroVideoMedia` and the HERO section image) next to
the D3 `HeroSlide` list. Promotions, editable WhatsApp templates, per-room SEO fields and the
EDITOR role were unused. The real hotel facts (address, coordinates, phone, RNT, tagline and the
framed mission) were approved for publication on the same day.

## Decision

**Room types.** New `RoomType` model: `slug`, `name`, `type` (the former enum, renamed `RoomKind`
because the table now owns the name `RoomType`), `status`, `description`, `capacity`, `beds`,
`areaM2`, `basePrice`, `currency`, `priceUnit`, `taxesIncluded`, `priceNotes` and `sortOrder`, with
`RoomTypeImage` (one cover, partial unique index), `RoomTypeAmenity` (ROOM amenities only, ADR 0015)
and `RoomTypeSlugRedirect`. `Room` keeps only `name` (number or name), `status`, `sortOrder` and a
required `roomTypeId` (`onDelete: Restrict`). There is no separate operational status: `INACTIVE`
also covers a room that is out of service. A room counts on the site when it and its type are
`PUBLISHED`.

- Publishing a type needs a name, a slug, a capacity ≥ 1 and a READY cover with alt text. The
  description is optional: the page shows none instead of invented text.
- A published type cannot be deleted, nor a type that still has rooms (409).
- Public API: `GET /public/room-types` (published types with `publishedRoomCount`) and
  `GET /public/room-types/:slug` (detail). `GET /public/rooms*` is gone (404).
- Admin API: `/admin/room-types` (CRUD, `PUT /order`, `PATCH /:id/status`, `PUT /:id/images`) and
  a lightweight `/admin/rooms` (`name`, `roomTypeId`, `status`, `PUT /order`).

**Old room URLs.** The migration stores every former room slug and every `RoomSlugRedirect` as a
`RoomTypeSlugRedirect` of that room's type. `/public/room-types/<old-slug>` answers
`{ redirectTo: "<type-slug>" }`, and the web page `/habitaciones/<old-slug>` turns it into a
permanent redirect (308) to `/habitaciones/<type-slug>`. Renaming a published type adds a redirect
the same way, and redirect slugs stay reserved.

**Nearby places.** New `NearbyPlace` (`name`, optional `category`, `distanceText`,
`travelTimeText`, `sortOrder`, `active`) with an admin CRUD and `GET /public/nearby-places`
(active only, cache tag `nearby`). Nothing is seeded: no measured distances exist yet.

**Single sources.**

- Hero: `HeroSlide` only. `HotelProfile.heroMediaId`, `heroVideoMediaId` and the HERO section
  image are dropped. Without slides the web keeps its fallback (gallery, then room type covers).
- Descriptions: `HotelProfile` only. It gains `tagline` and `country`; `description` is the
  "Sobre nosotros" text and `shortDescription` the meta description. `LandingSection` keeps only
  `key`, `enabled` and `sortOrder`: section headings are web code, so the ABOUT body was not
  needed either.
- WhatsApp: the GENERAL and ROOM_TYPE messages are code defaults in `@hotel-bambu/shared`
  (`buildWhatsAppMessage`), opened by an optional `HotelProfile.whatsappGreeting`. The
  `WhatsAppTemplate` table, its admin section and its API are removed.
- SEO: the per-room `seoTitle`/`seoDescription` are dropped. The web generates the room type title
  and meta description from the type, its capacity, beds, area, amenities, rate and the city
  (`lib/seo/room-type-seo.ts`).

**Removed.** `Promotion` (model, API, admin, public use, PROMOTION template, `promotions` cache
tag) and the `EDITOR` role (a cheap enum change; `admin:create` is unchanged). The analytics source
value `promotion` stays so that stored aggregates still validate. Media usage checks count room
type images, hero slides and the hotel logo.

**Migration** `20261105140000_room_types_and_single_sources` runs data first, then the DDL, in one
transaction:

1. Rename the enum, create the new tables.
2. One `RoomType` per distinct `Room.type`, named "Habitación individual", "Habitación de
   pareja", "Habitación doble" or "Habitación familiar" (slugs `habitacion-individual`,
   `habitacion-pareja`, `habitacion-doble`, `habitacion-familiar`). Rooms of a kind are ordered
   published first, then by admin order and name. Each shared field comes from the first room in
   that order that has a value. `description` falls back to the old `shortDescription`, and the
   rate keeps the unit and taxes flag of the room it comes from. The type is PUBLISHED when any of
   its rooms was, INACTIVE when all were, DRAFT otherwise.
3. Photos: the union of the rooms' photos, once each, in first-seen order; the first cover found
   becomes the cover and goes first. Amenity links: the union. Redirects as above. Rooms get their
   `roomTypeId`.
4. The hotel hero and the HERO section image become hero slides (active only when READY with alt
   text). The ABOUT body moves into an empty `HotelProfile.description`. Editors become admins.
5. One `system.migration` AuditLog row counts what has no new home (promotions, SEO fields, section
   copy and media, hero video) and keeps edited WhatsApp template bodies.
6. Drop the moved columns, tables and enum values; add the CHECK constraints and the cover index.

## Consequences

- The site shows one card and one page per room type; "16 habitaciones" comes from the published
  room count, not from the number of cards.
- Room details that differed between rooms of the same kind keep only the representative values;
  the audit entry records the counts.
- Real hotel facts are base seed data now (`HOTEL_FACTS`), written only into empty profile fields,
  so an admin edit is never overwritten. The phone is not confirmed as WhatsApp, so
  `whatsappNumber` stays empty and the WhatsApp CTAs stay hidden until it is set.
- The demo seed no longer invents an 8/8 split or descriptions: it ensures the two confirmed types
  without description or rate, gives a type without rooms one `[DEMO]` example room, and clears
  `[DEMO]` type descriptions left by earlier runs. Existing rooms are untouched.
- Integration test: `src/test/room-types-migration.integration.spec.ts` (scratch database, previous
  migrations plus legacy rows, then this migration).
- Addendum (2026-11-08, owner review A8): `POST /admin/room-types` accepts the same optional
  `images: [{ mediaAssetId, isCover }]` list as `PUT /admin/room-types/:id/images` (shared
  `roomTypeImageListSchema`: at most 60, one cover, no repeats). The images are written in the same
  nested create as the type, so a wrong media id (422 on `images`) leaves no half-created type; a
  draft accepts any existing image, as the PUT does, and publishing keeps enforcing the cover rule.
  Chosen over "create, then PUT" from the browser, which could leave a type without its images when
  the second call fails.
- Addendum (2026-11-08, owner review A9): per-room differences live in `RoomAmenityOverride`
  (`roomId`, `amenityId`, `available`; primary key on the pair, cascade on room delete, restrict on
  amenity delete like `RoomTypeAmenity`). A room inherits its type's ROOM amenities; `available:
  true` adds one the type lacks, `false` marks a type amenity as missing in that room. Only real
  differences are stored (`normalizeRoomAmenityOverrides` in `@hotel-bambu/shared`), so a type
  without overrides behaves exactly as before. Rooms send the full list as `amenityOverrides` on
  `POST`/`PATCH /admin/rooms` (replaced in one transaction, audited as `room.update`, `rooms` tag
  revalidated). Public room types compute `availability` per amenity across their PUBLISHED rooms
  (`roomTypeAmenityAvailability`): every room → `ALL`, some → `SOME` ("en algunas habitaciones"),
  none → omitted; without published rooms the type amenities are `ALL`. JSON-LD keeps only `ALL`.
  Chosen over a separate per-room amenity list (no inheritance: every type change would need
  editing every room) and over new room types (the owner decision: a new type only when the price
  differs).
