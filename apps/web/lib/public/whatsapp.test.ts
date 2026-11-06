import { describe, expect, it } from 'vitest';
import { whatsAppLink, type WhatsAppContext } from './whatsapp';

const textOf = (url: string | null) =>
  new URL(url ?? 'https://invalid.test').searchParams.get('text');

describe('whatsAppLink (code default messages, ADR 0016)', () => {
  const site = { hotel: { whatsappNumber: '573001234567', whatsappGreeting: null } };

  it('returns null when no WhatsApp number is configured', () => {
    const empty = { hotel: { whatsappNumber: null, whatsappGreeting: null } };
    expect(whatsAppLink(empty, { kind: 'general' })).toBeNull();
  });

  it('returns null when the stored number is invalid', () => {
    const invalid = { hotel: { whatsappNumber: '12', whatsappGreeting: null } };
    expect(whatsAppLink(invalid, { kind: 'general' })).toBeNull();
  });

  it('builds the general message link', () => {
    expect(whatsAppLink(site, { kind: 'general' })).toBe(
      `https://wa.me/573001234567?text=${encodeURIComponent('Hola, vi su página web y quisiera obtener más información.')}`,
    );
  });

  it('names the room type in the room-type message', () => {
    const context: WhatsAppContext = { kind: 'roomType', name: 'Habitación de pareja' };
    expect(textOf(whatsAppLink(site, context))).toBe(
      'Hola, quisiera información sobre disponibilidad y tarifa de la Habitación de pareja.',
    );
  });

  it('opens every message with the greeting the hotel configured', () => {
    const greeted = { hotel: { ...site.hotel, whatsappGreeting: 'Buenas tardes' } };
    expect(textOf(whatsAppLink(greeted, { kind: 'general' }))).toBe(
      'Buenas tardes, vi su página web y quisiera obtener más información.',
    );
  });
});
