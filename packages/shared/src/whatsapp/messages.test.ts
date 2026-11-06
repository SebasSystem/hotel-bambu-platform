import { describe, expect, it } from 'vitest';
import { DEFAULT_WHATSAPP_GREETING, WHATSAPP_MESSAGES, buildWhatsAppMessage } from './messages.js';

describe('buildWhatsAppMessage', () => {
  it('builds the general message with the default greeting', () => {
    expect(buildWhatsAppMessage({ kind: 'general' })).toBe(
      'Hola, vi su página web y quisiera obtener más información.',
    );
  });

  it('names the room type in the room-type message', () => {
    expect(buildWhatsAppMessage({ kind: 'roomType', name: 'Habitación de pareja' })).toBe(
      'Hola, quisiera información sobre disponibilidad y tarifa de la Habitación de pareja.',
    );
  });

  it('uses the hotel greeting: a comma after a bare greeting, a new sentence after punctuation', () => {
    expect(buildWhatsAppMessage({ kind: 'general' }, 'Buen día')).toBe(
      'Buen día, vi su página web y quisiera obtener más información.',
    );
    expect(buildWhatsAppMessage({ kind: 'general' }, '¡Hola, Hotel Bambú Plaza!')).toBe(
      '¡Hola, Hotel Bambú Plaza! Vi su página web y quisiera obtener más información.',
    );
  });

  it('falls back to the default greeting when the hotel one is empty', () => {
    expect(buildWhatsAppMessage({ kind: 'general' }, '   ')).toBe(
      buildWhatsAppMessage({ kind: 'general' }, null),
    );
    expect(DEFAULT_WHATSAPP_GREETING).toBe('Hola');
  });

  it('keeps a trimmed, single-spaced room-type name', () => {
    expect(buildWhatsAppMessage({ kind: 'roomType', name: '  Suite   familiar ' })).toBe(
      'Hola, quisiera información sobre disponibilidad y tarifa de la Suite familiar.',
    );
  });

  it('has exactly the GENERAL and ROOM_TYPE defaults (no promotion message)', () => {
    expect(Object.keys(WHATSAPP_MESSAGES)).toEqual(['GENERAL', 'ROOM_TYPE']);
  });
});
