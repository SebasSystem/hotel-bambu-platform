import { describe, expect, it } from 'vitest';
import {
  heroPhotoIssues,
  isPlaceholderSocialUrl,
  publishChecklist,
  readinessKpis,
  type ReadinessData,
} from './readiness';

const landscape = { width: 1920, height: 1080 };
const portrait = { width: 960, height: 1280 };

/** A site with every item done; each test breaks one thing. */
function ready(): ReadinessData {
  return {
    hotel: {
      tagline: 'Descanso en el centro de Mocoa',
      description: 'Somos un hotel familiar en Mocoa.',
      address: 'Calle 8 # 7-10',
      municipality: 'Mocoa',
      department: 'Putumayo',
      latitude: 1.146883,
      longitude: -76.64794,
      phone: '310 679 8260',
      whatsappNumber: '573106798260',
      email: 'reservas@example.test',
      checkInTime: '15:00',
      checkOutTime: '12:00',
    },
    roomTypes: [
      { status: 'PUBLISHED', basePrice: 120000 },
      { status: 'PUBLISHED', basePrice: 90000 },
      { status: 'DRAFT', basePrice: null },
    ],
    heroSlides: [
      { active: true, mediaAsset: landscape },
      { active: true, mediaAsset: landscape },
      { active: true, mediaAsset: landscape },
    ],
    nearbyPlaces: [{ active: true }],
    policies: [{ published: true, title: 'Check-in', content: 'Desde las 15:00.' }],
    faqs: [{ published: true, question: '¿Hay parqueadero?', answer: 'No.' }],
    socialLinks: [{ active: true, url: 'https://www.instagram.com/hotelbambuplaza' }],
    media: { total: 30, missingAlt: 0 },
  };
}

const item = (data: ReadinessData, id: string) => {
  const found = publishChecklist(data).find((entry) => entry.id === id);
  if (!found) throw new Error(`missing checklist item ${id}`);
  return found;
};

describe('publishChecklist', () => {
  it('lists the nine items in a fixed order, each linking to the section that fixes it', () => {
    const items = publishChecklist(ready());
    expect(items.map((entry) => entry.id)).toEqual([
      'whatsapp',
      'rates',
      'hero',
      'schedule',
      'nearby',
      'policies',
      'social',
      'about',
      'coordinates',
    ]);
    expect(items.every((entry) => entry.done)).toBe(true);
    expect(items.every((entry) => entry.href.startsWith('/admin/'))).toBe(true);
    expect(item(ready(), 'whatsapp').href).toBe('/admin/hotel#whatsapp');
    expect(item(ready(), 'hero').href).toBe('/admin/hero-slides');
  });

  it('needs a valid WhatsApp number', () => {
    const data = ready();
    data.hotel.whatsappNumber = null;
    expect(item(data, 'whatsapp').done).toBe(false);
    data.hotel.whatsappNumber = '123';
    expect(item(data, 'whatsapp').done).toBe(false);
  });

  it('needs a rate on every published room type and counts the missing ones', () => {
    const data = ready();
    data.roomTypes[1]!.basePrice = null;
    const rates = item(data, 'rates');
    expect(rates.done).toBe(false);
    expect(rates.note).toBe('1 de 2 tipos publicados sin tarifa');
    // Drafts never count, but nothing published is not "ready" either.
    expect(item({ ...data, roomTypes: [{ status: 'DRAFT', basePrice: null }] }, 'rates').done).toBe(
      false,
    );
  });

  it('needs three visible landscape hero slides; portrait and hidden ones do not count', () => {
    const data = ready();
    data.heroSlides[0]!.mediaAsset = portrait;
    data.heroSlides.push({ active: false, mediaAsset: landscape });
    const hero = item(data, 'hero');
    expect(hero.done).toBe(false);
    expect(hero.note).toBe('2 de 3 fotos horizontales visibles');
  });

  it('needs both check-in and check-out times', () => {
    const data = ready();
    data.hotel.checkOutTime = ' ';
    expect(item(data, 'schedule').done).toBe(false);
  });

  it('needs at least one active nearby place', () => {
    const data = ready();
    data.nearbyPlaces = [{ active: false }];
    expect(item(data, 'nearby').done).toBe(false);
  });

  it('fails while published policies or FAQ still carry [DEMO] text', () => {
    const data = ready();
    data.faqs.push({ published: true, question: '[DEMO] ¿Aceptan mascotas?', answer: 'Sí.' });
    const policies = item(data, 'policies');
    expect(policies.done).toBe(false);
    expect(policies.note).toBe('1 texto de ejemplo [DEMO]');
    // An unpublished demo text does not block, but no published policy does.
    data.faqs.pop();
    data.policies = [{ published: false, title: 'Check-in', content: '…' }];
    expect(item(data, 'policies').done).toBe(false);
  });

  it('rejects placeholder social URLs such as a bare platform home page', () => {
    expect(isPlaceholderSocialUrl('https://instagram.com')).toBe(true);
    expect(isPlaceholderSocialUrl('https://www.facebook.com/')).toBe(true);
    expect(isPlaceholderSocialUrl('not a url')).toBe(true);
    expect(isPlaceholderSocialUrl('https://www.instagram.com/hotelbambuplaza')).toBe(false);
    const data = ready();
    data.socialLinks.push({ active: true, url: 'https://instagram.com' });
    expect(item(data, 'social').done).toBe(false);
    expect(item({ ...data, socialLinks: [] }, 'social').done).toBe(false);
  });

  it('needs the about text and the map coordinates', () => {
    const data = ready();
    data.hotel.description = '';
    data.hotel.latitude = null;
    expect(item(data, 'about').done).toBe(false);
    expect(item(data, 'coordinates').done).toBe(false);
  });
});

describe('readinessKpis', () => {
  const kpi = (data: ReadinessData, id: string) => {
    const found = readinessKpis(data).find((entry) => entry.id === id);
    if (!found) throw new Error(`missing kpi ${id}`);
    return found;
  };

  it('derives the four content-readiness KPIs', () => {
    expect(readinessKpis(ready()).map((entry) => entry.id)).toEqual([
      'roomTypes',
      'altText',
      'profile',
      'whatsapp',
    ]);
  });

  it('room types: published of total, and how many published ones have a rate', () => {
    const data = ready();
    data.roomTypes[0]!.basePrice = null;
    expect(kpi(data, 'roomTypes')).toMatchObject({
      value: '2 de 3',
      note: '1 publicado con tarifa',
      done: false,
    });
    expect(kpi(ready(), 'roomTypes')).toMatchObject({
      note: '2 publicados con tarifa',
      done: true,
    });
  });

  it('photos: described of total', () => {
    const data = ready();
    data.media = { total: 30, missingAlt: 4 };
    expect(kpi(data, 'altText')).toMatchObject({
      value: '26 de 30',
      note: '4 sin texto alternativo',
      done: false,
    });
    expect(kpi({ ...data, media: { total: 0, missingAlt: 0 } }, 'altText')).toMatchObject({
      value: '0',
      note: 'Aún no hay fotos',
      done: false,
    });
  });

  it('profile completeness as a rounded percentage of the eleven profile facts', () => {
    expect(kpi(ready(), 'profile')).toMatchObject({ value: '100 %', note: '11 de 11 datos' });
    const data = ready();
    data.hotel.email = null;
    data.hotel.whatsappNumber = null;
    data.hotel.longitude = null;
    expect(kpi(data, 'profile')).toMatchObject({
      value: '73 %',
      note: '8 de 11 datos',
      done: false,
    });
  });

  it('WhatsApp configured or pending, with the phone fallback explained', () => {
    expect(kpi(ready(), 'whatsapp')).toMatchObject({ value: 'Configurado', done: true });
    const data = ready();
    data.hotel.whatsappNumber = null;
    expect(kpi(data, 'whatsapp')).toMatchObject({
      value: 'Pendiente',
      note: 'Los botones llaman al teléfono',
      done: false,
    });
  });
});

describe('heroPhotoIssues', () => {
  it('flags portrait, small and unknown photos', () => {
    expect(heroPhotoIssues(landscape)).toEqual([]);
    expect(heroPhotoIssues(portrait)).toEqual(['portrait', 'small']);
    expect(heroPhotoIssues({ width: 1200, height: 800 })).toEqual(['small']);
    expect(heroPhotoIssues({ width: null, height: null })).toEqual(['unknown']);
  });
});
