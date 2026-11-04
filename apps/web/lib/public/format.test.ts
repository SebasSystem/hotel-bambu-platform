import { describe, expect, it } from 'vitest';
import { formatCop, formatRoomPrice, paragraphs } from './format';

/** Intl uses non-breaking spaces; compare with plain spaces. */
const plain = (value: string | null | undefined) => value?.replace(/\s/g, ' ');

describe('formatCop', () => {
  it('formats whole pesos with es-CO grouping and no decimals', () => {
    expect(plain(formatCop(250000))).toBe('$ 250.000');
    expect(plain(formatCop(1234567))).toBe('$ 1.234.567');
  });
});

describe('formatRoomPrice', () => {
  it('returns null when the room has no informative rate', () => {
    expect(
      formatRoomPrice({ basePrice: null, priceUnit: 'PER_NIGHT', taxesIncluded: true }),
    ).toBeNull();
  });

  it('builds the "desde" amount, unit and taxes note', () => {
    const price = formatRoomPrice({
      basePrice: 120000,
      priceUnit: 'PER_NIGHT',
      taxesIncluded: true,
    });
    expect(plain(price?.amount)).toBe('$ 120.000');
    expect(price?.unit).toBe('por noche');
    expect(price?.taxes).toBe('Impuestos incluidos');
    expect(plain(price?.summary)).toBe('Desde $ 120.000 por noche, impuestos incluidos');
  });

  it('says when taxes are not included and handles per-person and other units', () => {
    const perPerson = formatRoomPrice({
      basePrice: 80000,
      priceUnit: 'PER_PERSON_PER_NIGHT',
      taxesIncluded: false,
    });
    expect(perPerson?.unit).toBe('por persona por noche');
    expect(perPerson?.taxes).toBe('Impuestos no incluidos');
    const other = formatRoomPrice({ basePrice: 50000, priceUnit: 'OTHER', taxesIncluded: true });
    expect(other?.unit).toBe('');
    expect(plain(other?.summary)).toBe('Desde $ 50.000, impuestos incluidos');
  });
});

describe('paragraphs', () => {
  it('splits text on blank lines and drops empty chunks', () => {
    expect(paragraphs('Uno.\n\n  Dos.\n\n\n')).toEqual(['Uno.', 'Dos.']);
    expect(paragraphs(null)).toEqual([]);
  });
});
