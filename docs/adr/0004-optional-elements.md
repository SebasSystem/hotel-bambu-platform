# 0004 — Optional elements of requirement 2.3

- Status: Accepted for v1 (revisit if the hotel supplies new video/photo material)
- Date: 2026-11-04

## Context

Req. 2.3 lists optional elements to decide in Phase 0 based on research and the real material. Two videos exist (`docs/assets/photo-inventory.md#video-analysis`):

- Video 1: 16.9 s, **480×848 portrait**, ~31.6 fps, H.264 Baseline + audio, handheld room-and-bathroom walkthrough.
- Video 2: 9.6 s, **464×832 portrait**, 30 fps, handheld entrance/reception/lounge walkthrough with **three identifiable people**.

Req. 8.4 targets ≤ 1.5 MB at 720p mobile and ≤ 4 MB at 1080p desktop, 8–20 s, stable footage with good light.

## Decision

| Element (2.3) | Decision | Reason |
|---|---|---|
| Hero video | **No** → photo hero | Both clips are 480p portrait handheld; below 720p/1080p targets; would look degraded full-bleed. |
| Multi-video section narrative | **No** → photo narrative (sticky image swap) | Not enough footage. |
| Video in room detail / gallery | **Not in v1** | Video 1 is technically usable in a framed portrait player but adds little over photos and the room is unidentified; Video 2 shows people without authorization. Data model keeps `MediaAsset` type `video` so it can be enabled later. |
| Smooth scroll (Lenis) | **No** → native scroll | No pinned-heavy narrative in Direction A; avoids touch/a11y issues and an extra dependency. |
| 3D (Three.js / R3F) | **No** | No concrete element that serves the story; performance cost on mid-range mobile. |
| Motion (besides GSAP) | **No** → CSS + GSAP only | No component needs presence/gesture animation that CSS/GSAP can't cover. |

## Consequences

- The site is complete without any optional element (req. 2.3 rule).
- Asking the hotel for a 10–20 s horizontal, stabilized, daylight clip (pending list) is the path to a future video hero; the hero component should accept an optional `video` + required `poster` so enabling it is content, not code.
- Revisit this ADR when new material arrives.
