import { describe, expect, it } from 'vitest';
import { gallerySeo, homeSeo, locationSeo, policiesSeo, roomsSeo } from './page-seo';

const hotel = {
  name: 'Hotel Bambú Plaza',
  address: 'Calle 8 # 7-10',
  municipality: 'Mocoa',
  department: 'Putumayo',
  phone: '+57 310 679 8260',
  checkInTime: null,
  checkOutTime: null,
};

const type = (overrides: Record<string, unknown> = {}) => ({
  name: 'Habitación de pareja',
  type: 'COUPLE',
  capacity: 2,
  basePrice: null,
  priceUnit: 'PER_NIGHT',
  currency: 'COP',
  taxesIncluded: true,
  publishedRoomCount: 8,
  amenities: [{ name: 'Baño privado' }, { name: 'Televisor' }],
  ...overrides,
});

const rooms = [type({ name: 'Habitación individual', type: 'INDIVIDUAL', capacity: 1 }), type()];

describe('homeSeo', () => {
  it('follows the research template with real facts only', () => {
    const seo = homeSeo(hotel, rooms, 'phone');
    expect(seo.title).toBe('Hotel Bambú Plaza – Hotel en Mocoa, Putumayo');
    expect(seo.description).toBe(
      'Hotel en el corazón de Mocoa, Putumayo. 16 habitaciones con baño privado y televisor. Consulta disponibilidad al 310 679 8260.',
    );
  });

  it('adds the "desde" rate and the WhatsApp call to action when they exist', () => {
    const seo = homeSeo(hotel, [type({ basePrice: 120000 })], 'whatsapp');
    expect(seo.description).toBe(
      'Hotel en el corazón de Mocoa, Putumayo. 8 habitaciones con baño privado y televisor, desde $ 120.000 COP/noche. Reserva directa por WhatsApp.',
    );
  });

  it('never claims rooms or a city the hotel has not configured', () => {
    const seo = homeSeo({ ...hotel, municipality: null, department: null }, [], null);
    expect(seo.title).toBe('Hotel Bambú Plaza');
    expect(seo.description).toBe('Hotel Bambú Plaza: habitaciones, ubicación y contacto directo.');
  });
});

describe('roomsSeo', () => {
  it('lists the room kinds and the largest capacity', () => {
    const seo = roomsSeo(hotel, rooms, 'phone');
    expect(seo.title).toBe('Habitaciones en Mocoa – Hotel Bambú Plaza');
    expect(seo.description).toBe(
      'Habitaciones individuales y de pareja para hasta 2 personas. Fotos reales, comodidades y tarifas. Consulta disponibilidad al 310 679 8260.',
    );
  });

  it('adds the rate when one exists', () => {
    expect(roomsSeo(hotel, [type({ basePrice: 90000 })], 'whatsapp').description).toBe(
      'Habitaciones de pareja para hasta 2 personas. Fotos reales, comodidades y tarifas desde $ 90.000 COP/noche. Consulta disponibilidad por WhatsApp.',
    );
  });
});

describe('locationSeo', () => {
  it('names the address, the map and the nearby places when listed', () => {
    const seo = locationSeo(hotel, 3, 'phone');
    expect(seo.title).toBe('Cómo llegar a Hotel Bambú Plaza, Mocoa');
    expect(seo.description).toBe(
      'Dirección (Calle 8 # 7-10, Mocoa, Putumayo), mapa y distancias a lugares cercanos. Llámanos al 310 679 8260.',
    );
  });

  it('omits the nearby places without data', () => {
    expect(locationSeo(hotel, 0, 'whatsapp').description).toBe(
      'Dirección (Calle 8 # 7-10, Mocoa, Putumayo) y mapa. Escríbenos por WhatsApp.',
    );
  });
});

describe('policiesSeo', () => {
  it('starts with the schedule only when it is set', () => {
    expect(policiesSeo(hotel).title).toBe('Políticas y preguntas frecuentes – Hotel Bambú Plaza');
    expect(policiesSeo(hotel).description).toBe(
      'Políticas de Hotel Bambú Plaza en Mocoa y respuestas a las preguntas frecuentes de los huéspedes.',
    );
    expect(policiesSeo({ ...hotel, checkInTime: '15:00', checkOutTime: '12:00' }).description).toBe(
      'Check-in desde las 15:00, check-out hasta las 12:00. Políticas de Hotel Bambú Plaza en Mocoa y respuestas a las preguntas frecuentes de los huéspedes.',
    );
  });
});

describe('gallerySeo', () => {
  it('names the photo categories that exist', () => {
    const seo = gallerySeo(hotel, ['Espacios comunes', 'Detalles']);
    expect(seo.title).toBe('Galería de fotos – Hotel Bambú Plaza, Mocoa');
    expect(seo.description).toBe(
      'Fotos reales de Hotel Bambú Plaza en Mocoa: espacios comunes y detalles. Conoce el hotel y sus habitaciones antes de reservar.',
    );
  });
});

describe('length limits (titles ≤ 60, descriptions ≤ 155)', () => {
  const long = {
    ...hotel,
    name: 'Hotel Bambú Plaza Mocoa Centro Histórico y Turístico',
    address: 'Calle 8 # 7-10, barrio Centro, frente al parque principal, edificio esquinero',
    municipality: 'San Miguel de Mocoa',
    department: 'Putumayo',
    checkInTime: '15:00',
    checkOutTime: '12:00',
  };
  const many = [
    type({ name: 'a', type: 'INDIVIDUAL', capacity: 1, basePrice: 90000 }),
    type({ name: 'b', type: 'COUPLE', capacity: 2 }),
    type({ name: 'c', type: 'TWIN', capacity: 3 }),
    type({ name: 'd', type: 'FAMILY', capacity: 6 }),
  ];
  const cases = {
    home: homeSeo(long, many, 'phone'),
    rooms: roomsSeo(long, many, 'phone'),
    location: locationSeo(long, 4, 'phone'),
    policies: policiesSeo(long),
    gallery: gallerySeo(long, ['Habitaciones', 'Espacios comunes', 'Fachada', 'Detalles']),
  };

  it.each(Object.entries(cases))('%s stays within the limits', (_page, seo) => {
    expect(seo.title.length).toBeLessThanOrEqual(60);
    expect(seo.description.length).toBeLessThanOrEqual(155);
    expect(seo.description.length).toBeGreaterThan(50);
  });

  it('gives every page a different title and description', () => {
    const seos = Object.values(cases);
    expect(new Set(seos.map((seo) => seo.title)).size).toBe(seos.length);
    expect(new Set(seos.map((seo) => seo.description)).size).toBe(seos.length);
  });
});
