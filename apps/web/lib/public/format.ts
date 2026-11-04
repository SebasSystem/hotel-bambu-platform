import type { PRICE_UNITS } from '@hotel-bambu/shared';

/** Whole Colombian pesos, `es-CO` format (requirement 4.4): "$ 250.000". */
const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCop(amount: number): string {
  return cop.format(amount);
}

const PUBLIC_PRICE_UNITS: Record<(typeof PRICE_UNITS)[number], string> = {
  PER_NIGHT: 'por noche',
  PER_PERSON_PER_NIGHT: 'por persona por noche',
  // The rate notes (written by the hotel) explain other units.
  OTHER: '',
};

export interface RoomPriceInput {
  basePrice: number | null;
  priceUnit: string;
  taxesIncluded: boolean;
}

export interface FormattedPrice {
  amount: string;
  unit: string;
  taxes: string;
  /** One-line text, e.g. "Desde $ 120.000 por noche, impuestos incluidos" (requirement 17.6). */
  summary: string;
}

/** Informative "desde" rate, or null when the room has no published rate. */
export function formatRoomPrice(room: RoomPriceInput): FormattedPrice | null {
  if (room.basePrice === null) return null;
  const amount = formatCop(room.basePrice);
  const unit = PUBLIC_PRICE_UNITS[room.priceUnit as keyof typeof PUBLIC_PRICE_UNITS] ?? '';
  const taxes = room.taxesIncluded ? 'Impuestos incluidos' : 'Impuestos no incluidos';
  const summary = `Desde ${amount}${unit ? ` ${unit}` : ''}, ${taxes.toLowerCase()}`;
  return { amount, unit, taxes, summary };
}

/** Admin-entered long text → paragraphs (blank-line separated). */
export function paragraphs(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}
