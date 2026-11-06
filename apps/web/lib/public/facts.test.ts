import { describe, expect, it } from 'vitest';
import { homeFacts } from './facts';

const service = (name: string, description: string | null = null, iconKey = 'sun') => ({
  id: name,
  name,
  description,
  iconKey,
  media: null,
});

describe('homeFacts (owner decision Q3: derived from data, never invented)', () => {
  it('leads with the published room count, then the hotel-wide amenities', () => {
    const facts = homeFacts(16, [
      service('Paneles solares', 'El hotel cuenta con paneles solares.'),
      service('Reserva de agua', null, 'droplets'),
    ]);
    expect(facts).toEqual([
      { id: 'rooms', value: '16', iconKey: null, label: 'habitaciones', note: null },
      {
        id: 'Paneles solares',
        value: null,
        iconKey: 'sun',
        label: 'Paneles solares',
        note: 'El hotel cuenta con paneles solares.',
      },
      {
        id: 'Reserva de agua',
        value: null,
        iconKey: 'droplets',
        label: 'Reserva de agua',
        note: null,
      },
    ]);
  });

  it('uses the singular for one room and caps the stack at three facts', () => {
    const facts = homeFacts(1, [service('A'), service('B'), service('C')]);
    expect(facts).toHaveLength(3);
    expect(facts[0]).toMatchObject({ value: '1', label: 'habitación' });
  });

  it('skips the room fact when nothing is published and returns nothing without data', () => {
    expect(homeFacts(0, [service('A')]).map((fact) => fact.id)).toEqual(['A']);
    expect(homeFacts(0, [])).toEqual([]);
  });
});
