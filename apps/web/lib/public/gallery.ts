import { GALLERY_CATEGORIES } from '@hotel-bambu/shared';
import type { PublicGalleryItem } from './types';

export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];

/** Public chip labels and `?categoria=` values (owner decision Q6, spec §7 Gallery). */
const PUBLIC_CATEGORIES: Record<GalleryCategory, { label: string; param: string }> = {
  ROOMS: { label: 'Habitaciones', param: 'habitaciones' },
  COMMON_AREAS: { label: 'Espacios comunes', param: 'espacios-comunes' },
  EXTERIOR: { label: 'Fachada', param: 'fachada' },
  FOOD: { label: 'Gastronomía', param: 'gastronomia' },
  SURROUNDINGS: { label: 'Entorno', param: 'entorno' },
  DETAILS: { label: 'Detalles', param: 'detalles' },
};

export function galleryLabel(category: string): string {
  return PUBLIC_CATEGORIES[category as GalleryCategory]?.label ?? category;
}

export interface GalleryFilter {
  category: GalleryCategory;
  param: string;
  label: string;
  count: number;
}

/** Chips only for categories with published photos, in the platform enum order. */
export function galleryFilters(items: Pick<PublicGalleryItem, 'category'>[]): GalleryFilter[] {
  return GALLERY_CATEGORIES.flatMap((category) => {
    const count = items.filter((item) => item.category === category).length;
    if (count === 0) return [];
    return [{ category, ...PUBLIC_CATEGORIES[category], count }];
  });
}

/** Accepts the Spanish slug and the enum spelling used by older links (`?categoria=details`). */
export function galleryCategoryFromParam(
  param: string | string[] | undefined,
): GalleryCategory | null {
  const value = (Array.isArray(param) ? param[0] : param)?.toLowerCase();
  if (!value) return null;
  return (
    GALLERY_CATEGORIES.find(
      (category) => PUBLIC_CATEGORIES[category].param === value || category.toLowerCase() === value,
    ) ?? null
  );
}
