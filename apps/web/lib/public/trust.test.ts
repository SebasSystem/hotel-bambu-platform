import { describe, expect, it } from 'vitest';
import { amenityBenefit, trustItems } from './trust';

const hotel = {
  rntNumber: '232175',
  address: 'Calle 8 # 7-10',
  municipality: 'Mocoa',
  department: 'Putumayo',
};

const amenity = (name: string, iconKey: string, description: string | null = null) => ({
  id: name,
  name,
  iconKey,
  description,
});

describe('amenityBenefit (benefit lines written in code for known amenities)', () => {
  it('maps Wi-Fi to working from the room', () => {
    expect(amenityBenefit(amenity('Wi-Fi en todo el hotel', 'wifi'))).toMatch(
      /trabajar o hacer trámites desde la habitación/,
    );
  });

  it('maps solar panels to a hedged backup-power line', () => {
    const text = amenityBenefit(amenity('Paneles solares', 'sun'));
    expect(text).toMatch(/respaldo de energía solar/);
    expect(text).not.toMatch(/apag|corte|24/i);
  });

  it('maps the water reserve to "reserva de agua propia"', () => {
    expect(amenityBenefit(amenity('Reserva de agua', 'droplets'))).toMatch(
      /reserva de agua propia/,
    );
  });

  it('recognises known amenities by name when the icon differs', () => {
    expect(amenityBenefit(amenity('Internet Wi-Fi', 'sparkles'))).toMatch(/trabajar/);
  });

  it('uses the admin description for unknown amenities, or nothing', () => {
    expect(amenityBenefit(amenity('Parqueadero', 'car', 'Cubierto, para motos.'))).toBe(
      'Cubierto, para motos.',
    );
    expect(amenityBenefit(amenity('Parqueadero', 'car'))).toBeNull();
  });
});

describe('trustItems', () => {
  it('lists the RNT, the address, the room count and the hotel amenities in that order', () => {
    const items = trustItems({
      hotel,
      roomCount: 16,
      roomKinds: ['Individual', 'Pareja'],
      amenities: [amenity('Wi-Fi en todo el hotel', 'wifi'), amenity('Paneles solares', 'sun')],
    });
    expect(items.map((item) => item.title)).toEqual([
      'RNT 232175',
      'Calle 8 # 7-10',
      '16 habitaciones',
      'Wi-Fi en todo el hotel',
      'Paneles solares',
    ]);
    expect(items[0]?.text).toBe('Inscritos en el Registro Nacional de Turismo.');
    expect(items[1]?.text).toBe('En el corazón de Mocoa, Putumayo.');
    expect(items[2]?.text).toBe('Individual y pareja.');
  });

  it('skips facts the hotel has not configured', () => {
    const items = trustItems({
      hotel: { rntNumber: null, address: null, municipality: null, department: null },
      roomCount: 0,
      roomKinds: [],
      amenities: [],
    });
    expect(items).toEqual([]);
  });
});
