import { describe, expect, it } from 'vitest';
import { displayPhone, fullAddress, mapLinks } from './site';

const base = {
  name: 'Hotel Bambú Plaza',
  latitude: null,
  longitude: null,
  address: null,
  municipality: null,
  department: null,
  mapUrl: null,
};

describe('mapLinks', () => {
  it('is null without coordinates, address or map URL (block hidden)', () => {
    expect(mapLinks(base)).toBeNull();
  });

  it('prefers coordinates (Prisma decimals may arrive as strings)', () => {
    const links = mapLinks({ ...base, latitude: '1.1478', longitude: -76.6476 });
    expect(links?.embedUrl).toBe(
      `https://www.google.com/maps?q=${encodeURIComponent('1.1478,-76.6476')}&z=16&output=embed`,
    );
    expect(links?.directionsUrl).toContain('destination=1.1478%2C-76.6476');
  });

  it('uses the address and keeps a configured map URL for directions', () => {
    const links = mapLinks({
      ...base,
      address: 'Calle 1',
      municipality: 'Mocoa',
      mapUrl: 'https://maps.app.goo.gl/x',
    });
    expect(links?.embedUrl).toContain(encodeURIComponent('Hotel Bambú Plaza, Calle 1, Mocoa'));
    expect(links?.directionsUrl).toBe('https://maps.app.goo.gl/x');
  });
});

describe('fullAddress / displayPhone', () => {
  it('joins configured parts only', () => {
    expect(fullAddress({ address: null, municipality: 'Mocoa', department: 'Putumayo' })).toBe(
      'Mocoa, Putumayo',
    );
    expect(fullAddress({ address: null, municipality: null, department: null })).toBeNull();
  });

  it('formats Colombian mobile numbers', () => {
    expect(displayPhone('573001234567')).toBe('+57 300 123 4567');
    expect(displayPhone('15551234567')).toBe('+15551234567');
  });
});
