import { uniqueSlug } from '@hotel-bambu/shared';
import type { RoomType } from '../generated/prisma/enums.js';

/**
 * Demo content (requirement 15.5): local/staging only, every visible text marked [DEMO].
 * Facts used here are the owner-confirmed ones: 16 rooms, individual and couple types, and
 * private bathroom / TV / fan / Wi-Fi in every room. Rates, floors and the exact type split are
 * unknown: rates stay null (TODO(hotel)) and numbering is illustrative.
 */

export const DEMO_MARKER = '[DEMO]';
export const DEMO_ROOM_COUNT = 16;

export interface DemoRoom {
  slug: string;
  name: string;
  type: RoomType;
  capacity: number;
  beds: Array<{ type: 'SINGLE' | 'DOUBLE'; count: number }>;
  shortDescription: string;
  description: string;
  sortOrder: number;
}

const TYPE_COPY: Record<
  'INDIVIDUAL' | 'COUPLE',
  { label: string; capacity: number; text: string }
> = {
  INDIVIDUAL: { label: 'Individual', capacity: 1, text: 'para una persona' },
  COUPLE: { label: 'Pareja', capacity: 2, text: 'para dos personas' },
};

const AMENITY_SENTENCE = 'Incluye baño privado, televisor, ventilador y Wi-Fi.';

/** 16 rooms on two illustrative floors (101–108, 201–208), alternating couple / individual. */
export function buildDemoRooms(count: number = DEMO_ROOM_COUNT): DemoRoom[] {
  const taken = new Set<string>();
  return Array.from({ length: count }, (_, index) => {
    const floor = Math.floor(index / 8) + 1;
    const number = floor * 100 + (index % 8) + 1;
    const type = index % 2 === 0 ? 'COUPLE' : 'INDIVIDUAL';
    const copy = TYPE_COPY[type];
    const name = `${DEMO_MARKER} Habitación ${copy.label} ${number}`;
    const slug = uniqueSlug(name, taken, 'habitacion');
    taken.add(slug);
    return {
      slug,
      name,
      type,
      capacity: copy.capacity,
      beds: [{ type: type === 'COUPLE' ? 'DOUBLE' : 'SINGLE', count: 1 }],
      shortDescription: `${DEMO_MARKER} Habitación ${copy.text}. ${AMENITY_SENTENCE}`,
      description: `${DEMO_MARKER} Texto de ejemplo: habitación ${copy.text} con baño privado, televisor, ventilador y conexión Wi-Fi. La descripción real la redacta el hotel desde el panel.`,
      sortOrder: index,
    };
  });
}

export const DEMO_FAQS: ReadonlyArray<{ question: string; answer: string; showOnHome: boolean }> = [
  {
    question: `${DEMO_MARKER} ¿Cómo reservo una habitación?`,
    answer: `${DEMO_MARKER} Escríbenos por WhatsApp y te confirmamos disponibilidad y tarifa. Abrir WhatsApp no constituye una reserva.`,
    showOnHome: true,
  },
  {
    question: `${DEMO_MARKER} ¿Las habitaciones tienen baño privado?`,
    answer: `${DEMO_MARKER} Sí, todas las habitaciones tienen baño privado, televisor, ventilador y Wi-Fi.`,
    showOnHome: true,
  },
  {
    question: `${DEMO_MARKER} ¿Hay internet en el hotel?`,
    answer: `${DEMO_MARKER} Sí, hay internet en todos los pisos.`,
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
