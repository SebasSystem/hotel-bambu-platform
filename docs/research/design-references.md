# Design references — public site redesign (R1)

Status: research deliverable R1 for feature `public-site-redesign` (req. 7.2 R2–R4, 7.3, 7.4). Researched 2026-11-04. Global references first (owner decision: design quality over locality); local competitors are secondary and get a condensed section. **Inspiration is not copying** (req. 7.4): no layouts, text, photos or code are reproduced.

## Method

- Every URL was opened. HTTP status was checked with `curl`, and the sites were rendered with **Playwright 1.64.1 in Docker** (`mcr.microsoft.com/playwright:v1.64.1-noble`, Chromium, desktop 1440×900 and mobile 390×844, a 4 s settle, cookie banners auto-dismissed where possible). Each capture was viewed and analysed by eye.
- About 115 captures were taken: `<site>-d-fold`, `-d-s2`, `-d-s4` (desktop at scroll 0/2/4 viewports), `-m-fold`, `-m-s5` (mobile), and `gal-*`, `codrops-*`, `aceternity-*`, `magicui-*`, `reactbits-*` for galleries and component demos. **They are transient evidence and are not committed** (owner policy, see [`design-research.md`](./design-research.md#screenshot-and-copyright-policy)). This document cites each source URL and describes what each capture showed; capture names appear only as a note of which transient file backed a statement.
- The SEO fields come from the served HTML (`<title>`, meta description, JSON-LD `@type`s). The "Performance" rows in the 7.3 analyses note observed behaviour (loaders, popups, blank first paint). **Measured** Lighthouse mobile results are in [§ Measured performance](#measured-performance-lighthouse-mobile).
- Excluded after inspection: **theslow.id** (The Slow, Bali). The domain now serves an unrelated gambling page, so it is not a valid reference. **acehotel.com** failed with a redirect loop in headless Chromium.

## Reference table

Category: **H-small** small or independent hotel (≤ 50 rooms) · **H-budget** budget/affordable brand with crafted design · **H-nature** eco/nature lodge · **H-design** design/boutique (larger or luxury) · **G** design gallery · **C** component/motion source.

| # | Name | URL | Category | Why relevant to Bambú | Capture |
|---|---|---|---|---|---|
| 1 | **Paradero Todos Santos** | https://www.paraderohotels.com | H-design (35 suites, Baja California) | **Portrait diptych hero** fills 1440 px with two tall images, which directly solves our portrait-only photos. Webflow site with `Hotel` JSON-LD. | `paradero-d-fold`, `paradero-m-fold` |
| 2 | **Hotel Odisej** (Mljet, Croatia) | https://www.hotelodisej.com | H-design. Awwwards HM 2023-06-22 (Bornfight) | Ordinary 3-star-style rooms made premium by type: giant centred serif statements on an olive band with a wave edge, staggered photo pairs, numbered room list. | `odisej-d-fold`, `-d-s2`, `-d-s4`, `-m-fold` |
| 3 | **KEX Hostel & Hotel** (Reykjavík) | https://kexhostel.is | **H-budget** | The best "budget but crafted" analog: diptych "HOSTEL / HOTEL" hero, condensed caps + typewriter body, round "Book a stay" stamp button, engraved hand illustration, wallpaper texture. | `kex-d-fold`, `kex-d-s2`, `kex-m-fold` |
| 4 | **Casa Angelina** (O Grove, Galicia) | https://www.casaangelina.com | **H-small** family pensión, Spanish | The closest honest analog: modest rooms with wood ceilings presented with numbered kickers ("02 / EL DESCANSO"), an italic serif accent ("invitan a *quedarse*."), room spreads with chips, and Spanish copy. `LodgingBusiness` JSON-LD. | `casaangelina-d-fold`, `-d-s2`, `-m-fold` |
| 5 | **SILENA, your soulful hotel** (South Tyrol) | https://www.silena.com/en | H-design (48 rooms). Awwwards HM 2023-03-24 (credit: hantha.) | Framed inset hero, circular "BOOK / ENQUIRE" bubbles, a large light factual statement ("48 rooms. A restaurant."), staggered photos. Stack per Awwwards: GSAP, ScrollTrigger, barba.js, smooth scroll. | `silena-d-fold`, `silena-d-s2`, `gal-awwwards-silena-1` |
| 6 | **Ett Hem** (Stockholm) | https://www.etthem.se | **H-small** (12 rooms) | No photo in the hero: one ink illustration and one sentence ("For people looking for something more personal than the luxury hotel"). Quiet serif footer with contact in italic. | `etthem-d-fold`, `etthem-d-s2` |
| 7 | **Les Roches Rouges** (Saint-Raphaël) | https://www.hotellesrochesrouges.com | H-design | **Hand-drawn wayfinding illustrations** with handwritten labels (Réception, Spa 2e étage), a model for illustrating our services (solar, water, internet). | `rochesrouges-d-fold`, `rochesrouges-d-s2` |
| 8 | **Our Habitas** | https://www.ourhabitas.com | H-nature (collection) | Film grain on the hero, wide-tracked caps titles, tall cards with outline pill CTAs, a split statement and image layout. | `habitas-d-fold`, `habitas-d-s2` |
| 9 | **Freehand Hotels** | https://freehandhotels.com | **H-budget** | Condensed caps voice, a tilted "paper" card over the photo, a vertical "BOOK A ROOM" side tab. Shows energy without luxury cues. | `freehand-d-fold`, `freehand-d-s2` |
| 10 | **Casa Cook** | https://www.casacook.com | H-design (boutique brand) | Condensed headings + typewriter mono location details on earthy bands, a crafted ledger feel. Negative: a survey modal plus a booking bar cover content. | `casacook-d-fold`, `casacook-d-s4` |
| 11 | **Mashpi Lodge** (Ecuador cloud forest) | https://www.mashpilodge.com | H-nature (Andes–Amazon region, the same biome family as Mocoa) | Shows the *generic* nature-lodge look we must avoid: uppercase sans over a dark jungle photo, a lime CTA, a booking bar. Positive: "Why book directly" link, phone in the header. | `mashpi-d-fold`, `mashpi-d-s2` |
| 12 | **Playa Viva** (Mexico) | https://www.playaviva.com | H-nature (off-grid, solar) | Tells **solar / off-grid** as an impact story ("100 % solar"), relevant to our solar panels. WhatsApp FAB. Negative: a grey placeholder hero at first paint. | `playaviva-d-fold`, `playaviva-d-s2` |
| 13 | **Juvet Landscape Hotel** (Norway) | https://www.juvet.com | H-nature (small) | A full-bleed video hero with centred kicker + headline: the cliché, done cleanly. Reference for header/kicker spacing only. | `juvet-d-fold` |
| 14 | **Hoshinoya** (Hoshino Resorts) | https://hoshinoya.com/en/ | H-design | Price anchor in the header ("1 Night 1 Guest USD155–"). **Anti-pattern:** a spinner over a dark gradient for several seconds before any content. | `hoshinoya-d-fold` |
| 15 | **Lapa Rios Lodge** (Costa Rica) | https://www.laparios.com | H-nature | WhatsApp number in the top utility bar. **Anti-pattern:** a blank page with a spinner at 4 s. | `laparios-d-fold`, `-d-s2` |
| 16 | **Wildlife Luxuries** (India) | https://www.wildlifeluxuries.com | H-nature. Awwwards HM 2023-12-07 | Illustrated emblem logo plus a "Chat with us" WhatsApp link in the utility bar. Light, minimal build. | `wildlifelux-d-fold` |
| 17 | **Wilmina** (Berlin) | https://www.wilmina.com | H-small (design hotel in a former prison) | Inset framed video/photo with a white margin, minimal header. Calm framing of a modest courtyard. | `wilmina-d-fold` |
| 18 | **Sanders** (Copenhagen) | https://www.hotelsanders.com | H-small (54 rooms) | Warm, low-light interior hero with thin gold rules. Interiors-only photography made atmospheric (we also only have interiors). | `sanders-d-fold` |
| 19 | **Awwwards — Hotel/Restaurant** category | https://www.awwwards.com/websites/hotel-restaurant/ | G | Current hotel winners: *Casa Momo* (giant serif word split across a two-image diptych), *Terreno — "un hotel con alma de barrio"* (Spanish copy, condensed caps over a facade), *A sanctuary of quiet ease* (serif + script mix, framed photo). | `gal-awwwards-hotel-restaurant-1/-2` |
| 20 | **Dribbble** searches ("hotel website", "boutique hotel landing", "eco lodge website") | https://dribbble.com/search/hotel-website | G | A useful **negative baseline**: most shots are the generic template (rounded photo cards, booking widgets, stock nature). Positive outliers: *LU/MIÈ/RE* (stacked giant letters over a photo) and *The Withmore* (spaced serif + image diptych). | `gal-dribbble-*` |
| 21 | **Behance** searches ("hotel website", "eco lodge website", "boutique hotel landing page") | https://www.behance.net/search/projects/hotel%20website | G | Brand-led concepts: *Madinat Hotel* (deep green + serif + script, close to our palette), *Orias* (letter-spaced serif over a photo), *Hostal* (stamp/craft branding on kraft paper, close to the Letrero direction). | `gal-behance-*` |
| 22 | **Codrops** demos (tags clip-path, scroll) | https://tympanus.net/codrops/demos/ | C | Technique references: "Pinned image mask reveal on scroll" (Sep 2025), ScrollTrigger clip-path sections (Feb 2025). | `codrops-demos-*` |
| 23 | **Aceternity UI** (parallax scroll, hero parallax, sticky scroll reveal, focus cards) | https://ui.aceternity.com | C | Sticky scroll reveal and focus cards map to our sticky-story and gallery ideas. Dark-mode-first, so restyle. | `aceternity-*` |
| 24 | **Magic UI** (marquee, text reveal, blur fade) | https://magicui.design | C | The marquee fits the B "facts strip". The text reveal fits the A statement band. MIT, but depends on Motion, so port to CSS/GSAP. | `magicui-*` |
| 25 | **React Bits** (split text) | https://reactbits.dev | C | Split-text reveal patterns. Licence verified 2026-11-04 from `LICENSE.md` in github.com/DavidHDev/react-bits: "MIT + Commons Clause License Condition v1.0". Use in a website is allowed, including commercially; selling, sublicensing or redistributing the components themselves is not. | `reactbits-*` |
| 26 | **The Hoxton** | https://thehoxton.com | H-design (urban, mid-price brand) | Desktop: the page was a **blank cream screen at 4 s** with nothing painted (a first-paint anti-pattern). Mobile rendered a promo bar, a city photo with "Welcome to The Hoxton" in large light sans, and a booking form, all covered by a long cookie text panel. Take: the friendly, plain-spoken header copy. Avoid: blank first paint, a cookie wall over the hero. | `hoxton-d-fold`, `hoxton-m-fold` |
| 27 | **Inkaterra Reserva Amazónica** (Peru) | https://www.inkaterra.com/inkaterra/inkaterra-reserva-amazonica/ | H-nature (Amazon, 35 cabañas) | The closest biome peer (Amazon lowland). The page showed a short landscape photo band of a cabaña over the river with a "Watch the video" outline button, a teal property bar, a sub-nav row (Cabañas, Dining, Spa, Services…), then a centred serif H1 and a photo + justified-text split. Take: concrete facts in the intro ("35 wooden cabanas", "540 bird species"), a sub-nav per property. Avoid: two stacked nav bars, justified body text, a magenta "Book now" that fights the palette. | `inkaterra-d-fold` |
| 28 | **Nolinski Paris** | https://www.nolinskiparis.com | H-design (luxury city) | Full-bleed facade video with a centred serif wordmark plus an italic "Paris", a widely tracked caps nav row under a hairline, an outline "BOOK" box, and a **booking form bar** at the bottom of the fold. Take: hairline rule + tracked caps nav (direction A header), the italic place word under the wordmark. Avoid: booking widget (we have none), video hero. | `nolinski-d-fold` |
| 29 | **Treehotel** (Sweden) | https://www.treehotel.se | H-nature (design treerooms) | Full-bleed forest photo, white thin-line logo, an orange round "Book now" pill, and a row of room names along the bottom of the fold (Oasis, Biosphere, Mirrorcube…). A **Cookiebot modal covered the centre** of the hero at first paint. Take: room names as a navigable row on the hero (a fit for the room index). Avoid: blocking consent modal. | `treehotel-d-fold` |

Galleries attempted and their results are in the section [Gallery capture log](#gallery-capture-log).

---

## Top-8 analyses (template 7.3)

### 1. Paradero Todos Santos

| Field | Content |
|---|---|
| URL and type | https://www.paraderohotels.com: aspirational design reference (desert design hotel, 35 suites) |
| Value proposition | Title: "Paradero Todos Santos \| Design Hotel in Baja California Sur". The first viewport *shows* the place (entrance + aerial) rather than saying anything. |
| Structure | Diptych hero → Suites / Villas split → Experiences (food, rituals) → … (newsletter modal interrupts) |
| Hero | **Two portrait-ratio photos side by side, full height**, a thin spaced-caps wordmark centred on top, "MENU +" left, an outline "RESERVE" right, a sound toggle. Mobile: the two images stack. |
| Conversion | Outline "Reserve" (booking engine) top-right, always visible |
| Prices and policies | Not on the home page |
| Motion | Calm fades. The scrolled section uses large overlapping images. |
| Visual | Earth/concrete palette, wide-tracked serif caps logo, very few words |
| Performance | Webflow. A 54 KB HTML shell, images load progressively. **Newsletter modal on scroll** (anti-pattern). |
| SEO | Title ✓, meta description missing, JSON-LD `Hotel`, `GeoCoordinates`, `LocationFeatureSpecification`, `Organization` |
| Take | **Portrait diptych hero**, a single outline CTA, image-first restraint, rich `Hotel` schema with amenity features |
| Avoid | Email-capture modal, hiding text over dark images, no meta description |

### 2. Hotel Odisej

| Field | Content |
|---|---|
| URL and type | https://www.hotelodisej.com: design reference. Awwwards Honorable Mention 2023-06-22 (Bornfight). Colours `#5B6647`, `#03364F`. |
| Value proposition | A centred "Hotel Odisej / MLJET" wordmark over an aerial of the bay: a sanctuary near Mljet National Park |
| Structure | Hero → arrival story in giant type ("…passenger or car ferry from Dubrovnik.") on an olive band with a double **wave edge** → "Sweeping view of the…" → staggered room photos → **numbered room list** (Classic 01 / Superior 02 / Deluxe 03) → … |
| Hero | Full-bleed landscape photo, large soft-serif wordmark top-centre, hamburger left, "Online Check-in" (outline) + "Book now" (olive pill) right |
| Conversion | "Book now" pill always top-right |
| Prices and policies | Not on the home page |
| Motion | Statement text fades from pale to full colour as it scrolls (word or line colour scrub), list rows reveal, photos stagger |
| Visual | Olive, cream and navy. A soft display serif plus a clean grotesk. Rounded photo corners. Rooms are **ordinary** (wood furniture, blue curtains) yet look premium. |
| Performance | WordPress. A 156 KB HTML. Mobile hero image looked soft/upscaled. |
| SEO | Meta description ✓, empty `<title>` in served HTML (likely injected), JSON-LD breadcrumbs/images (Yoast) |
| Take | **Giant statement bands**, an organic section edge, a **numbered room index**, staggered portrait pairs, a single pill CTA |
| Avoid | Upscaled hero on mobile, an empty title tag |

### 3. KEX Hostel & Hotel

| Field | Content |
|---|---|
| URL and type | https://kexhostel.is: **budget** brand, aspirational for "crafted, not luxury" |
| Value proposition | Diptych: "HOSTEL: budget stays, social space, comfy bunk" / "HOTEL: private room & bathroom, your own space, stay in style" |
| Structure | Diptych chooser → horizontal photo strip → amenity icon row (Private & shared rooms · On-site bar · Downtown location · Lively social spaces) → "KEX IS MORE THAN A BED." with an engraved pointing-hand illustration → … |
| Hero | Two full-height interior photos, condensed caps titles, **monospace** subtitles, a round hamburger, a vertical stacked "K / E / X" rail, a round "Book a stay" stamp bottom-left. Mobile: stacked cards with a round "BOOK" top-right. |
| Conversion | A round "Book a stay" button, fixed |
| Prices and policies | Not on the home page |
| Motion | Light. Mostly static, with hover states. |
| Visual | Warm browns and cream, wallpaper texture under dark bands, vintage engraving illustration, condensed slab caps + typewriter mono |
| Performance | A **498 KB HTML** (heavy inline). Images are dark and atmospheric. |
| SEO | Meta description ✓ ("Housed in an old biscuit factory…"), no JSON-LD detected, empty title in served HTML |
| Take | **Interior-only photos made atmospheric**; round stamp CTA; a vertical letter rail; an honest amenity line; budget confidence |
| Avoid | Monospace for long body copy (slow to read), heavy HTML, missing schema |

### 4. Casa Angelina

| Field | Content |
|---|---|
| URL and type | https://www.casaangelina.com: **small family pensión** (closest analog in scale, honesty and language) |
| Value proposition | "Hay lugares que invitan a *quedarse*." plus a paragraph naming the place (O Grove, Rías Baixas) and activities |
| Structure | Hero → La casa (photo with caption "La casa · San Vicente de O Grove") → "02 / EL DESCANSO: Dormir bien. Despertar sin prisa." + room spreads → El entorno → Fotografías → Tarifas |
| Hero | Full-bleed facade photo with a blue scrim, a kicker "PENSIÓN FAMILIAR · RÍAS BAIXAS", a large serif H1 with an italic accent word, a body paragraph, a white pill CTA, a footer kicker "GALICIA · SAN VICENTE DE O GROVE" |
| Conversion | A terracotta "Consultar estancia" pill in the header plus in-section outline pills |
| Prices and policies | Has a "Tarifas" nav item. Rooms list facts (baño privado, TV, calefacción, wifi). |
| Motion | Minimal |
| Visual | A transitional serif (Times-like) for display, a sober sans for body, light blue section bands, terracotta CTA, numbered kickers |
| Performance | A **15.7 KB HTML**, very light. A consent banner with an equal-weight reject (good GDPR practice). |
| SEO | Title ✓, description ✓, JSON-LD `LodgingBusiness`, `PostalAddress`, `GeoCoordinates`, `Rating` |
| Take | **Numbered kickers**, an italic accent word, honest room spreads with chips, Spanish microcopy tone, local-business schema, lightness |
| Avoid | The full-bleed facade at a high scrim (we have no facade), generic serif (pick a characterful display face) |

### 5. SILENA, your soulful hotel

| Field | Content |
|---|---|
| URL and type | https://www.silena.com/en: design reference. Awwwards HM 2023-03-24. |
| Value proposition | "A fairy-tale location on the edge of the forest… 48 rooms. A restaurant." in large light sans |
| Structure | Framed hero → about with staggered photos → "FEATURES" statement → rooms → food → … |
| Hero | Photo **inset with a white margin** (frame), the logo above, a hamburger left, two **circular CTA bubbles** ("BOOK" terracotta, "ENQUIRE" olive) overlapping the top-right corner |
| Conversion | Two persistent circles: book and ask |
| Prices and policies | Not on the home page |
| Motion | Per the Awwwards element credits: GSAP + ScrollTrigger, barba.js page transitions, smooth scroll |
| Visual | Warm sand band, light large grotesk, tiny tracked caps labels, earthy terracotta and olive accents |
| Performance | Cookiebot modal at first paint (blocks the view until a choice is made) |
| SEO | Title ✓, no meta description, JSON-LD `Organization`, `WebSite`, `PostalAddress` |
| Take | **Framed inset hero**, **circular CTA pair**, **factual statement typography** (a great fit for "16 habitaciones. Paneles solares…") |
| Avoid | Light weights too thin for low-DPI screens, a consent modal that blocks |

### 6. Ett Hem

| Field | Content |
|---|---|
| URL and type | https://www.etthem.se: **small hotel** (12 rooms), aspirational for identity-led design |
| Value proposition | "For people looking for something more personal than the luxury hotel" |
| Structure | Illustration hero → positioning sentence → badges (SLH, Condé Nast) → "Get in touch" (email + phone in italic serif) → small links |
| Hero | **No photograph**: a hand-drawn ink figure resting, a playful green "roof" over the wordmark, outline "BOOK A ROOM / BOOK A TABLE" boxes |
| Conversion | Two outline buttons top-left |
| Prices and policies | None |
| Motion | Minimal |
| Visual | Warm grey paper, ochre type, ink illustration, a humanist serif |
| Performance | Very light page |
| SEO | Title ✓, description ✓, Yoast breadcrumbs |
| Take | **Illustration as identity**, a quiet typographic footer, confidence to say less |
| Avoid | Hiding rooms entirely. Bambú needs rooms visible early for WhatsApp conversion. |

### 7. Les Roches Rouges

| Field | Content |
|---|---|
| URL and type | https://www.hotellesrochesrouges.com: design reference (5-star) |
| Value proposition | "LUXURY HOTEL IN SAINT-RAPHAËL / PERCHED ABOVE THE SEA" |
| Structure | Video hero + booking bar → sub-nav row → intro split → **illustrated wayfinding map** (Grand bain de soleil, La Chicoula, Réception, Spa 2e étage) → … |
| Hero | Full-bleed video, condensed caps H1, a kicker, a booking widget |
| Conversion | "BOOK" in the header plus a booking bar |
| Prices and policies | "Special offers" in the sub-nav |
| Motion | Video plus light reveals |
| Visual | Condensed sans caps, a script logo for the group, cobalt-blue hand drawings, cream background |
| Performance | A 354 KB HTML plus video. A season banner. |
| SEO | Title ✓, description ✓, JSON-LD `Hotel`, `GeoCoordinates`, `LocationFeatureSpecification` |
| Take | **Hand-drawn service illustrations with handwritten labels**: our services section in direction A |
| Avoid | Video hero, booking bar (we have no engine), sub-nav clutter |

### 8. Our Habitas

| Field | Content |
|---|---|
| URL and type | https://www.ourhabitas.com: nature/design collection |
| Value proposition | "Luxury for the Soul": sustainable hotels |
| Structure | Full-bleed hero → horizontal destination cards → split statement "A KINGDOM OF WONDERS" + tall image → … |
| Hero | Full-bleed photo with **visible film grain**, a centred thin wordmark, "BOOK" text link |
| Conversion | A text-only "BOOK" top-right |
| Prices and policies | None on the home page |
| Motion | Horizontal card scroller, header blur on scroll |
| Visual | Wide-tracked caps titles, a light didone-ish serif statement, outline pill CTAs, sand and warm photos |
| Performance | A **1.18 MB HTML** (very heavy WordPress). Cookie bar. |
| SEO | Title ✓, description ✓, Yoast schema |
| Take | **Grain overlay**, tracked caps titles, outline pill CTAs, the split statement layout |
| Avoid | HTML weight, landscape-only imagery assumptions |

---

## Local competitors (Mocoa/Putumayo)

Secondary by owner decision (design quality comes from the global references). Searched 2026-11-04 with web searches for "hotel Mocoa Putumayo sitio web oficial", "hotel en Mocoa reservas", named hotels plus "Mocoa", and direct `curl` probes of likely domains.

**Finding: only one Mocoa hotel found has a working website of its own.** The rest exist only as OTA listings (Booking.com, Expedia, Hotels.com, Trip.com, Atrápalo), Facebook pages or the national tourism directory. This is itself the main competitive insight: a clear, fast, honest site with a direct WhatsApp channel is already a differentiator in Mocoa.

### Hotel Mocoa Samay (the only local site found)

| Field | Content |
|---|---|
| URL and type | https://hotelmocoasamay.com: local competitor, city hotel (likely the closest direct competitor: business and leisure guests, "Para Empresas" offer) |
| Value proposition | "Tu hotel en el Putumayo, Colombia" / "Disfruta de una experiencia única en la Amazonía Colombiana." |
| Structure | Hero → "Bienvenidos" (long generic paragraph) → "Nuestras Habitaciones" slider (Estándar: 15 rooms of 27.5 m²; Estándar Doble: 4; Estándar Triple: up to 4 people) → "Nuestros Logros" → footer with phone and e-mail |
| Hero | The capture showed a full-width photo of the lobby lounge (wicker sofas, a glass table) under a heavy navy scrim, with the H1 and subtitle inside a translucent grey box, a green "Reservar" button, a "Solicita tu crédito" white pill and a "Para Empresas" link. A curved white edge closes the hero. Mobile: the same box stacked, the socials in a second header row, and the H1 over three lines. |
| Conversion | "Reservar" buttons and a "Pago Online" nav item; phone +57 318 308 4187 and e-mail in the footer. No WhatsApp link was found in the page. |
| Prices and policies | No prices on the home page |
| Motion | An Elementor background slideshow in the hero; slider for rooms |
| Visual | Navy header, a geometric sans (Poppins-like), stock-green CTA, a script wordmark. Generic WordPress template. |
| Performance | Lighthouse mobile: **34**, LCP 7.53 s, TBT 4,682 ms, CLS 0, 1.6 MB. LCP is the slideshow background image, with a 3.6 s resource load delay. |
| SEO | Title "Hotel Mocoa Samay – Sitio Oficial Hotel Mocoa Samay"; **no meta description**; no JSON-LD found; WordPress 5.7 (2021, outdated) |
| Take | Concrete room facts (count per type, 27.5 m²), a business-guest offer |
| Avoid | Text in a grey box over a dark scrim, generic welcome copy, slow slideshow LCP, no WhatsApp, no schema |

### Listing-only competitors (no own website found)

| Hotel | Where it appears | What listings show (unverified, often inconsistent) |
|---|---|---|
| Hotel Suma Wasi / Sumawasi | Booking.com, Expedia, Trip.com, Hotels.com | Pool, garden, terrace, restaurant (Miski Mikui), outside the centre on the road to Pasto. `hotelsumawasi.com` answers with an empty page; a third-party page (pelecanus.com.co) returns 410. |
| Hotel Marli Plaza | Atrápalo, Momondo, Booking.com | City centre; fan or A/C rooms, restaurant, Wi-Fi, airport transport. Cheapest Mocoa rate seen on Momondo (about USD 23/night). |
| Hotel Patio Bonito | Booking.com, eDreams | A/C, 24 h reception, free Wi-Fi, room service |
| Hotel Central – Mocoa | Expedia, Orbitz, Hotele.pl | 2-star, Calle 8 No 6-18, connected to a shopping centre (Atrápalo gives the same address to Marli Plaza) |
| Hotel Mecaya | colombia.com tourism-provider directory | Centre (Cl 9 # 7-22), 20 rooms; phone and e-mail only |
| Posada Turística Dantayaco | Expedia, Orbitz | Near the Fin del Mundo waterfall trail, 24 h front desk. `dantayaco.com` did not respond. |
| El Ensueño Ecohostal & Glamping | Facebook, Booking-network sites | Garden-view rooms with balconies; Facebook is the only direct channel |

Implications for Bambú:

- Guests compare Mocoa hotels on OTAs by a short list of facts: **A/C, hot water, free Wi-Fi, 24 h reception, parking, breakfast**. Bambú must state these clearly once the hotel confirms them (see `amenity-model.md` § 5 and `docs/pendientes-hotel.md` § E).
- None of the local players offers a one-tap WhatsApp channel on its own site. Bambú's primary CTA already does.
- The local SEO bar is low (no descriptions, no schema). Bambú's `Hotel` JSON-LD with `amenityFeature` and a real meta description will stand out in local results.

Sources: [Booking.com Mocoa](https://www.booking.com/accommodation/city/co/mocoa.en-gb.html), [Atrápalo Mocoa](https://www.atrapalo.com/hoteles/america/colombia/putumayo/mocoa/), [Momondo Mocoa](https://www.es.momondo.com/hoteles/mocoa), [Expedia Hotel Central](https://www.expedia.ca/Mocoa-Hotels-Hotel-Central-Mocoa.h37800905.Hotel-Information), [Expedia Sumawasi](https://www.expedia.co.uk/Mocoa-Hotels-HOTEL-SUMAWASI.h112511458.Hotel-Reviews), [eDreams Patio Bonito](https://hotels.edreams.co.uk/hotel/co/patio-bonito-mocoa.en-gb.html), [colombia.com Hotel Mecaya](https://www.colombia.com/turismo/prestadores-de-servicios-turisticos/i19125/hotel-mecaya), [Expedia Dantayaco](https://www.expedia.com/Mocoa-Hotels-Posada-Turistica-Dantayaco.h19427512.Hotel-Information) (fetched via search results 2026-11-04).

## Measured performance (Lighthouse mobile)

Measured 2026-11-04. Lighthouse 13.6.0, mobile defaults (simulated slow 4G and 4× CPU throttle), performance category only, Chromium from `mcr.microsoft.com/playwright:v1.64.1-noble`, run in Docker from a residential connection in Colombia. **One run per site**, so treat each number as ±20 %. Server response times (TTFB) include the distance to Europe, which inflates LCP for European hosts. All 8 top references and the local competitor completed; there were no failures.

| Site | Score | LCP | TBT | CLS | Transfer | LCP element |
|---|---|---|---|---|---|---|
| Paradero | 36 | 5.83 s | 2,277 ms | 0.00 | 2.5 MB | Hero split image (portrait) |
| Hotel Odisej | 58 | 6.94 s | 85 ms | 0 | 0.7 MB | Aerial hero image; observed TTFB 4.9 s |
| KEX Hostel | 75 | 3.45 s | 386 ms | 0.003 | 1.2 MB | Hero text ("Hostel / Budget stays…") |
| Casa Angelina | **95** | **2.72 s** | 27 ms | 0.064 | 1.2 MB | Hero facade image |
| SILENA | 65 | 10.53 s | 96 ms | 0 | **21.6 MB** | A mobile hero **video** |
| Ett Hem | 62 | 9.94 s | 77 ms | 0.003 | 1.5 MB | Illustration image; observed TTFB 5.0 s |
| Les Roches Rouges | 48 | 3.41 s | 5,690 ms | 0.061 | 1.9 MB | Video poster image |
| Our Habitas | 32 | 5.68 s | **7,323 ms** | 0 | 3.9 MB | Hero image |
| *Local:* Hotel Mocoa Samay | 34 | 7.53 s | 4,682 ms | 0 | 1.6 MB | Slideshow background image |
| *Bambú v1* home `/` | 100 | 1.06 s | 68 ms | 0 | 0.5 MB | Consent banner text (fresh visit) |
| *Bambú v1* room detail | 48–80 | 4.26–5.60 s | 270–1,983 ms | 0 | 0.55 MB | Room photo (see `art-direction-briefs.md` § v1 LCP baseline) |

Takeaways:

- Award-level design does not need heavy pages, but most of these sites are heavy: only Casa Angelina (a 15.7 KB HTML, plain images) scores in the green. It is also the closest analog to Bambú in scale.
- The worst offenders combine a video hero (Silena 21.6 MB, Roches Rouges) or heavy JavaScript (Habitas, Roches Rouges, Paradero TBT > 2 s). This confirms req. 8.4: no video hero by default, and the motion budget in [`motion-spec.md`](./motion-spec.md).
- The redesign must keep v1's lead: LCP ≤ 2.5 s target, CLS < 0.1, TBT ≤ 200 ms on the room detail.

---

## Flow notes (req. 7.2 R4)

- **Clicks to contact:** every top reference keeps one conversion control visible at all times (header pill or round stamp). The best small-hotel examples (Casa Angelina, Ett Hem) put contact in the header *and* the footer. For Bambú, WhatsApp is reachable in 1 click from any viewport (header pill + FAB), and the room detail pre-fills the room name (already implemented).
- **What mobile shows first:** a place/brand statement + one image + one CTA (Odisej, Casa Angelina, KEX). None put a long paragraph above the fold on mobile except Casa Angelina, which works because the copy is specific.
- **Price display:** only Hoshinoya anchors a price in the header. Small hotels show "Tarifas" as a page. Bambú keeps "Desde $ …" on room entries only when published (req. 4.4).
- **Anti-patterns observed:** spinners and loaders (Hoshinoya, Lapa Rios), blank first paint (Playa Viva grey hero, The Hoxton blank cream at 4 s), newsletter or survey modals (Paradero, Casa Cook), blocking cookie modals (Silena, Casa Cook). Bambú's consent UI must stay a non-blocking banner.

## SEO notes (req. 7.2 R5)

- The best practice seen: `Hotel` or `LodgingBusiness` JSON-LD with `GeoCoordinates`, `PostalAddress` and `amenityFeature` / `LocationFeatureSpecification` (Paradero, Les Roches Rouges, Casa Angelina). v1 already emits hotel JSON-LD, so add `amenityFeature` entries for the verified features (solar power, water reserve, internet).
- Several award sites ship an empty `<title>` in server HTML or no meta description (Odisej, KEX, Paradero, Silena). Our SSR metadata is already ahead, so keep it.

---

> Google Business Profile presence and rich-results/Schema validator checks (req. 7.2 R5) are deferred to R6 (quality), where they run against the redesigned Bambú site.

## Gallery capture log

All captures: Playwright/Docker, 1440×900, `<name>-1` (load + 5–7 s) and `<name>-2` (after scrolling 800 px). Transient, not committed (see [`design-research.md`](./design-research.md#screenshot-and-copyright-policy)).

| Gallery | URL captured | HTTP | Result | What we took |
|---|---|---|---|---|
| Dribbble "hotel website" | https://dribbble.com/search/hotel-website | 202 (rendered) | ✓ Grid visible | **Negative baseline.** About 90 % show the generic template: rounded photo cards, a booking widget over a landscape hero, stock interiors ("Grand Emily Hotel", "Vanya"). This is exactly the "plantilla genérica" req. 6.1 tells us to avoid. |
| Dribbble "boutique hotel landing" | https://dribbble.com/search/boutique-hotel-landing | 202 | ✓ | *LU/MIÈ/RE* (Kris Anfalova): **stacked giant letters** over a warm photo, which supports direction B. *The Withmore*: spaced serif title + two-image diptych, which supports direction A. |
| Dribbble "eco lodge website" | https://dribbble.com/search/eco-lodge-website | 202 | ✓ | Mostly stock-landscape concepts with no transferable idea. Reinforces "don't fake nature". |
| Behance "hotel website" | https://www.behance.net/search/projects/hotel%20website | 403 status but the page rendered | ✓ | *Madinat Hotel* (deep green + serif + script, the palette closest to ours), *Orias* (letter-spaced serif across the photo), *Colivana* (editorial serif). |
| Behance "eco lodge website" | https://www.behance.net/search/projects/eco%20lodge%20website | 403 / rendered | ✓ | *Hostal* branding (Jérémy Comalada): **stamp + kraft paper + line icons**, a craft identity for a budget stay → direction B (and A's illustration line). Others are generic mock-ups. |
| Behance "boutique hotel landing page" | https://www.behance.net/search/projects/boutique%20hotel%20landing%20page | 403 / rendered | ✓ | Mock-up-heavy. Low value. |
| Awwwards Hotel/Restaurant | https://www.awwwards.com/websites/hotel-restaurant/ | 200 | ✓ (1,984 sites) | *Casa Momo* (giant serif word split across a 2-image diptych), *Terreno* ("un hotel con alma de barrio": Spanish, condensed caps), *A sanctuary of quiet ease* (serif + script, framed photo), a *Wayfinding icons* resource |
| Awwwards Odisej / Silena pages | https://www.awwwards.com/sites/hotel-odisej, …/silena-your-soulful-hotel | 200 | ✓ | Award level and date, credits (Bornfight; hantha.), palette |
| Godly | https://godly.website/?search=hotel, /websites/hotel, /websites/travel | 200 | ⚠ All three URLs render the generic "Recent" feed (title "Recent — Design Inspiration"). The search and category params are not honoured server-side for an anonymous headless session. | No hotel-specific entries obtained. Not used. |
| Lapa Ninja | https://www.lapa.ninja/search/?q=hotel (the /category/… URLs return 404) | 200 | ⚠ 14 results listed (Aguas de Ibiza Hotel, Château Boll, MARRAM, 53 West 53…) but **thumbnails did not load** (lazy images; alt text only) | Names only. Not analysed visually. |
| SiteInspire | https://www.siteinspire.com/websites?search=hotel | 200, then **429** on retries | ⚠ The search param was ignored (generic feed); subject URLs were rate-limited (429) | Not used. |
| One Page Love "hotel" | https://onepagelove.com/tag/hotel | 200 | ✓ 8 examples | *Delparco Hotel* (**portrait diptych on white**, very close to our hero idea), *Eagle's Nest* (eco resort: big serif over jungle + an editorial "Country / Elevation" data table + map → direction A "Cómo llegar"), *The Water Rat Hotel* (red circular "What's on?" **stamp**), *Lue Hotel* (kraft collage, too busy) |
| **Pinterest** | https://www.pinterest.com/search/pins/?q=boutique%20hotel%20website%20design | 200 | ⚠ **Blocked by a login wall**: a modal "Welcome to Pinterest / Log in" covers the results. Pin thumbnails are partly visible behind it but cannot be opened or attributed without an account. | Not used as evidence (no attributable sources). |

## Component and technique demos (captured)

| Source | Demo | Capture | Observed | Use for Bambú | License |
|---|---|---|---|---|---|
| Codrops | Tag clip-path (Manoela Ilic Apr 2026; Gwen Bogaert grid May 2025; Moussa Mamadou ScrollTrigger sections Feb 2025) | `codrops-demos-clip-path-1/-2` | Clip-path wipes over portrait imagery, split headline masks | Plate reveals (A), pinned clip-path expand "Escalera" (B) | Per demo repo (mostly MIT on github.com/codrops). Re-implement. |
| Codrops | Tag scroll: *CANOPY* (Manoela Ilic, Oct 30 2026, gsap + webgl: misty forest with a torn organic edge), *The Living Ridge* (Surya Aditya, Jul 30 2026: editorial infinite scroll + page transition with portrait plates) | `codrops-demos-scroll-1/-2` | Organic/torn edges over mist; editorial plates with serif titles | The mist and torn edge suit Mocoa's rain-forest mood: imitate it with a **static SVG torn edge** (no WebGL, req. 8.1 tier 5). The Living Ridge plates are close to the direction A "Láminas". | Same |
| Aceternity | Parallax Grid Scroll | `aceternity-parallax-scroll-1` | **Three portrait columns** scrolling in opposite directions | A gallery mode made *for* portrait photos (B, desktop only, reduced-motion off) | Aceternity item license (client end products OK; no redistribution) |
| Aceternity | Hero Parallax | `aceternity-hero-parallax-1/-2` | Tilted 3D rows of landscape cards | Low fit: landscape-only, heavy | Same |
| Aceternity | Sticky Scroll Reveal | `aceternity-sticky-scroll-reveal-1` | Sticky media panel + text steps (dark, gradient) | Pattern for the "Sobre nosotros" / "Escalera" sticky story. Restyle to light/paper. | Same |
| Aceternity | Focus Cards | `aceternity-focus-cards-1` | 3-column portrait cards. Hover blurs the siblings. | Room/gallery hover state (desktop). Must also work on `:focus-visible`. | Same |
| Magic UI | Text Reveal | `magicui-text-reveal-1/-2` | Words go from pale to ink as you scroll (scrubbed opacity), the same effect seen on Odisej | Direction A "Declaración" band | MIT (depends on Motion; port to GSAP/CSS `animation-timeline`) |
| Magic UI | Marquee | `magicui-marquee-1/-2` | Infinite horizontal loop | Direction B "Franja de datos" (needs a pause button) | MIT |
| Magic UI | Blur Fade | `magicui-blur-fade-1/-2` | Blur + fade entrance | Low. `filter: blur` animation is costly on mid-range Android. Prefer opacity/transform. | MIT |
| React Bits | Split Text | `reactbits-split-text-1/-2` | Per-char/word GSAP SplitText entrance | Hero H1 (line mode, not chars) | MIT + Commons Clause |

## Screenshot index (where each idea came from)

| Idea | Screenshot(s) |
|---|---|
| Portrait diptych hero | `paradero-d-fold`, `kex-d-fold`, `gal-onepagelove-hotel-1` (Delparco), `gal-awwwards-hotel-restaurant-1` (Casa Momo) |
| Giant statement bands + organic edge | `odisej-d-s2` |
| Numbered room index | `odisej-d-s4` |
| Numbered kickers + italic accent + honest rooms | `casaangelina-d-fold`, `casaangelina-d-s2` |
| Factual statement typography | `silena-d-s2` |
| Circular CTA bubbles / stamps | `silena-d-fold`, `kex-d-fold`, `gal-onepagelove-hotel-2` (Water Rat) |
| Illustration-led identity | `etthem-d-fold`, `rochesrouges-d-s2`, `kex-d-s2` |
| Grain, tracked caps, outline pills | `habitas-d-fold`, `habitas-d-s2` |
| Condensed caps, tilted paper card, vertical tab | `freehand-d-fold`, `freehand-d-s2`, `casacook-d-s4` |
| Stacked giant letters | `gal-dribbble-boutique-hotel-landing-1` (LU/MIÈ/RE), the hotel's own sign (photo #35) |
| Anti-patterns (loaders, modals, generic templates) | `hoshinoya-d-fold`, `laparios-d-fold`, `paradero-d-s2`, `casacook-d-s4`, `gal-dribbble-hotel-website-1`, `mashpi-d-fold` |
