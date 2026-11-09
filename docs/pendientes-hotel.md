# Pending data from the hotel (`TODO(hotel)`)

Everything below is a `TODO(hotel)` placeholder in seeds and UI until the hotel provides or confirms it. Source: req. 28, 17.6, 17.8, 15.2. Already known (owner, 2026-11-04): name, 16 rooms (individual/couple), in-room private bathroom + TV + fan + Wi-Fi, solar panels, water reserve, internet on all floors, no laundry.

## A. Confirm data seen in the hotel's own photos

These appear on framed prints / the RNT certificate in the photo set (`docs/assets/photo-inventory.md`). Approved by the owner on 2026-11-05 and seeded by `db:seed:base` (ADR 0016):

- [x] City: **Mocoa, Putumayo, Colombia**
- [x] Address: **Calle 8 # 7-10**, coordinates 1.146883, -76.647940 (map link derived from them)
- [x] Phone **310 679 8260** (published as a phone only)
- [ ] Is 310 679 8260 also the WhatsApp number? Until confirmed, `whatsappNumber` stays empty and the WhatsApp buttons are hidden
- [ ] How-to-arrive directions (text)
- [x] RNT **232175** (shown in the footer)
- [x] Tagline "Hotel Bambú Plaza: descanso, comodidad y confianza en el corazón de Mocoa"
- [x] Mission: the source of the "Sobre nosotros" text (two paragraphs) and the meta description; review the wording in /admin
- [ ] Vision text: not used yet
- [ ] Legal name / data controller: the RNT certificate is issued to a natural person — confirm who is the data controller (privacy policy) and the legal/commercial name to publish

## B. Business decisions and content (req. 28)

- [ ] Approval of logo, palette and typography (`docs/design/identity.md`) and the redesign art direction, A or B (`docs/research/art-direction-briefs.md`, which supersedes `docs/design/art-direction.md`)
- [ ] Domain name
- [ ] Room list: number of each room and its type (how many individual and how many couple rooms); set in /admin › Habitaciones
- [ ] Per room type: description, beds, area, capacity, specific amenities and which photos belong to it (/admin › Tipos de habitación)
- [ ] Rates per room type: amount in COP, unit (per night/per person), **taxes included?**, seasonal conditions, special conditions for foreign non-residents (Ley 1480)
- [ ] Nearby places with **measured** distance and travel time (terminal, airport, main park, waterfalls…); nothing is seeded
- [ ] Real services list (beyond the known ones): see section E
- [ ] WhatsApp number and, optionally, the greeting that opens the default messages
- [ ] Policies: check-in / check-out times, pets, minors, cancellation, payment methods, deposits, ID requirements
- [ ] Real FAQ (top questions guests ask)
- [ ] Official social media accounts (URLs)
- [ ] Privacy contact: e-mail for data-protection requests (Ley 1581)
- [ ] Hosting, database and storage providers (or approve the VPS + Cloudflare plan)
- [ ] Analytics: wanted? which metrics? only with consent?
- [ ] Third-party cookies/services to add (Google Maps embed, etc.)
- [ ] Who administers the panel and how credentials are delivered
- [ ] Existing videos: confirm **not** used in v1 (ADR 0004) or provide new footage
- [ ] Competitors in Mocoa for design/SEO research (5–8 names), if the hotel wants to share them

## C. Photos and authorizations (req. 15.1, 15.2)

- [ ] Confirm all 46 photos are **authorized for publication**
- [ ] Written authorization of the staff member shown at reception (2 photos), or confirm those photos are not used
- [ ] **Originals at full resolution** (send as file/document, not WhatsApp photo)

Missing photos:

1. Facade in daylight, whole building, horizontal and vertical
2. Horizontal shots of the 3–4 best rooms and the lounge
3. Bathroom of each room type (only 1 bathroom photo exists)
4. At least 3 photos per room type, labelled with room number
5. Solar panels and water reserve
6. Work/Wi-Fi corner, if any
7. Plants / bamboo / natural textures inside the hotel, if they exist
8. Surroundings of Mocoa (only images the hotel owns or has rights to)
9. Entrance at night with the sign lit, straight on
10. Sign in neutral daylight without filters (to refine the brand green)
11. Optional: 10–20 s horizontal, stabilized, daylight video (1080p+, no people) for a future video hero

## D. Legal checklist items owned by the hotel (req. 17.8)

- [ ] Privacy policy and privacy notice approved by the hotel (and its lawyer)
- [ ] Data purposes and retention periods
- [ ] RNBD registration reviewed (if applicable)
- [ ] Provider contracts reviewed
- [ ] Rates shown with taxes included, or conditions approved
- [ ] Final approval of legal documents

## E. Services and facilities (amenity model, `docs/research/amenity-model.md` § 5)

Until answered, the site claims nothing about these items (no "gratis", no "24 h").

- [ ] Wi-Fi: free for guests? Reaches every room and the common areas?
- [ ] Hot water in every room's shower?
- [ ] Air conditioning in any room? Which ones?
- [ ] Parking: on site or nearby, free or paid, cars and/or motorbikes?
- [ ] Reception hours (24 h?), late check-in, luggage storage?
- [ ] Breakfast or food: included, paid, or none? Kitchen or restaurant?
- [ ] Common areas (lounge, terrace, work corner): which exist and may be shown?
- [ ] Security: night staff, cameras, safe, controlled entrance (only what may be published)?
