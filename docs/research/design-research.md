# Design research — index (req. 7.4)

Status: entry point for the Phase 0 research of feature `public-site-redesign`. Researched 2026-11-04. Requirement 7.4.1 names this file as "the complete analysis with the templates". The analysis is split by topic, and this page maps every deliverable to the file that holds it.

## Deliverables (req. 7.4)

| # | Deliverable (req. 7.4) | Where | State |
|---|---|---|---|
| 1 | Complete analysis with the 7.3 templates | [`design-references.md`](./design-references.md): 25+ global references, 8 full 7.3 analyses, local competitors (Mocoa), measured Lighthouse mobile results, flow (R4) and SEO (R5) notes, gallery log, component demos (R3) with licences | Done |
| 1a | Why v1 feels flat (baseline diagnosis) | [`design-diagnosis.md`](./design-diagnosis.md) | Done |
| 1b | Patterns rated for Bambú (layout, imagery, motion, components, licences) | [`pattern-catalogue.md`](./pattern-catalogue.md) | Done |
| 2 | Screenshots and clips (`docs/research/refs/`) | **Transient only**, under the owner decision below. Each doc cites the source URL and describes what each capture showed. | Policy changed by owner |
| 3 | Two art directions (moodboard + home in low/mid fidelity, mobile and desktop) | [`art-direction-briefs.md`](./art-direction-briefs.md): A "Cuaderno de Mocoa" and B "Letrero y Madera", with moodboards described in text, section-by-section home layouts, computed contrast, v1 LCP baseline, scoring rubric and copy approval list. The **coded R2 prototypes** (home, desktop + mobile, both directions) are the low/mid-fidelity home required by 7.4.3. | Briefs done; prototypes in R2 |
| 4 | Motion specification (req. 8.5) | [`motion-spec.md`](./motion-spec.md): tables for A and B, tokens. It supersedes the v1 baseline `docs/design/motion-spec.md` once a direction is chosen. | Done |
| 5 | Decision record after owner review | A new ADR in `docs/adr/` (it amends ADR 0003 "design direction") | Pending owner choice after R2 |

Related research for the same feature (not part of 7.4, but part of the redesign):

| Topic | File |
|---|---|
| Admin panel diagnosis, references and visual spec | [`admin-ux.md`](./admin-ux.md) |
| Hotel facilities vs room amenities model | [`amenity-model.md`](./amenity-model.md) |

Superseded documents: `docs/design/art-direction.md` (v0, un-researched directions) is replaced by `art-direction-briefs.md`. `docs/design/motion-spec.md` is the v1 baseline until the direction is chosen.

## Protocol coverage (req. 7.2)

| Step | Covered in |
|---|---|
| R1 Local and regional competition | `design-references.md` § Local competitors (Mocoa/Putumayo). Few local hotels have their own website; the section records what exists. |
| R2 Design references (15–25 sites) | `design-references.md` § Reference table (global hotels first, by owner decision) |
| R3 Components and techniques | `design-references.md` § Component and technique demos; `pattern-catalogue.md` §5–6 |
| R4 Flows | `design-references.md` § Flow notes |
| R5 Competitive SEO and speed | `design-references.md` § SEO notes and § Measured performance |

## Owner decisions that override requirement 7.2/7.4

Recorded 2026-11-04. They take precedence over the storage rule in req. 7.2 R2 ("guardar capturas … en `docs/research/refs/`") and over 7.4.2.

1. **Reference priority.** References are chosen for design quality from hotels worldwide. Local competitors (Mocoa/Putumayo) are secondary and get a condensed analysis.
2. **Screenshot and copyright policy.** See the next section.

### Screenshot and copyright policy

- Third-party screenshots are **never committed**. `docs/research/refs/` is listed in `.gitignore`; anything in it is local working material only.
- **All** screenshots (third-party references and captures of our own v1 site and admin) are **deleted when the redesign feature closes**. They are transient evidence for the people doing the research, not a deliverable.
- Therefore every research doc must stand on its own. For each capture it cites the **source URL** and **describes what the capture showed**. File names such as `odisej-d-s2` or `admin-dashboard.png` are kept only as a note of which transient capture backed a statement.
- Inspiration is not copying (req. 7.4): no layout, text, photo or code from a reference is reproduced. Component code from libraries is used only under its licence (see `design-references.md` § Component and technique demos).
