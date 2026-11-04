import type { Room } from '@/lib/api/types';
import { PRICE_UNIT_LABELS } from '@/lib/labels';

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/** "$ 120.000 · Por noche" or null when the room has no informative rate. */
export function formatPrice(room: Pick<Room, 'basePrice' | 'priceUnit'>): string | null {
  if (room.basePrice === null) return null;
  return `${cop.format(room.basePrice)} · ${PRICE_UNIT_LABELS[room.priceUnit]}`;
}

/** Public URL of a room page (route owned by the public site, task T6). */
export function publicRoomPath(slug: string): string {
  return `/habitaciones/${slug}`;
}
