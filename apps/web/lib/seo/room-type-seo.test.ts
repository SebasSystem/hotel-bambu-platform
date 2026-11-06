import { describe, expect, it } from 'vitest';
import { roomTypeSeo } from './room-type-seo';

const hotel = { name: 'Hotel Bambú Plaza', municipality: 'Mocoa', department: 'Putumayo' };
const type = {
  name: 'Habitación de pareja',
  capacity: 2,
  beds: [{ type: 'DOUBLE', count: 1 }],
  areaM2: null,
  amenities: [
    { name: 'Baño privado', iconKey: 'bath' },
    { name: 'Televisor', iconKey: 'tv' },
    { name: 'Ventilador', iconKey: 'fan' },
    { name: 'Escritorio', iconKey: 'sparkles' },
  ],
  basePrice: null,
  priceUnit: 'PER_NIGHT',
  taxesIncluded: true,
};

describe('roomTypeSeo (generated from the type and the city, ADR 0016)', () => {
  it('titles the page with the type, the capacity and the city, brand last', () => {
    expect(roomTypeSeo(type, hotel).title).toBe(
      'Habitación de pareja para 2 personas en Mocoa – Hotel Bambú Plaza',
    );
    expect(roomTypeSeo({ ...type, capacity: 1 }, hotel).title).toBe(
      'Habitación de pareja para 1 persona en Mocoa – Hotel Bambú Plaza',
    );
  });

  it('leaves the city out when the hotel has none', () => {
    expect(roomTypeSeo(type, { ...hotel, municipality: null }).title).toBe(
      'Habitación de pareja para 2 personas – Hotel Bambú Plaza',
    );
  });

  it('describes beds, area and up to three amenities from real data only', () => {
    expect(roomTypeSeo({ ...type, areaM2: 18 }, hotel).description).toBe(
      'Habitación de pareja para 2 personas en Hotel Bambú Plaza, Mocoa, Putumayo. 1 cama doble, 18 m². Con baño privado, televisor y ventilador.',
    );
  });

  it('adds the "desde" rate only when the type has one', () => {
    const { description } = roomTypeSeo({ ...type, basePrice: 120000, amenities: [] }, hotel);
    expect(description).toBe(
      'Habitación de pareja para 2 personas en Hotel Bambú Plaza, Mocoa, Putumayo. 1 cama doble. Desde $ 120.000 por noche.',
    );
  });

  it('pluralises beds and keeps the description within 160 characters', () => {
    const long = roomTypeSeo(
      {
        ...type,
        name: 'Habitación familiar con vista al jardín',
        capacity: 5,
        beds: [
          { type: 'DOUBLE', count: 2 },
          { type: 'SINGLE', count: 1 },
        ],
        basePrice: 250000,
      },
      hotel,
    ).description;
    expect(long).toContain('2 camas dobles, 1 cama sencilla');
    expect(long.length).toBeLessThanOrEqual(160);
    expect(long).toMatch(/Desde \$ 250\.000 por noche\.$/);
  });
});
