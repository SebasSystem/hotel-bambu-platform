import { describe, expect, it } from 'vitest';
import { amenityBenefit, trustItems } from './trust';

const hotel = {
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
  it('lists the address, the room count and the hotel amenities in that order (no RNT)', () => {
    const items = trustItems({
      hotel,
      roomCount: 16,
      roomKinds: ['Individual', 'Pareja'],
      amenities: [amenity('Wi-Fi en todo el hotel', 'wifi'), amenity('Paneles solares', 'sun')],
    });
    // The RNT lives in the footer only (owner review 2026-11-08).
    expect(items.map((item) => item.id)).not.toContain('rnt');
    expect(items.map((item) => item.title)).toEqual([
      'Calle 8 # 7-10',
      '16 habitaciones',
      'Wi-Fi en todo el hotel',
      'Paneles solares',
    ]);
    expect(items[0]?.text).toBe('En el corazón de Mocoa, Putumayo.');
    expect(items[1]?.text).toBe('Individual y pareja.');
  });

  it('skips facts the hotel has not configured', () => {
    const items = trustItems({
      hotel: { address: null, municipality: null, department: null },
      roomCount: 0,
      roomKinds: [],
      amenities: [],
    });
    expect(items).toEqual([]);
  });
});
