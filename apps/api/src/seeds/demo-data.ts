import type { RoomKind } from '../generated/prisma/enums.js';

/**
 * Demo content (requirement 15.5): local/staging only, every visible text marked [DEMO].
 * Facts used here are the owner-confirmed ones: individual and couple room types, and private
 * bathroom / TV / fan in every room. Rates, beds, descriptions and how many rooms of each type the
 * hotel has are unknown, so the demo invents none of them: types have no description and no rate,
 * and there is one example room per type (ADR 0016). Guest policies and FAQ are realistic default
 * content of the base seed (`default-content.ts`), not demo data (owner review 2026-11-08).
 */

export const DEMO_MARKER = '[DEMO]';

export interface DemoRoomType {
  slug: string;
  name: string;
  type: RoomKind;
  capacity: number;
  sortOrder: number;
}

/** The two types the owner confirmed; capacity follows from the type itself (1 and 2 people). */
export const DEMO_ROOM_TYPES: readonly DemoRoomType[] = [
  {
    slug: 'habitacion-individual',
    name: 'Habitación individual',
    type: 'INDIVIDUAL',
    capacity: 1,
    sortOrder: 0,
  },
  {
    slug: 'habitacion-pareja',
    name: 'Habitación de pareja',
    type: 'COUPLE',
    capacity: 2,
    sortOrder: 1,
  },
];

export interface DemoRoom {
  name: string;
  typeSlug: string;
}

/** One example room per type; real numbers and the real split are set in /admin. */
export function buildDemoRooms(): DemoRoom[] {
  return DEMO_ROOM_TYPES.map((type) => ({
    name: `${DEMO_MARKER} ${type.name} de ejemplo`,
    typeSlug: type.slug,
  }));
}
