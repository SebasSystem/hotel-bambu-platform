# Photo & video inventory

Source: `assets-source/photos/` (46 files) and `assets-source/videos/` (2 files), received via WhatsApp. Originals are gitignored; this document and `assets-manifest.json` hold metadata only. Reviewed visually, file by file, on 2026-11-04.

Machine-readable detail per file (category, room group, suggested use, quality, people, Spanish alt text, notes): [`assets-manifest.json`](./assets-manifest.json).

## Summary

| Metric | Value |
|---|---|
| Files | 46 (42 unique: 4 files dated 2026-11-04 are byte-identical re-sends) |
| Resolution | 45 × 960×1280 portrait, 1 × 1280×960 landscape (WhatsApp-compressed) |
| Quality | 22 ok · 14 needs-edit · 10 discard |
| People visible | 6 files (staff member at reception ×2, guest/photographer ×4) |
| By category | room 31 · common 7 · signage 4 · detail 3 · exterior 1 · food 0 · surroundings 0 |
| Distinct room setups | 15 (groups `R-A`…`R-O` in the manifest) + 1 bathroom; not mapped to room numbers |

### Key findings

1. **Resolution is the main limitation.** Max edge is 1280 px and the short edge is 960 px. Full-bleed desktop heroes (1920 px wide) would be upscaled and soft. Request the **original files from the phone** (not via WhatsApp) — this alone fixes most of it.
2. **Almost everything is portrait.** Fine for mobile, weak for desktop wide layouts. Desktop layouts must use split / framed compositions instead of full-bleed landscape photos (see `docs/design/art-direction.md`).
3. **Room type can be inferred only partially.** 9 room photos show one double bed (tagged `couple`, inferred); 22 show two beds (tagged `null` — could be twin, family or "individual"). The hotel must map photos to room numbers/types.
4. **No food, surroundings, full facade or daytime street view.** Only one partial entrance shot.
5. **Framed signage photos contain real hotel data** (see "Data observed in photos" below). These must be confirmed by the hotel before use; they are not published as images.
6. Strong colour casts vary per room (green, red, mustard curtains; striped/floral bedspreads). Apply only neutral correction (white balance, exposure, straighten) — never alter reality (req. 6.5, 17.6).

## Inventory table

Quality: ok = publishable after standard processing (EXIF strip, resize) · needs-edit = crop/correct first · discard = do not publish.

| # | File (suffix) | Category | Room group / type | Suggested use | Quality | People |
|---|---|---|---|---|---|---|
| 1 | 2.50.22 PM | common (reception keys) | – | gallery | needs-edit | yes (reflection) |
| 2 | 2.50.23 PM (1) | room | R-A / couple | gallery | needs-edit | no |
| 3 | 2.50.23 PM | room | R-B / couple | gallery | needs-edit | no |
| 4 | 2.50.24 PM (1) | room | R-C / ? | gallery | needs-edit | no |
| 5 | 2.50.24 PM (2) | room (bathroom) | – | gallery | ok | no |
| 6 | 2.50.24 PM | room | R-C / ? | card, gallery | ok | no |
| 7 | 2.50.25 PM (1) | room | R-D / ? | gallery | needs-edit | yes (mirror) |
| 8 | 2.50.25 PM | room | R-D / ? | card, gallery | ok | no |
| 9 | 2.50.26 PM | common (upper corridor) | – | hero (mobile), about, gallery | ok | no |
| 10 | 2.50.27 PM (1) | room | R-E / couple | – | discard | yes |
| 11 | 2.50.27 PM | room | R-E / couple | hero (mobile), card, gallery | ok | no |
| 12 | 2.50.29 PM (1) | room | R-F / ? | gallery | needs-edit | no |
| 13 | 2.50.29 PM | common (ground corridor, stairs) | – | about, gallery | ok | no |
| 14 | 2.50.30 PM | room | R-G / couple | card, gallery | ok | no |
| 15 | 2.50.31 PM (1) | room | R-H / ? | card, gallery | ok | no |
| 16 | 2.50.31 PM | room | R-H / ? | gallery | ok | no |
| 17 | 2.50.32 PM | room | R-I / couple | gallery | needs-edit | no |
| 18 | 2.50.33 PM (1) | room | R-H / ? | gallery | ok | no |
| 19 | 2.50.33 PM (2) | room | R-H / ? | – | discard (dark) | no |
| 20 | 2.50.33 PM | detail (beds, lamp) | R-H | card, gallery | ok | no |
| 21 | 2.50.34 PM (1) | room | R-J / ? | card, gallery | ok | no |
| 22 | 2.50.34 PM | room | R-J / ? | – | discard | yes (partial) |
| 23 | 2.50.35 PM (1) | room | R-K / ? | gallery | needs-edit | no |
| 24 | 2.50.35 PM | room | R-J / ? | gallery | ok | no |
| 25 | 2.50.36 PM (1) | room | R-L / ? | gallery | needs-edit | no |
| 26 | 2.50.36 PM (2) | room | R-M / ? | card, gallery | ok | no |
| 27 | 2.50.36 PM | room | R-L / ? | gallery | ok | no |
| 28 | 2.50.37 PM | room | R-M / ? | gallery | ok | no |
| 29 | 2.50.38 PM (1) | detail (gilded mirror) | – | gallery | ok | no |
| 30 | 2.50.38 PM (2) | detail (door plate 107) | – | – | needs-edit | no |
| 31 | 2.50.38 PM | room | R-M / ? | gallery | ok | no |
| 32 | 2.50.39 PM (1) | room | R-N / ? | gallery | ok | no |
| 33 | 2.50.40 PM (1) | room | R-O / ? | card, gallery | ok | no |
| 34 | 2.50.40 PM | room (landscape) | R-O / ? | card, gallery | ok | no |
| 35 | 2.50.41 PM (1) | signage (green bamboo sign) | – | hero, og, about, gallery | needs-edit | no |
| 36 | 2.50.41 PM | exterior (entrance) | – | about, gallery | needs-edit | no |
| 37 | 2.50.42 PM | common (lounge) | – | about, gallery | ok | no |
| 38 | 2.50.43 PM (1) | common (reception) | – | about | needs-edit | yes (staff) |
| 39 | 2.50.43 PM | common (reception) | – | about, gallery | needs-edit | yes (staff) |
| 40 | 11-04 3.39.54 PM | room | R-E | – | discard (dup of #11) | no |
| 41 | 11-04 3.39.56 PM | common | – | – | discard (dup of #9) | no |
| 42 | 11-04 3.40.18 PM | room | R-I | – | discard (dup of #17) | no |
| 43 | 11-04 3.40.20 PM | room | R-G | – | discard (dup of #14) | no |
| 44 | foto marco mision | signage (text) | – | – | discard (text source) | no |
| 45 | foto marco registro nacional de turismo | signage (RNT cert.) | – | – | discard (personal data) | no |
| 46 | foto marco vision | signage (text) | – | – | discard (text source) | no |

File prefix: `WhatsApp Image 2026-10-15 at ` (rows 1–39) and `WhatsApp Image 2026-11-04 at ` (rows 40–43).

### Best picks

- **Hero (default, pending approval):** #35 green sign (identity, colour source) with a sober treatment; mobile alternates #11 (green room) and #9 (warm wooden corridor).
- **About / story:** #9, #13, #37, #36.
- **Room cards:** #11, #14, #15, #21, #26, #33, #34, #6, #8, #20.
- **OG default:** #35 cropped to 1200×630 with the logo, or a brand-colour OG card (preferred until a landscape facade photo exists).

## Data observed in photos (confirm with the hotel)

The framed mission/vision prints and the RNT certificate show the following. They come from the hotel's own material, but they are **not confirmed for web publication** and stay as `TODO(hotel): confirm` in seeds:

| Item | Observed value | Source |
|---|---|---|
| City | Mocoa, Putumayo | #44, #45, #46 |
| Address | Calle 8 # 7-10 | #45 (RNT: "Calle 8 número 7-10"), #44 ("Calle8 n 7/10") |
| Phone | 310 679 8260 (WhatsApp status unknown) | #44, #46 |
| RNT | 232175 (assigned 2025-01-15, category "Establecimientos de alojamiento turístico") | #45 |
| Tagline | "Hotel Bambú Plaza: descanso, comodidad y confianza en el corazón de Mocoa" | #44, #46 |
| Mission / vision | Full text visible on #44 / #46 | #44, #46 |

The RNT certificate also shows the holder's personal name and tax ID; they are deliberately not transcribed here.

## Missing photos (request from the hotel)

Request originals at full resolution (send as "document"/file, not as WhatsApp photo), daylight, lights on, beds made, no people, phone held level at chest height, main camera (avoid the 0.5× ultra-wide distortion).

1. **Facade in daylight**, full building from across the street, horizontal and vertical.
2. **Landscape (horizontal) shots** of 3–4 best rooms and the lounge, for desktop hero/sections.
3. **Bathroom of each room type** (only one bathroom photo exists).
4. **Room ↔ photo mapping:** room number, type (individual/couple), beds, capacity for each of the 16 rooms; at least 3 photos per room type.
5. **Solar panels** and **water reserve** (verified features, currently no images).
6. **Wi-Fi / work corner** if any (mission mentions commercial/administrative guests).
7. **Bamboo detail / plants / natural textures** inside the hotel, if they exist.
8. **Surroundings of Mocoa** (street, nearby landmarks, nature) — only images the hotel owns or has rights to.
9. **Entrance at night** with the sign lit, taken straight on without cables in front if possible.
10. **Clean sign photo** in neutral daylight (no HDR filter) to refine the brand green.
11. **Short horizontal video** (see below): 10–20 s, 1080p or higher, landscape, stabilized/slow, no people, no audio needed.
12. Written **authorization** from the staff member shown at reception (#38, #39) if those photos are to be used.

## Video analysis

| | Video 1 (`…3.27.42 PM.mp4`) | Video 2 (`…3.29.24 PM.mp4`) |
|---|---|---|
| Duration | 16.9 s | 9.6 s |
| Encoded size | 848×480, rotation −90° → displays **480×848 portrait** | **464×832 portrait** |
| Frame rate | ~31.6 fps (variable, 600/19) | 30 fps |
| Codec | H.264 Baseline L3.1 + AAC audio | H.264 Baseline L3.1 + AAC audio |
| File size / bitrate | 2.7 MB / ~1.2 Mbps | 1.5 MB / ~1.2 Mbps |
| Content | Handheld walkthrough: room with two beds (TV, wall fan, stand fan, table, blue chair) → second bed with grey headboard → close-up of the door handle → bathroom with toilet and grab bar | Handheld walkthrough: entrance stairs and floor mat → reception desk → lounge with **three identifiable people** seated (one in a red chair, two on the sofa/armchair) |
| Light | Even indoor fluorescent, slightly flat | Even indoor light |
| Stability | Handheld, continuous pans, motion blur on turns | Handheld, pans |
| Verdict | Not hero-grade. Usable at most as a short "room tour" clip in a room detail (needs room identification and trimming the door-handle segment) | **Not usable publicly**: identifiable people without authorization; also too short and low-res |

### Recommendation for requirement 2.3 / 8.4

- **Hero video: no.** Both clips are 480p portrait, handheld, below the 720p mobile / 1080p desktop targets of 8.4, and would look degraded at full-bleed. → **Photo hero** (default).
- **Multi-video narrative: no.** Not enough material → photo narrative (sticky image transitions).
- **Video in room detail / gallery: not now.** Option (b) for Video 1 is technically possible (portrait 9:16 in a framed player, muted, with controls, ≤ 1.5 MB) but adds little over the photos and the room it shows is unidentified. Keep the `MediaAsset` video type in the data model so it can be enabled later; ship v1 without video.
- **Request a new clip** (item 11 above) if the hotel wants a video hero. A 10–20 s horizontal, stabilized, daylight clip of the facade/lounge/best room would satisfy 8.4.

Decisions recorded in [`docs/adr/0004-optional-elements.md`](../adr/0004-optional-elements.md).
