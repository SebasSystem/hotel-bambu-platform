import type { RoomKind } from '../generated/prisma/enums.js';

/**
 * Demo content (requirement 15.5): local/staging only, every visible text marked [DEMO].
 * Facts used here are the owner-confirmed ones: individual and couple room types, and private
 * bathroom / TV / fan in every room. Rates, beds, descriptions and how many rooms of each type the
 * hotel has are unknown, so the demo invents none of them: types have no description and no rate,
 * and there is one example room per type (ADR 0016).
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

export const DEMO_FAQS: ReadonlyArray<{ question: string; answer: string; showOnHome: boolean }> = [
  {
    question: `${DEMO_MARKER} ¿Cómo reservo una habitación?`,
    answer: `${DEMO_MARKER} Escríbenos por WhatsApp y te confirmamos disponibilidad y tarifa. Abrir WhatsApp no constituye una reserva.`,
    showOnHome: true,
  },
  {
    question: `${DEMO_MARKER} ¿Las habitaciones tienen baño privado?`,
    answer: `${DEMO_MARKER} Sí, todas las habitaciones tienen baño privado, televisor y ventilador.`,
    showOnHome: true,
  },
  {
    question: `${DEMO_MARKER} ¿Hay internet en el hotel?`,
    answer: `${DEMO_MARKER} Sí, hay Wi-Fi en todo el hotel.`,
    showOnHome: true,
  },
  {
    question: `${DEMO_MARKER} ¿A qué hora es el check-in y el check-out?`,
    answer: `${DEMO_MARKER} Texto de ejemplo. TODO(hotel): confirmar horarios.`,
    showOnHome: false,
  },
];

export const DEMO_POLICIES: ReadonlyArray<{ title: string; content: string }> = [
  {
    title: `${DEMO_MARKER} Check-in y check-out`,
    content: `${DEMO_MARKER} Texto de ejemplo. TODO(hotel): horarios reales.`,
  },
  {
    title: `${DEMO_MARKER} Mascotas`,
    content: `${DEMO_MARKER} Texto de ejemplo. TODO(hotel): política real.`,
  },
  {
    title: `${DEMO_MARKER} Menores de edad`,
    content: `${DEMO_MARKER} Texto de ejemplo. TODO(hotel): política real y aviso ESCNNA.`,
  },
  {
    title: `${DEMO_MARKER} Métodos de pago`,
    content: `${DEMO_MARKER} Texto de ejemplo. TODO(hotel): métodos aceptados al llegar.`,
  },
];
