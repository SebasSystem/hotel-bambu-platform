import { describe, expect, it } from 'vitest';
import { renderWhatsAppTemplate, whatsAppLink, type WhatsAppContext } from './whatsapp';

const templates = [
  { key: 'GENERAL', body: 'Hola, quisiera obtener más información.', allowedVariables: [] },
  {
    key: 'ROOM',
    body: 'Hola, estoy interesado en la habitación {{habitacion}}. ¿Disponibilidad?',
    allowedVariables: ['habitacion'],
  },
  {
    key: 'PROMOTION',
    body: 'Hola, vi la promoción {{ promocion }} en su página web.',
    allowedVariables: ['promocion'],
  },
];

const textOf = (url: string | null) =>
  new URL(url ?? 'https://invalid.test').searchParams.get('text');

describe('renderWhatsAppTemplate', () => {
  it('replaces variables with or without inner spaces', () => {
    expect(
      renderWhatsAppTemplate('Hab. {{habitacion}} y {{ habitacion }}', {
        habitacion: 'Pareja 101',
      }),
    ).toBe('Hab. Pareja 101 y Pareja 101');
  });

  it('drops unknown or missing variables instead of leaking braces', () => {
    expect(renderWhatsAppTemplate('Hola {{otro}} mundo', {})).toBe('Hola mundo');
  });
});

describe('whatsAppLink', () => {
  const site = { hotel: { whatsappNumber: '573001234567' }, whatsappTemplates: templates };

  it('returns null when no WhatsApp number is configured', () => {
    const empty = { hotel: { whatsappNumber: null }, whatsappTemplates: templates };
    expect(whatsAppLink(empty, { kind: 'general' })).toBeNull();
  });

  it('returns null when the stored number is invalid', () => {
    const invalid = { hotel: { whatsappNumber: '12' }, whatsappTemplates: templates };
    expect(whatsAppLink(invalid, { kind: 'general' })).toBeNull();
  });

  it('builds the general message link', () => {
    expect(whatsAppLink(site, { kind: 'general' })).toBe(
      `https://wa.me/573001234567?text=${encodeURIComponent('Hola, quisiera obtener más información.')}`,
    );
  });

  it('includes the room name in the room message', () => {
    const context: WhatsAppContext = { kind: 'room', name: 'Habitación Pareja 101' };
    expect(textOf(whatsAppLink(site, context))).toBe(
      'Hola, estoy interesado en la habitación Habitación Pareja 101. ¿Disponibilidad?',
    );
  });

  it('includes the promotion title in the promotion message', () => {
    expect(textOf(whatsAppLink(site, { kind: 'promotion', name: 'Temporada baja' }))).toBe(
      'Hola, vi la promoción Temporada baja en su página web.',
    );
  });

  it('falls back to the general template when the contextual one is missing', () => {
    const onlyGeneral = { hotel: site.hotel, whatsappTemplates: templates.slice(0, 1) };
    expect(textOf(whatsAppLink(onlyGeneral, { kind: 'room', name: 'X' }))).toBe(
      'Hola, quisiera obtener más información.',
    );
  });

  it('links without text when there are no templates', () => {
    expect(whatsAppLink({ hotel: site.hotel, whatsappTemplates: [] }, { kind: 'general' })).toBe(
      'https://wa.me/573001234567',
    );
  });
});
