import { describe, expect, it } from 'vitest';
import { slugify, slugSchema } from './slug.js';

describe('slugify', () => {
  it('lowercases and joins words with dashes', () => {
    expect(slugify('Habitación Doble Superior')).toBe('habitacion-doble-superior');
  });

  it('removes Spanish diacritics and maps ñ to n', () => {
    expect(slugify('Baño privado y Niños ÚNICOS')).toBe('bano-privado-y-ninos-unicos');
  });

  it('collapses symbols and trims dashes', () => {
    expect(slugify('  ¡Promo -- 2x1! (temporada) ')).toBe('promo-2x1-temporada');
  });

  it('returns an empty string when nothing is sluggable', () => {
    expect(slugify('¿¡!?')).toBe('');
  });
});

describe('slugSchema', () => {
  it('accepts kebab-case slugs only', () => {
    expect(slugSchema.safeParse('habitacion-doble').success).toBe(true);
    expect(slugSchema.safeParse('Habitacion').success).toBe(false);
    expect(slugSchema.safeParse('-doble').success).toBe(false);
    expect(slugSchema.safeParse('doble--x').success).toBe(false);
  });
});
