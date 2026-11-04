import { describe, expect, it } from 'vitest';
import { slugify, slugSchema, uniqueSlug } from './slug.js';

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

describe('uniqueSlug', () => {
  it('returns the plain slug when it is free', () => {
    expect(uniqueSlug('Habitación Pareja 101', new Set())).toBe('habitacion-pareja-101');
  });

  it('appends the first free numeric suffix on collision', () => {
    const taken = new Set(['habitacion-pareja', 'habitacion-pareja-2']);
    expect(uniqueSlug('Habitación Pareja', taken)).toBe('habitacion-pareja-3');
  });

  it('strips a [DEMO] marker brackets and still produces a valid slug', () => {
    const slug = uniqueSlug('[DEMO] Habitación Individual 201', new Set());
    expect(slug).toBe('demo-habitacion-individual-201');
    expect(slugSchema.safeParse(slug).success).toBe(true);
  });

  it('falls back to a default base when the text has no sluggable characters', () => {
    expect(uniqueSlug('¿¡!?', new Set(), 'habitacion')).toBe('habitacion');
  });

  it('keeps the result within the 120-character slug limit', () => {
    const slug = uniqueSlug('a'.repeat(200), new Set(['a'.repeat(120)]));
    expect(slug.length).toBeLessThanOrEqual(120);
    expect(slugSchema.safeParse(slug).success).toBe(true);
  });
});
