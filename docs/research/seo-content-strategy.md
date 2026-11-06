# SEO and Content Strategy: Hotel Bambú Plaza (Mocoa, Putumayo)

Research date: 2026-11-05. Scope: a small independent hotel (16 rooms) with a Spanish site in Next.js 16 (SSR, real routes, sitemap, OG, canonicals). There is no booking engine, and conversion goes through WhatsApp.

Labels: **[Verified]** means checked against a primary source during this research. **[Industry]** means a reputable secondary source or a vendor. **[Opinion]** means practitioner judgment, including mine. The numbers in brackets point to the Sources list.

---

## 1. TL;DR: top 10 actions ranked by impact

1. **Claim, verify and complete the Google Business Profile (GBP)** with the primary category "Hotel", the exact address, a local phone number, every hotel attribute, check-in and check-out times, and many real photos. Google says local ranking depends on relevance, distance and prominence, and that complete, accurate profiles are more likely to appear [Verified, 5]. For "hotel en Mocoa" the map pack and Google Hotels sit above any organic result, so this is the biggest lever [Industry, 17].
2. **Run a review engine.** After checkout, send a WhatsApp message with the GBP review link, and reply to every review. More reviews and higher ratings help local ranking [Verified, 5].
3. **Rebuild the landing page around the questions guests use to decide**, in this order: where it is, how much it costs, what the rooms look like, what other guests say, and how to book. Unique first-hand facts beat generic copy, and this is also what Google's AI features favor [Verified, 2, 3].
4. **Give every room type its own URL** with real photos, bed setup, occupancy, a "desde $X COP/noche" price signal and a WhatsApp CTA with a prefilled message. [Opinion, supported by 9 and 13]
5. **Publish one strong "Ubicación y cómo llegar" page and one "Qué hacer en Mocoa" guide written from first-hand knowledge**: distances and travel times to Fin del Mundo, Ojo de Dios, Paway, the terminal and the airport, plus the hotel's own tips. This is how you rank for "hotel cerca de Fin del Mundo" without creating doorway pages [Verified, 3, 11].
6. **Ship a single JSON-LD `@graph`**: `Hotel`, with `HotelRoom` linked through `containsPlace` and an `Offer` for each room, plus `BreadcrumbList` and `WebSite`. Its content must match what is visible on the page [Verified, 4, 7, 8].
7. **Keep NAP identical everywhere**: site footer, GBP, Booking/Expedia/Airbnb/TripAdvisor, Facebook/Instagram, and Colombian directories (RNT, colombia.travel). NAP consistency is a low-weight but real trust signal [Industry, 18].
8. **Meet Core Web Vitals on mobile** at the 75th percentile: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1. Hero images are the usual LCP problem [Verified, 6].
9. **Do image SEO properly**: descriptive filenames in Spanish, real alt text, `srcset`, AVIF/WebP, images placed next to the text they illustrate, and a deliberate `og:image` [Verified, 12].
10. **Explore free booking links** through GBP and Hotel Center, so the "official site" rate shows in Google Hotels. Eligibility is unconfirmed for a property with no booking engine (see §6) [Verified partially, 14].

---

## 2. What changed in 2025–2026 (and what is outdated)

| Topic | Current status | Source |
|---|---|---|
| **FAQ rich results** | **Fully deprecated.** The notice is dated May 8, 2026: "This feature will no longer appear in Google Search starting May 7, 2026." The docs were removed on June 15, 2026. The older 2023 rule ("only authoritative gov/health sites") is now **outdated**. | [10] |
| Core updates | March 2025, June 2025, December 2025, March 2026 and May 2026. Google also added a note (Dec 9, 2025) about "smaller, ongoing core updates". Spam updates landed in Aug 2025 and in Mar, Jun, Aug and Sep 2026. | [10, 15] |
| AI Overviews / AI Mode | "There are no additional requirements to appear in AI Overviews or AI Mode." Standard SEO applies, and AI clicks are counted in Search Console. | [3] |
| Google AI optimization guide (May 15, 2026) | It rejects AEO/GEO as separate disciplines. llms.txt is **not used by Google Search**. There is no need to chunk content or rewrite it for AI, and no special AI schema exists. Mass-producing query-variant pages can count as scaled content abuse. It does recommend GBP for local. | [2, 2b] |
| Structured data simplification (June–Sept 2025, Nov 2025) | Several types were retired (course info, salary, vehicle listing, special announcement, learning video, practice problem, dataset). None of the types this hotel needs were affected. | [10] |
| Core Web Vitals | INP replaced FID in 2024. Thresholds: LCP 2.5 s, INP 200 ms, CLS 0.1, all at p75. | [6] |
| Review stars for your own business | Self-serving reviews on `LocalBusiness` or `Organization` markup are **ineligible** for star rich results. Fake or undisclosed incentivized reviews are prohibited (guideline added July 24, 2026). | [7, 10] |
| E-E-A-T | Not a ranking factor in itself. Trust is the most important part. Raters do not affect rankings directly. | [1] |
| AI Overviews and CTR | Ahrefs measured ~34.5% lower position-1 CTR in April 2025 and ~58% lower in the December 2025 update. These are correlational. Branded and local transactional queries are less affected (Amsive). | [Industry, 16] |

**Implication [Opinion]:** for a hotel, most informational traffic ("qué hacer en Mocoa") will increasingly be answered inside AI Overviews. The bookable traffic comes from local and branded queries: the map pack, Google Hotels and "Hotel Bambú Plaza Mocoa". Prioritize those surfaces first and the blog last.

---

## 3. Recommended landing page section order

The order follows the guest's decision sequence: *can I get there / is it near what I want → can I afford it → is the room OK → can I trust it → how do I book*. SiteMinder likewise recommends balancing design with the details travellers need when deciding, and showing rooms, amenities and nearby attractions [Industry, 13].

| # | Section | Purpose (conversion) | SEO role |
|---|---|---|---|
| 1 | **Hero**: one real photo of the façade or the best room, H1, a one-line value proposition, "Desde $X COP/noche", and a WhatsApp CTA plus a "Ver habitaciones" link | Answers "what and where" in 3 seconds | H1 carries the primary intent, e.g. *"Hotel Bambú Plaza – hotel en el centro de Mocoa, Putumayo"*. The hero image is the LCP element, so preload it and give it explicit dimensions. |
| 2 | **Trust strip**: GBP rating and review count (text, linked to GBP), years operating, RNT number, "16 habitaciones" | Lowers risk early | Trust signals [1]. Don't mark up your own reviews as `aggregateRating` [7]. |
| 3 | **Rooms preview**: 3–4 room-type cards with photo, capacity, beds, price-from and a "Ver detalles" link | Price and fit decision | Internal links to each room URL with descriptive anchor text |
| 4 | **Location**: an embedded map or static map image, the address, and a list of *distances with times* (Parque principal X min a pie, Terminal X min, Aeropuerto Villagarzón X min, Fin del Mundo X km / X min, Ojo de Dios…) | "Is it convenient for my plan?" | Relevance for "cerca de…" queries. Factual, unique content that AI answers can cite [2]. Links to the location page. |
| 5 | **What's included / services**: only the *differentiating* ones, with specifics ("Desayuno típico incluido 6:30–9:30", "Parqueadero cubierto para 8 motos y 4 carros", "Wi-Fi de fibra 100 Mb") | Removes objections | Concrete facts, not keyword lists [11] |
| 6 | **Reviews**: 3–6 real excerpts with name, origin and date, plus a link to read all of them on Google or TripAdvisor | Social proof | Readable content. No star markup. |
| 7 | **Policies at a glance**: check-in/out, children, pets, cancellation and deposit, payment methods, invoicing (factura electrónica) | Removes friction before the chat | Matches GBP and schema (`checkinTime`, `petsAllowed`) |
| 8 | **About / story**: 2–3 short paragraphs (see §3.1) | Human trust, differentiation | Experience and Trust [1] |
| 9 | **Things to do teaser**: 3 attractions with the hotel's own tip, linking to the guide | Inspiration, longer stays | Internal link to the guide page |
| 10 | **FAQ (visible)**: 6–8 real questions guests ask on WhatsApp | Saves chat time | Useful text for users and AI answers. **Do not expect FAQ rich results** [10]. `FAQPage` markup is now optional and gives no rich result. |
| 11 | **Final CTA and NAP footer**: WhatsApp, phone, address, schedule of reception | Conversion | Consistent NAP |

A sticky WhatsApp button on mobile, with a prefilled message ("Hola, quiero reservar del __ al __ para __ personas"), is worth having [Opinion]. Track clicks as a conversion event.

**Fluff to remove [Opinion, supported by 1, 11]:** icon grids that only restate amenity names ("Wi-Fi", "TV", "Baño privado") with no specifics. Adjectives with no evidence ("el mejor hotel", "experiencia inolvidable"). Keyword-stuffed paragraphs listing towns ("hotel Mocoa Putumayo Villagarzón Puerto Asís…"), which Google lists as keyword stuffing [11]. Stock photos. Sliders that hide content.

### 3.1 Writing the About section so it ranks and converts [Opinion, grounded in 1 and 2]
- Write it in the first person and name the owner or family ("Somos la familia ___, abrimos en 20__"). Google's "Who/How/Why" asks for clear authorship and never fabricated profiles [1].
- Add verifiable specifics: year founded, renovation, how many people work there, sustainability or local sourcing, and what makes the place different (a quiet street, central location, local breakfast).
- Mention the place naturally: "a dos cuadras del parque principal de Mocoa". Don't repeat keywords.

### 3.2 Writing location and attractions content
- Start with **facts that are unique to you**: measured times (walk, taxi, car) from the hotel to each point, taxi price ranges, opening hours you have checked, and what guests usually forget (rain gear, leave Fin del Mundo before ~3 pm [Industry, 19]).
- One section per attraction: what it is, distance from the hotel, how to get there, time needed, difficulty, cost, and the hotel's tip. Add an original photo with a descriptive alt text.
- Google's guide calls this "valuable, unique, non-commodity content" based on first-hand experience [2]. A rewritten Wikipedia summary isn't.

---

## 4. Inner page set

| Page | Route (example) | Keep? | Notes |
|---|---|---|---|
| Home | `/` | Yes | As above |
| Rooms index | `/habitaciones` | Yes | All types, compare table |
| Room type pages | `/habitaciones/doble`, `/habitaciones/familiar`… | Yes, **one per real type** (likely 3–5) | Not one per room number. Each needs unique photos and text, or it becomes thin. |
| Location / how to get here | `/ubicacion` | Yes | Map, address, from Bogotá/Pasto/Neiva/Pitalito, airport, terminal, parking |
| Things to do in Mocoa | `/que-hacer-en-mocoa` | Yes | Hub with sections per attraction. Split out an attraction page only once you have enough unique content (Fin del Mundo is the likely first one). |
| Services | `/servicios` | Optional | Merge into home and rooms if thin |
| Gallery | `/galeria` | Optional | Fine if images have captions. Otherwise put the photos inside the room pages. |
| Policies / FAQ | `/politicas` or `/preguntas-frecuentes` | Yes | One page |
| Contact / reservations | `/contacto` | Yes | NAP, WhatsApp, map, form |
| About | `/nosotros` | Yes | Story, team, legal (RNT, NIT) |
| Legal | `/privacidad`, `/terminos` | Yes (Colombian Ley 1581) | `noindex` is optional. Keep them out of main navigation. |

**Pages that hurt:**
- City-variant pages such as "hotel en Villagarzón", "hotel en Puerto Asís" or "hotel cerca de X" that all funnel to the same booking. Google names "pages aimed at specific regions or cities that funnel users to one page" as doorway abuse [11].
- Near-duplicate room pages.
- Empty "blog" or "promociones" pages.
- Tag and archive pages.
- AI-mass-produced posts, which Google treats as scaled content abuse [11, 2].

**Internal linking [Verified for principle, 3; structure is Opinion]:** home → rooms index → each room. Each room links to its siblings, to location and to contact. Location ↔ things-to-do. Every page links to the WhatsApp CTA and back to home through breadcrumbs. Use descriptive Spanish anchor text ("ver habitación familiar", "cómo llegar a la Cascada Fin del Mundo"), never "clic aquí".

---

## 5. Schema plan (JSON-LD, one `@graph` per page)

Google has **no hotel-specific rich result for organic pages**. Its LocalBusiness doc requires only `name` and `address`, recommends `geo`, `telephone`, `url`, `priceRange` and `openingHoursSpecification`, and says to use the most specific subtype [4]. For a hotel, that subtype is schema.org `Hotel` (a `LodgingBusiness`) [8]. The value of the markup is entity clarity. Google says it is "not required" for AI features but "still worth using" [2].

**Site-wide (in the layout):**
- `WebSite` (`name`, `url`, `inLanguage: "es-CO"`).
- `Hotel` with `@id: https://<domain>/#hotel`.
  - **Google-required:** `name`, `address` (`PostalAddress`: `streetAddress`, `addressLocality: "Mocoa"`, `addressRegion: "Putumayo"`, `postalCode`, `addressCountry: "CO"`).
  - **Recommended:** `url`, `telephone` (+57…), `geo` (`latitude`/`longitude` with ≥ 5 decimals), `image` (several URLs), `priceRange` (e.g. "$$" or "COP 120.000–250.000"), `logo`.
  - **schema.org lodging properties [8]:** `checkinTime` ("15:00"), `checkoutTime` ("12:00"), `numberOfRooms: 16`, `petsAllowed`, `availableLanguage`, `amenityFeature` (a list of `LocationFeatureSpecification` with `name` and `value: true`), `paymentAccepted`, `currenciesAccepted: "COP"`, `hasMap` (the GBP maps URL), `sameAs` (GBP, Booking, TripAdvisor, Facebook, Instagram), `starRating` only if officially classified.
  - **Omit** `aggregateRating` and `review`, because they are self-serving and ineligible [7]. **Omit** `openingHours`: GBP says hotels shouldn't set business hours [5b], so to stay consistent, describe the reception schedule in the text instead.

**Room pages [8]:**
- `HotelRoom` (multi-typed `["HotelRoom","Product"]` as in the schema.org hotel guide): `name`, `description`, `image`, `bed` (text, or `BedDetails` with `numberOfBeds` and `typeOfBed`), `occupancy` (`QuantitativeValue`, `maxValue`, `unitCode: "IE"`), `floorSize` if known, and `amenityFeature`. Link to the hotel with `containedInPlace: {"@id": "#hotel"}`.
- `Offer`: `itemOffered` (the room `@id`), `priceSpecification` (`UnitPriceSpecification` with `price`, `priceCurrency: "COP"`, `unitCode: "DAY"`), `businessFunction` LeaseOut, `offeredBy` (the hotel), and optionally `validThrough`. Only publish a price that is visible on the page and kept current. Use "desde" (minPrice) semantics if rates vary.
- `BreadcrumbList`.

**Other pages:** `BreadcrumbList` everywhere. `FAQPage` is optional and harmless, but has **no rich result since May 2026** [10]. `TouristAttraction` entries on the guide page are optional and low priority [Opinion].

Validate with the Rich Results Test (for breadcrumbs) and the Schema.org validator (for Hotel and HotelRoom).

---

## 6. Google Business Profile, Hotel Center and off-site local SEO

**GBP (primary source: Google guidelines [5b], ranking [5]):**
- Use the real-world name only: "Hotel Bambú Plaza". **Don't** add "Mocoa" or "Fin del Mundo" unless that is on the signage, because extra information in the name isn't permitted [5b].
- Primary category "Hotel". Use as few categories as possible. If there is a restaurant, don't add a restaurant category; it needs its own profile [5b].
- Don't set business hours, since lodging shouldn't [5b]. Edit check-in/out times and hotel attributes under Edit profile → Hotel details. Google's 2026 hotels playbook [14b] describes this; its PDF body could not be extracted, so only its title and links were verified.
- Use a local phone number under your control, ideally the WhatsApp one. Link to the hotel website, not to social media [5b].
- Photos: façade (to help arrival), reception, every room type, bathroom, breakfast and the street. Refresh them regularly [5].
- Reviews: ask every guest and reply to all of them, positive or negative [5]. Never incentivize without disclosure, and never gate reviews [7].
- Google's AI guide explicitly says to keep GBP up to date for AI responses [2, 3].

**Free booking links / Hotel Center [partially verified]:** Free booking links are unpaid, show an "official site" result in Google Hotels, and rates entered through GBP appear only there [14, Industry summary of the Hotel Center FAQ]. Historically, individual hotels could enter rates manually in GBP through an interest form (2022) [Industry, 14c]. **I could not open Google's current eligibility rules** (the Hotel Center help pages returned an index or a 404). Some vendors say an integration partner is required. Action: in GBP, check whether "Precios/Tarifas" editing is offered. If it isn't, a low-cost booking engine or channel manager that is a Google connectivity partner is the route. The "official site" link would then point to a booking page, not to WhatsApp.

**Citations and directories (keep NAP identical):** Booking.com, Expedia/Hotels.com, Airbnb (if used), TripAdvisor, Trip.com, Facebook, Instagram, Apple Maps (Business Connect), Bing Places, Waze, colombia.travel listings, the Gobernación del Putumayo or Mocoa tourism office, and local press (Semana and regional outlets cover Mocoa tourism [Industry, 20]). Whitespark's 2026 survey (secondary coverage) ranks website-to-GBP NAP matching around #15 of 187 local factors, and says citations matter more for AI visibility than for map rankings [Industry, 18; primary report not opened].

**Links:** Tour operators for Fin del Mundo, Indi Wasi and rafting, plus travel bloggers. Partnerships with guides who link to "where to stay" are natural, relevant links [Opinion].

---

## 7. Metadata patterns (Spanish)

Google sets no length limit and truncates to device width. Titles should be unique, descriptive and not keyword-stuffed, with the brand at the start or end [9]. Meta descriptions should be unique, readable sentences with key details such as price; keyword lists are less likely to be shown [9b]. The H1 should match the title intent [9].

| Page | `<title>` | Meta description |
|---|---|---|
| Home | `Hotel Bambú Plaza – Hotel en Mocoa, Putumayo` | `Hotel en el centro de Mocoa, a X min de la Cascada Fin del Mundo. 16 habitaciones con baño privado y desayuno desde $X COP/noche. Reserva por WhatsApp.` |
| Rooms index | `Habitaciones en Mocoa – Hotel Bambú Plaza` | `Habitaciones sencillas, dobles y familiares para hasta X personas. Fotos reales, camas, servicios y tarifas desde $X COP. Consulta disponibilidad por WhatsApp.` |
| Room page | `Habitación {Tipo} para {N} personas – Hotel Bambú Plaza` | `{Cama(s)}, {m²} m², {2–3 diferenciales}. Desde $X COP por noche en el centro de Mocoa. Reserva directa por WhatsApp.` |
| Location | `Cómo llegar a Hotel Bambú Plaza, Mocoa` | `Dirección, mapa y tiempos desde la terminal, el aeropuerto y el parque principal de Mocoa. Parqueadero, rutas desde Pasto y Pitalito.` |
| Things to do | `Qué hacer en Mocoa: cascadas y planes cerca del hotel` | `Fin del Mundo, Ojo de Dios y más: distancias desde el hotel, cómo llegar, costos y consejos de quienes vivimos en Mocoa.` |
| Attraction (if split) | `Cascada Fin del Mundo: cómo llegar desde Mocoa` | `A X km del Hotel Bambú Plaza. Horarios, entrada, dificultad del sendero y qué llevar.` |
| Policies / FAQ | `Políticas y preguntas frecuentes – Hotel Bambú Plaza` | `Check-in desde las 15:00, check-out hasta las 12:00, mascotas, niños, pagos y cancelaciones.` |
| Contact | `Contacto y reservas – Hotel Bambú Plaza Mocoa` | `Reserva por WhatsApp al +57 … o llámanos. Calle …, Mocoa, Putumayo.` |
| About | `Nosotros – Hotel Bambú Plaza, Mocoa` | `Hotel familiar en Mocoa desde 20__. Conoce nuestra historia y a quienes te reciben.` |

Use `og:image` and `og:title` per page with a real photo, not a logo [12]. Set `<html lang="es-CO">`. The current self-canonicals are fine.

---

## 8. Things to avoid

- Expecting FAQ or review-star rich results. FAQ was deprecated in May 2026 [10], and self-serving review stars are ineligible [7].
- City or "near X" doorway pages and AI-mass-generated blog posts [11, 2].
- Keywords in the GBP business name [5b], and GBP business hours for a hotel [5b].
- Markup that disagrees with the page, such as stale prices or amenities you don't have [3, 4].
- Writing llms.txt or chunked "AI versions" of pages for Google [2].
- Heavy hero videos or carousels that ruin LCP/INP, layout shift from unsized images, and client-only rendering of key text [6, 2].
- Generic alt text ("imagen1") or keyword-stuffed alt text [12].
- Fake, bought or undisclosed incentivized reviews [7].
- Inconsistent phone or address across OTAs, social profiles and the site [18].
- Fake dates or "updated" stamps added for freshness, which Google flags as search-engine-first behavior [1].

---

## 9. Owner data checklist

**Identity and NAP**
- [ ] Exact legal and commercial name, NIT, RNT number, year founded
- [ ] Exact address (as in GBP), postal code, GPS pin (lat/long)
- [ ] Phone and WhatsApp number (one canonical), email
- [ ] GBP URL, plus OTA and social profile URLs

**Rooms (per type)**
- [ ] Type name, number of units, beds (type and count), max occupancy, m², floor or view
- [ ] In-room specifics: AC or fan, hot water, TV, desk, balcony
- [ ] Price "desde" in COP for low and high season, and whether breakfast and VAT are included
- [ ] 6–10 original photos per type, horizontal, ≥ 1600 px, taken in daylight

**Hotel facts**
- [ ] Check-in and check-out times, early or late options, reception schedule (24 h?)
- [ ] Breakfast (what, when, price), parking (type, capacity, price), Wi-Fi speed
- [ ] Policies: children, pets, extra bed, cancellation, deposit, payment methods, factura electrónica, ID and minors rules
- [ ] Accessibility (elevator? ground-floor rooms?), languages spoken

**Location**
- [ ] Measured times and distances from the hotel to: parque principal, terminal, Villagarzón airport, hospital, Fin del Mundo, Ojo de Dios, Paway, Indi Wasi, Río Mocoa, and restaurants
- [ ] Taxi price ranges and whether the hotel arranges tours or transfers (with partner names)
- [ ] Owner tips per attraction, and original photos of each

**Trust and story**
- [ ] Owner or family story, team names and photos (with consent), any awards or certifications
- [ ] 5–10 real review excerpts (with permission), current Google rating and count
- [ ] The 10 questions guests most often ask on WhatsApp, with answers

**Brand assets**
- [ ] Logo (SVG), façade photo for the hero and `og:image`, brand colors

---

## 10. Sources

Primary (Google, schema.org, web.dev):
1. Google Search Central, *Creating helpful, reliable, people-first content*: https://developers.google.com/search/docs/fundamentals/creating-helpful-content (no date shown; accessed 2026-11-05)
2. Google Search Central, *Optimizing your website for generative AI features on Google Search*: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide (published 2026-05-15)
2b. Google Search Central Blog, *A new resource for optimizing for generative AI in Google Search*: https://developers.google.com/search/blog/2026/05/a-new-resource-for-optimizing (2026-05-15)
3. Google Search Central, *AI features and your website*: https://developers.google.com/search/docs/appearance/ai-features (added 2025-05-21 per changelog)
4. Google Search Central, *Local business structured data*: https://developers.google.com/search/docs/appearance/structured-data/local-business (no date shown)
5. Google Business Profile Help, *Tips to improve your local ranking on Google*: https://support.google.com/business/answer/7091 (no date shown)
5b. Google Business Profile Help, *Guidelines for representing your business on Google*: https://support.google.com/business/answer/3038177 (no date shown)
6. web.dev, *Web Vitals*: https://web.dev/articles/vitals (INP became a Core Web Vital in 2024)
7. Google Search Central, *Review snippet structured data*: https://developers.google.com/search/docs/appearance/structured-data/review-snippet (fake/incentivized review guideline added 2026-07-24 per changelog)
8. schema.org, *Hotel* https://schema.org/Hotel and *Hotels and accommodation markup guide* https://schema.org/docs/hotels.html
9. Google Search Central, *Influencing title links*: https://developers.google.com/search/docs/appearance/title-link
9b. Google Search Central, *Control your snippets / meta descriptions*: https://developers.google.com/search/docs/appearance/snippet
10. Google Search Central, *Documentation updates (changelog)*: https://developers.google.com/search/updates (FAQ deprecation 2026-05-08, docs removed 2026-06-15, structured-data retirements 2025-06-12, 2025-09-09 and 2025-11-05). Also https://developers.google.com/search/docs/appearance/structured-data/faqpage
11. Google Search Central, *Spam policies* (doorway abuse, scaled content abuse, keyword stuffing): https://developers.google.com/search/docs/essentials/spam-policies
12. Google Search Central, *Image SEO best practices*: https://developers.google.com/search/docs/appearance/google-images (preferred image guidance added 2026-03-02)
14. Google Hotel Center Help, *FAQ: Add and manage room rates and availability using Google Business Profile*: https://support.google.com/hotelprices/answer/11202392 (**not readable**: only the help index rendered; summarized from search snippets)
14b. Google, *[Hotels] GBP Best Practices Playbook 2026* (PDF): https://services.google.com/fh/files/helpcenter/hotels_gbp_best_practices_playbook_2026.pdf (**body not extractable**; only the title and links were verified)
15. Google Search Status Dashboard, ranking incidents: https://status.search.google.com/products/rGHU1u87FJnkP6W2GwMi/history

Secondary / industry:

13. SiteMinder, *Hotel website design* hub and *6 ways to get more direct bookings via your website*: https://www.siteminder.com/r/marketing/hotel-website-design (vendor; undated)
14c. PPC Land, *Google to allow individual hotels to take part in free hotel booking links*: https://ppc.land/google-to-allow-individual-hotels-to-take-part-in-free-hotel-booking-links/ (2022 context). Also Search Engine Land, *Google's free hotel booking links arrive on Search and Maps*: https://searchengineland.com/googles-free-hotel-booking-links-arrive-on-search-and-maps-382594 (2022)
16. Ahrefs, *AI Overviews reduce clicks by 34.5%*: https://ahrefs.com/blog/ai-overviews-reduce-clicks/ (Apr 2025). *Update: AI Overviews reduce clicks by 58%*: https://ahrefs.com/blog/ai-overviews-reduce-clicks-update/ (Dec 2025 data)
17. Ahrefs, *SEO for hotels*: https://ahrefs.com/seo/for/hotels (undated; map pack vs organic)
18. Whitespark, *Local Search Ranking Factors 2026*: https://whitespark.ca/local-search-ranking-factors/ (**primary report not opened**; figures come from secondary summaries and should be treated as unverified)
19. Hotels.com / Trip.com listings near Cascada Fin del Mundo (competitor and distance context): https://es.hotels.com/es/de10753373/hotel-cerca-de-cascada-del-fin-del-mundo-mocoa-colombia
20. Semana, *Qué hacer en Mocoa*: https://www.semana.com/turismo/articulo/que-hacer-en-mocoa-ciudad-rodeada-de-cascadas-e-ideal-para-el-turismo-de-aventura/202444/ ; Colombia Travel, Mocoa: https://colombia.travel/es/mocoa
21. Aleyda Solis, *AI Search Content Optimization Checklist*: https://www.aleydasolis.com/en/ai-search/ai-search-optimization-checklist (June 16, 2025, updated July 27, 2025; **403 when fetched**, known only from secondary coverage)

**Not consulted or not accessible:** Moz, Semrush and Search Engine Journal hotel guides did not surface in searches. Romuald Fons, Isra Bravo, Matt Diggity, Edward Sturm, Lily Ray and Kevin Indig were not reviewed directly (Indig is cited only via Ahrefs). Lighthouse/OTA Insight and Hospitality Net were not reviewed beyond a syndicated Search Engine Land article. The Spanish keyword volumes for "hotel en Mocoa" and similar queries were **not measured**. Verify them with Google Keyword Planner or Search Console once the site has data.
