import { describe, expect, it } from 'vitest';
import { fromRate, sharedRoomAmenities } from './rates';

const type = (basePrice: number | null, priceUnit = 'PER_NIGHT', currency = 'COP') => ({
  basePrice,
  priceUnit,
  currency,
  taxesIncluded: true,
});

describe('fromRate ("desde $X COP/noche")', () => {
  it('is null when no published type has a rate', () => {
    expect(fromRate([])).toBeNull();
    expect(fromRate([type(null), type(null)])).toBeNull();
  });

  it('takes the lowest nightly rate of the types that have one', () => {
    const rate = fromRate([type(180000), type(null), type(120000)]);
    expect(rate?.amount).toBe(120000);
    expect(rate?.label).toBe('Desde $ 120.000 COP/noche');
  });

  it('prefers per-night rates over per-person or other units', () => {
    const rate = fromRate([type(60000, 'PER_PERSON_PER_NIGHT'), type(150000)]);
    expect(rate?.amount).toBe(150000);
  });

  it('labels a per-person rate when it is the only one', () => {
    expect(fromRate([type(60000, 'PER_PERSON_PER_NIGHT')])?.label).toBe(
      'Desde $ 60.000 COP por persona/noche',
    );
  });

  it('ignores rates with an unspecified unit (only the notes explain them)', () => {
    expect(fromRate([type(90000, 'OTHER')])).toBeNull();
  });
});

describe('sharedRoomAmenities', () => {
  it('lists the room amenities every type has, in the first type order', () => {
    const a = {
      amenities: [{ name: 'Baño privado' }, { name: 'Televisor' }, { name: 'Ventilador' }],
    };
    const b = { amenities: [{ name: 'Ventilador' }, { name: 'Baño privado' }] };
    expect(sharedRoomAmenities([a, b])).toEqual(['Baño privado', 'Ventilador']);
  });

  it('is empty without types', () => {
    expect(sharedRoomAmenities([])).toEqual([]);
  });
});
