import type {
  AMENITY_SCOPES,
  BED_TYPES,
  GALLERY_CATEGORIES,
  ICON_KEYS,
  PRICE_UNITS,
  ROOM_TYPES,
  SOCIAL_PLATFORMS,
} from '@hotel-bambu/shared';

/** Spanish labels for enum values shown in the admin panel. */
export const ROOM_TYPE_LABELS: Record<(typeof ROOM_TYPES)[number], string> = {
  INDIVIDUAL: 'Individual',
  COUPLE: 'Pareja',
  TWIN: 'Doble (dos camas)',
  FAMILY: 'Familiar',
};

export const PRICE_UNIT_LABELS: Record<(typeof PRICE_UNITS)[number], string> = {
  PER_NIGHT: 'Por noche',
  PER_PERSON_PER_NIGHT: 'Por persona por noche',
  OTHER: 'Otra',
};

export const BED_TYPE_LABELS: Record<(typeof BED_TYPES)[number], string> = {
  SINGLE: 'Sencilla',
  DOUBLE: 'Doble',
  QUEEN: 'Queen',
  KING: 'King',
  BUNK: 'Camarote',
  SOFA_BED: 'Sofá cama',
};

export const GALLERY_CATEGORY_LABELS: Record<(typeof GALLERY_CATEGORIES)[number], string> = {
  ROOMS: 'Habitaciones',
  COMMON_AREAS: 'Espacios comunes',
  EXTERIOR: 'Fachada',
  FOOD: 'Gastronomía',
  SURROUNDINGS: 'Entorno',
  DETAILS: 'Detalles',
};

/** Amenity scope (ADR 0015): hotel-wide, or assigned per room. */
export const AMENITY_SCOPE_LABELS: Record<(typeof AMENITY_SCOPES)[number], string> = {
  HOTEL: 'Todo el hotel',
  ROOM: 'Habitaciones',
};

export const SOCIAL_PLATFORM_LABELS: Record<(typeof SOCIAL_PLATFORMS)[number], string> = {
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  TIKTOK: 'TikTok',
  YOUTUBE: 'YouTube',
  X: 'X (Twitter)',
  TRIPADVISOR: 'Tripadvisor',
  GOOGLE_BUSINESS: 'Perfil de Google',
  OTHER: 'Otra',
};

export const ICON_LABELS: Record<(typeof ICON_KEYS)[number], string> = {
  bath: 'Baño',
  'shower-head': 'Ducha',
  tv: 'Televisor',
  fan: 'Ventilador',
  wifi: 'Wi-Fi',
  router: 'Internet',
  sun: 'Sol',
  'solar-panel': 'Paneles solares',
  droplets: 'Agua',
  'bed-single': 'Cama sencilla',
  'bed-double': 'Cama doble',
  users: 'Personas',
  clock: 'Horario',
  'key-round': 'Llave',
  'shield-check': 'Seguridad',
  'map-pin': 'Ubicación',
  car: 'Parqueadero',
  coffee: 'Café',
  utensils: 'Restaurante',
  mountain: 'Montaña',
  trees: 'Naturaleza',
  sparkles: 'Destacado',
  phone: 'Teléfono',
  'message-circle': 'Mensajes',
};

export function toOptions<K extends string>(labels: Record<K, string>) {
  return (Object.entries(labels) as [K, string][]).map(([value, label]) => ({ value, label }));
}

export function labelOf(labels: Record<string, string>, value: string | null | undefined): string {
  return value ? (labels[value] ?? value) : '';
}

export const PUBLICATION_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'PUBLISHED', label: 'Publicado' },
  { value: 'INACTIVE', label: 'Inactivo' },
] as const;
