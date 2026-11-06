import { describe, expect, it } from 'vitest';
import { HOTEL_FACTS, mapUrlFor, missingHotelFacts } from './base-data.js';

describe('hotel facts (owner approval 2026-11-05)', () => {
  it('derives the map URL from the coordinates', () => {
    expect(mapUrlFor(1.146883, -76.64794)).toBe(
      'https://www.google.com/maps/search/?api=1&query=1.146883,-76.647940',
    );
    expect(HOTEL_FACTS.mapUrl).toBe(mapUrlFor(HOTEL_FACTS.latitude, HOTEL_FACTS.longitude));
  });

  it('publishes the approved address, phone and RNT, but no WhatsApp number', () => {
    expect(HOTEL_FACTS).toMatchObject({
      address: 'Calle 8 # 7-10',
      municipality: 'Mocoa',
      department: 'Putumayo',
      country: 'Colombia',
      phone: '+57 310 679 8260',
      rntNumber: '232175',
    });
    expect('whatsappNumber' in HOTEL_FACTS).toBe(false);
  });

  it('writes the about text as two paragraphs for families and business travellers', () => {
    const paragraphs = HOTEL_FACTS.description.split('\n\n');
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[1]).toMatch(/familia/);
    expect(paragraphs[1]).toMatch(/actividades comerciales o administrativas/);
    expect(HOTEL_FACTS.shortDescription.length).toBeLessThanOrEqual(160);
  });

  it('fills only the empty fields of an existing profile', () => {
    const missing = missingHotelFacts({ phone: '+57 300 000 0000', address: '  ', tagline: null });
    expect(missing).not.toHaveProperty('phone');
    expect(missing).toMatchObject({ address: 'Calle 8 # 7-10', tagline: HOTEL_FACTS.tagline });
    expect(missingHotelFacts(HOTEL_FACTS)).toEqual({});
  });
});
