import { describe, expect, it } from 'vitest';
import { galleryCategoryFromParam, galleryFilters, galleryLabel } from './gallery';

const item = (id: string, category: string) => ({
  id,
  category,
  featured: false,
  media: { id } as never,
});

describe('gallery filters (owner decision Q6: platform categories, Spanish labels)', () => {
  it('labels every platform category in Spanish', () => {
    expect(
      ['ROOMS', 'COMMON_AREAS', 'EXTERIOR', 'FOOD', 'SURROUNDINGS', 'DETAILS'].map(galleryLabel),
    ).toEqual([
      'Habitaciones',
      'Espacios comunes',
      'Fachada',
      'Gastronomía',
      'Entorno',
      'Detalles',
    ]);
  });

  it('offers chips only for categories with photos, in enum order, with counts', () => {
    const filters = galleryFilters([
      item('1', 'DETAILS'),
      item('2', 'COMMON_AREAS'),
      item('3', 'DETAILS'),
    ]);
    expect(filters).toEqual([
      { category: 'COMMON_AREAS', param: 'espacios-comunes', label: 'Espacios comunes', count: 1 },
      { category: 'DETAILS', param: 'detalles', label: 'Detalles', count: 2 },
    ]);
  });

  it('reads the shareable ?categoria= value, also the legacy enum spelling', () => {
    expect(galleryCategoryFromParam('espacios-comunes')).toBe('COMMON_AREAS');
    expect(galleryCategoryFromParam('common_areas')).toBe('COMMON_AREAS');
    expect(galleryCategoryFromParam(['fachada'])).toBe('EXTERIOR');
    expect(galleryCategoryFromParam('piscina')).toBeNull();
    expect(galleryCategoryFromParam(undefined)).toBeNull();
  });
});
