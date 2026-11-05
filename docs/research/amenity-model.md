# Amenity model: hotel facilities vs room amenities (R1b)

Status: research + recommendation (task R1b of `odd/tasks/public-site-redesign.md`). Implementation is task R5b.
Date: 2026-11-04.

## 1. Problem (verified in code)

| # | Finding | Evidence |
|---|---|---|
| 1 | Wi-Fi exists twice: room `Amenity` "Wi-Fi" **and** hotel `Service` "Internet en todos los pisos". It is one network described two ways. | `apps/api/src/seeds/base-data.ts` (`AMENITIES`, `SERVICES`) |
| 2 | The home label "En todas las habitaciones" is driven by the manual `Amenity.showOnHome` flag, not by data. If one room loses an amenity, the home still claims "all rooms". | `apps/web/lib/i18n/es.ts:96` (`amenitiesTitle`), `apps/api/src/modules/public/public.ts` (`homeAmenities = amenities.filter(showOnHome)`) |
| 3 | `Hotel` JSON-LD `amenityFeature` lists the **room** amenities flagged `showOnHome`; the real hotel facilities (`Service`: solar panels, water reserve, internet) are missing from it. | `apps/web/lib/seo/json-ld.ts:88` |
| 4 | Admin labels "Comodidades" (room) vs "Servicios" (hotel) do not say which level they act on. | `apps/web/components/admin/admin-shell.tsx`, screenshots |
| 5 | No categories: the room editor shows a flat checkbox list; the public site cannot group (Baño, Entretenimiento…). | `Amenity`/`Service` models in `apps/api/prisma/schema.prisma` |
| 6 | No "free / extra cost" information, which every OTA shows for Wi-Fi and parking. | schema |

The two-table split itself (ADR 0006: `Service` = hotel-level, `Amenity` + `RoomAmenity` = per-room) is **correct** and matches the industry. The defects are data placement, naming, the computed-vs-manual "all rooms" claim, and missing categories.

## 2. Industry findings

**Everyone separates property-level from room-level.**

- **Booking.com**: the Facilities API "manage[s] facilities at both the property- and room-level", with separate meta lists (`property_facility_metas`, `room_facility_metas`) and a separate `/bathrooms` endpoint. Room amenities are set **per room type** (OTA `RMA` codes via `AmenityCode`), not per property. Facilities are single-instance (present/missing toggle) or multi-instance (with details). Per channel-manager reports, Booking.com changed attribute defaults from "Included" to **"Unknown"** to improve accuracy. — [Facilities API intro](https://developers.booking.com/connectivity/docs/content-api-modules/facilities-api/introduction-to-facilities-api), [Managing room amenities](https://developers.booking.com/connectivity/docs/tsk-modify-room-amenities), [Hospitable: Booking.com managed facilities](https://help.hospitable.com/en/articles/11152209-booking-com-managed-facilities), [Smoobu: property facilities](https://support.smoobu.com/hc/en-us/articles/35765953067794-How-Do-I-Update-My-Property-s-Facilities-for-Booking-com)
- **Google (Business Profile Lodging API)** groups property attributes by category: `property`, `services`, `policies`, `foodAndDrink`, `pools`, `wellness`, `activities`, `transportation`, `families`, `connectivity`, `business`, `accessibility`, `pets`, `parking`, `housekeeping`, `healthAndSafety`, `sustainability`, `commonLivingArea`. Units are described separately in `guestUnits[]`, and Google **derives** `allUnits` ("All units on the property have at least these attributes") and `someUnits`; both are output-only, so they are computed and not entered by hand. That is exactly the "in all rooms" logic Bambú needs. Connectivity is property-level with separate booleans `wifiAvailable`, `freeWifi`, `publicAreaWifiAvailable`, and in-unit Wi-Fi is the separate `inunitWifiAvailable` room feature. Room features include `privateBathroom`, `tv`, `airConditioning`. Sustainability has `energyEfficiency.carbonFreeEnergySources` (covers on-site solar) and a `waterConservation` group. Each attribute can carry an exception (`UNDER_CONSTRUCTION`, `DEPENDENT_ON_SEASON`…). — [Lodging resource](https://developers.google.com/my-business/reference/lodging/rest/v1/Lodging)
- **Expedia / Hotels.com** public pages show separate lines "Free WiFi in public areas" and "Free WiFi in rooms", grouped under property vs room sections. Wi-Fi is presented as one property fact with a location qualifier rather than as two features.
- **Airbnb** (single listing) groups amenities into categories (Basics, Bathroom, Bedroom and laundry, Entertainment, Heating and cooling, Internet and office, Parking and facilities, …), edited at Listing editor → Your space → Amenities. The full 12-category list comes from a third-party summary; Airbnb's own page confirms Essentials, Basics, Bathroom, and Bedroom and laundry. — [Airbnb help 2343](https://www.airbnb.co.uk/help/article/2343), [Airbnb help 586](https://www.airbnb.ca/help/article/586), [Templacity summary](https://templacity.com/es/airbnb/airbnb-amenities-list/)
- **Cloudbeds** sets amenities per accommodation type (shown on the booking engine, custom ones allowed) and separately at property level. — [Cloudbeds: accommodation types](https://myfrontdesk.cloudbeds.com/hc/en-us/articles/360038464274), [Cloudbeds: property amenities](https://myfrontdesk.cloudbeds.com/hc/en-us/articles/217997578-Setup-your-property-amenities) (403 to automated fetch; content from search snippets)
- **schema.org**: `amenityFeature` (range `LocationFeatureSpecification`) is defined on `Accommodation` (so `HotelRoom`), `LodgingBusiness` (so `Hotel`), `Place` and `FloorPlan`: "An amenity feature (e.g. a characteristic or service) of the Accommodation. This generic property does not make a statement about whether the feature is included in an offer." `LocationFeatureSpecification` has `name`, `value` (Boolean/Text/…), `hoursAvailable`, `validFrom`, but **no** price or fee field. — [amenityFeature](https://schema.org/amenityFeature), [LocationFeatureSpecification](https://schema.org/LocationFeatureSpecification)

**How each source treats the common items:**

| Item | Level in industry | Notes |
|---|---|---|
| Wi-Fi / internet | **Property** (Google `connectivity`, Booking property facility), with an optional in-room qualifier | free vs paid is always shown |
| Private bathroom, shower, toiletries | Room (Booking has its own bathroom endpoint) | |
| TV | Room | |
| Fan / air conditioning / heating | Room ("Heating and cooling") | |
| Parking | Property | free/paid, on-site/nearby |
| Solar energy, water reserve | Property: sustainability | Google `carbonFreeEnergySources`, `waterConservation` |
| Reception / 24 h front desk, luggage storage | Property: services | |

**Free/paid**: Google (`freeWifi`, parking fields) and OTAs mark it. Booking.com's default is "Unknown", meaning they do not assume. **"All rooms vs some rooms"**: Google computes it (`allUnits`/`someUnits`). OTAs show it per room type.

## 3. Recommended model for Bambú (proportional: 16 rooms, ~10 features)

Keep the two existing tables. Do not merge them into one polymorphic "feature" table, because the levels are edited in different places (hotel page vs room editor) and only room-level items need a join table. Add categories, a charge flag and a highlight flag, and compute "all rooms".

### 3.1 Hotel-level facilities (`Service` table; UI name **"Servicios del hotel"**)

Optionally rename the Prisma model with `model HotelFacility { … @@map("Service") }` for code clarity. `@@map` keeps the table, so no data migration is needed.

| Category enum `FacilityCategory` | Spanish label | Bambú items (confirmed) / likely candidates (`TODO(hotel)`) |
|---|---|---|
| `CONNECTIVITY` | Conectividad | **Wi-Fi en todo el hotel** (moved from room amenity; replaces "Internet en todos los pisos") |
| `SUSTAINABILITY` | Sostenibilidad | Paneles solares, Reserva de agua |
| `RECEPTION` | Recepción y servicios | reception hours, luggage storage? |
| `PARKING_TRANSPORT` | Parqueadero y transporte | parking? |
| `FOOD` | Alimentación | breakfast? |
| `COMMON_AREAS` | Zonas comunes | lounge (seen in photos; confirm) |
| `SAFETY` | Seguridad | |

New columns: `category FacilityCategory NOT NULL`, `charge ChargeType NOT NULL DEFAULT 'UNKNOWN'`. `highlighted` stays (shown on home).

### 3.2 Room-level amenities (`Amenity` + `RoomAmenity`; UI name **"Equipamiento de habitaciones"**)

| Category enum `AmenityCategory` | Spanish label | Bambú items |
|---|---|---|
| `BATHROOM` | Baño | Baño privado (hot water? `TODO(hotel)`) |
| `ENTERTAINMENT` | Entretenimiento | Televisor |
| `CLIMATE` | Clima | Ventilador (A/C in any room? `TODO(hotel)`) |
| `SLEEP` | Descanso | (bedding/blackout, if confirmed) |
| `WORKSPACE` | Trabajo | (desk, if confirmed) |
| `OTHER` | Otros | |

New column: `category AmenityCategory NOT NULL`. Rename `showOnHome` → `highlighted`: the same meaning as on `Service`, used for the room-card chips. `charge` is not needed at room level: in a 16-room hotel nothing in-room is charged separately. Add it later if that changes.

### 3.3 Flags

- `ChargeType` enum: `INCLUDED` ("Incluido"), `EXTRA_COST` ("Con costo adicional"), `UNKNOWN` (shows no label). The default is `UNKNOWN`, as at Booking.com, so the site never claims "gratis" without the hotel's confirmation. Add "¿El Wi-Fi es gratis?" to `docs/pendientes-hotel.md`.
- `highlighted`: on the hotel level, shown on the home; on the room level, shown as chips on room cards (max 3–4).
- `active`: unchanged.

### 3.4 "In all rooms" is computed, never typed

```
allRoomsAmenities = amenities where active
  and count(RoomAmenity ∩ PUBLISHED rooms) == count(PUBLISHED rooms) and count(PUBLISHED rooms) > 0
```

This is computed in `PublicService` (one `groupBy` on `RoomAmenity` filtered by published rooms, cheap at 16 rooms). The public payload replaces `homeAmenities` with `allRoomsAmenities` (grouped by category, ordered by category order then `sortOrder`). The home and `/servicios` show the "En todas las habitaciones" block only from this set. Amenities present in only some rooms appear only on those rooms' detail pages. This is Google's `allUnits`/`someUnits` model. The admin shows the same computed fact as a hint on each amenity row: "En 16 de 16 habitaciones publicadas".

### 3.5 Public display

- **Home**: "Servicios del hotel": highlighted facilities (icon + name + description). Then "En todas las habitaciones": the computed set as chips.
- **`/servicios`**: facilities grouped by category heading (only categories with active items), each with its charge label when known, then the "En todas las habitaciones" block grouped by amenity category.
- **Room detail**: "Equipamiento" grouped by category, plus one line linking to the hotel services ("Además, en todo el hotel: Wi-Fi…").
- **Room card**: highlighted room amenities (≤4).

### 3.6 JSON-LD mapping

- `Hotel.amenityFeature` = active hotel facilities + `allRoomsAmenities`. Each is `{ "@type": "LocationFeatureSpecification", "name": <name>, "value": true }`. For `charge = INCLUDED`, the name may carry the qualifier (e.g. "Wi-Fi gratis"). schema.org has no fee field, so **do not** invent one.
- `HotelRoom.amenityFeature` = that room's active amenities (unchanged). Do not repeat hotel facilities per room.
- This fixes finding 3 (hotel facilities are currently missing from `Hotel` JSON-LD).

## 4. Migration plan (task R5b)

One Prisma migration, e.g. `2026xxxx_amenity_categories`. Generate it with `prisma migrate dev --create-only`, then hand-edit.

1. **Enums + columns**: `CREATE TYPE "FacilityCategory"`, `"AmenityCategory"`, `"ChargeType"`. Add `Service.category` and `Amenity.category` with a temporary `DEFAULT 'OTHER'`/`'COMMON_AREAS'`, backfill (step 2), then drop the default so new rows must choose. Add `Service.charge DEFAULT 'UNKNOWN'`. Hand-edit `showOnHome` → `highlighted` to `ALTER TABLE "Amenity" RENAME COLUMN "showOnHome" TO "highlighted"`, because Prisma would emit drop + add and lose data. Add indexes `@@index([category, sortOrder])` on both tables.
2. **Backfill by name** (idempotent, no-op if an admin renamed a row):
   - `Amenity`: 'Baño privado' → `BATHROOM`, 'Televisor' → `ENTERTAINMENT`, 'Ventilador' → `CLIMATE`.
   - `Service`: 'Paneles solares', 'Reserva de agua' → `SUSTAINABILITY`.
3. **Wi-Fi move** (same transaction):
   - `UPDATE "Service" SET name='Wi-Fi en todo el hotel', description='Conexión Wi-Fi en las habitaciones y en todos los pisos del hotel.', "iconKey"='wifi', category='CONNECTIVITY', highlighted=true WHERE name='Internet en todos los pisos'`. If that row does not exist, `INSERT … ON CONFLICT (name) DO NOTHING`.
   - `DELETE FROM "RoomAmenity" WHERE "amenityId" IN (SELECT id FROM "Amenity" WHERE name='Wi-Fi')`. The FK is `onDelete: Restrict`, so the join rows go first.
   - `DELETE FROM "Amenity" WHERE name='Wi-Fi'`.
   - Write an `AuditLog` row ("system migration: Wi-Fi moved to hotel services") if the audit schema allows a null admin. Otherwise note it in the ADR.
4. **Seeds** (`apps/api/src/seeds/base-data.ts`, `seed-base.ts`, `seed-demo.ts`): `AMENITIES` = 3 items with `category` and `highlighted`; `SERVICES` = 3 items with `category` (Wi-Fi as `CONNECTIVITY`, `charge: 'UNKNOWN'`). The demo seed assigns the 3 amenities to every room. Base upserts keep `update: {}`. The migration, not the seed, fixes existing databases.
5. **Shared** (`packages/shared/src/admin/admin.ts`, `public/public.ts`, icons): category/charge enums plus Spanish label maps exported once and used by API validation, admin and site. Public type: `allRoomsAmenities: { category, items[] }[]`, facility `category` and `charge`.
6. **API**: `modules/amenities/amenities.ts` and `modules/services` accept/validate `category` (`charge` on services). `modules/rooms/rooms.service.ts` returns amenity `category`. `modules/public/public.ts` computes `allRoomsAmenities` and groups facilities. Trigger revalidation of `/`, `/servicios` and room pages on amenity, service and room-amenity changes (an unpublished room changes the "all rooms" set).
7. **Admin** (`apps/web/app/admin/(panel)/amenities`, `services`, `rooms/room-form.tsx`, `admin-shell.tsx`): nav labels "Servicios del hotel" / "Equipamiento de habitaciones", a category select and charge radio, a computed "En N de M habitaciones" hint and an "Asignar a todas" bulk action on the amenity page, and categorized checkboxes in the room form (see `admin-ux.md`).
8. **Public site** (`app/(site)/page.tsx`, `servicios/page.tsx`, `habitaciones/[slug]/page.tsx`, `components/site/blocks.tsx`, `room-card.tsx`, `lib/seo/json-ld.ts`, `lib/i18n/es.ts`): as in 3.5 and 3.6.
9. **Tests**: `admin.test.ts` (schemas), `json-ld.test.ts` (Hotel includes facilities and all-rooms amenities, room does not duplicate), `rooms.test.ts`, an API unit test for the all-rooms computation (0 published rooms → empty; one room missing → excluded), and a migration check that `prisma migrate diff` shows no drift.
10. **Docs**: a new ADR amending 0006 ("Amenity categories, computed all-rooms, Wi-Fi is a hotel facility"). Update `docs/pendientes-hotel.md` (Wi-Fi free?, hot water, A/C, parking, reception hours) and `docs/admin-panel.md`.

## 5. Questions for the hotel

These answers decide categories, `charge` values and what the site may claim. Until answered, each item stays `TODO(hotel)`, its `charge` stays `UNKNOWN`, and the site shows nothing about it. The same list is tracked in `docs/pendientes-hotel.md` § E.

| # | Question | Decides |
|---|---|---|
| 1 | Is the Wi-Fi **free** for guests? Does it reach every room and the common areas? | `CONNECTIVITY` facility, `charge` (`INCLUDED` → "Wi-Fi gratis") |
| 2 | Is there **hot water** in every room's shower? | `BATHROOM` amenity "Agua caliente" (all rooms vs some rooms) |
| 3 | Does **any room have air conditioning**? Which ones? | `CLIMATE` amenity, per room |
| 4 | **Parking**: on site or nearby? Free or paid? Cars, motorbikes or both? | `PARKING_TRANSPORT` facility and `charge` |
| 5 | **Reception hours**: 24 h, or which hours? Late check-in possible? Luggage storage? | `RECEPTION` facilities; FAQ and policies |
| 6 | **Breakfast or food**: included, paid, or none? A restaurant or kitchen guests can use? | `FOOD` facility and `charge` |
| 7 | **Common areas**: the lounge seen in the photos, a terrace, a work corner? May they be shown? | `COMMON_AREAS` facilities; photo captions |
| 8 | **Security**: night staff, cameras, safe deposit box, controlled entrance? | `SAFETY` facilities (only what may be published) |

Out of scope (over-engineering for 16 rooms): OTA/HTNG code mapping, a multi-instance facility details model, opening hours per facility (`hoursAvailable`), and per-room charges. Add them only if a channel-manager integration appears.
