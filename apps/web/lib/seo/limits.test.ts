import { describe, expect, it } from 'vitest';
import { DESCRIPTION_MAX, fitDescription, fitTitle, TITLE_MAX } from './limits';

describe('fitTitle', () => {
  it('keeps the first candidate that fits the title limit', () => {
    const long = `${'Habitación familiar con vista '.repeat(2)}– Hotel Bambú Plaza`;
    expect(long.length).toBeGreaterThan(TITLE_MAX);
    expect(fitTitle([long, 'Habitación familiar – Hotel Bambú Plaza'])).toBe(
      'Habitación familiar – Hotel Bambú Plaza',
    );
  });

  it('cuts the last candidate at a word boundary when none fits', () => {
    const title = fitTitle(['Una habitación con un nombre larguísimo '.repeat(3)]);
    expect(title.length).toBeLessThanOrEqual(TITLE_MAX);
    expect(title.endsWith('…')).toBe(true);
    expect(title).not.toMatch(/\s…$/);
  });
});

describe('fitDescription', () => {
  it('adds optional parts in order and skips the ones that do not fit', () => {
    const lead = 'Hotel en el corazón de Mocoa, Putumayo.';
    const text = fitDescription(lead, ['Primera parte útil.', 'x'.repeat(200), 'Cierre corto.']);
    expect(text).toBe(`${lead} Primera parte útil. Cierre corto.`);
    expect(text.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
  });

  it('skips empty parts and normalises whitespace', () => {
    expect(fitDescription('Uno.', [null, '', '  Dos\n tres. '])).toBe('Uno. Dos tres.');
  });

  it('cuts an over-long lead at a word boundary', () => {
    const text = fitDescription('palabra '.repeat(40), []);
    expect(text.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    expect(text.endsWith('…')).toBe(true);
  });
});
