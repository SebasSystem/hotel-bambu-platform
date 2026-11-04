import { describe, expect, it } from 'vitest';
import { buildWhatsAppUrl, normalizeWhatsAppPhone, whatsAppPhoneSchema } from './whatsapp.js';

describe('normalizeWhatsAppPhone', () => {
  it('keeps an international digits-only number', () => {
    expect(normalizeWhatsAppPhone('573001234567')).toBe('573001234567');
  });

  it('strips "+", spaces, dashes, dots and parentheses', () => {
    expect(normalizeWhatsAppPhone('+57 (300) 123-45.67')).toBe('573001234567');
  });

  it('rejects numbers that are too short or too long for E.164', () => {
    expect(() => normalizeWhatsAppPhone('1234567')).toThrow(/WhatsApp phone/);
    expect(() => normalizeWhatsAppPhone('1234567890123456')).toThrow(/WhatsApp phone/);
  });

  it('rejects letters and a leading zero (no country code)', () => {
    expect(() => normalizeWhatsAppPhone('57300abc4567')).toThrow(/WhatsApp phone/);
    expect(() => normalizeWhatsAppPhone('03001234567')).toThrow(/WhatsApp phone/);
  });
});

describe('whatsAppPhoneSchema', () => {
  it('accepts stored digits-only numbers and rejects formatted ones', () => {
    expect(whatsAppPhoneSchema.safeParse('573001234567').success).toBe(true);
    expect(whatsAppPhoneSchema.safeParse('+573001234567').success).toBe(false);
    expect(whatsAppPhoneSchema.safeParse('').success).toBe(false);
  });
});

describe('buildWhatsAppUrl', () => {
  it('builds the official wa.me link without text when no message is given', () => {
    expect(buildWhatsAppUrl('573001234567')).toBe('https://wa.me/573001234567');
  });

  it('ignores a blank message', () => {
    expect(buildWhatsAppUrl('573001234567', '   ')).toBe('https://wa.me/573001234567');
  });

  it('encodes the message with encodeURIComponent semantics (accents, ¿, ?, &, newlines)', () => {
    const message = 'Hola, ¿tienen habitación doble?\nPrecio & disponibilidad';
    expect(buildWhatsAppUrl('573001234567', message)).toBe(
      `https://wa.me/573001234567?text=${encodeURIComponent(message)}`,
    );
    expect(buildWhatsAppUrl('573001234567', 'a&b=c')).toBe(
      'https://wa.me/573001234567?text=a%26b%3Dc',
    );
  });

  it('normalizes a formatted phone number', () => {
    expect(buildWhatsAppUrl('+57 300 123 4567', 'Hola')).toBe(
      'https://wa.me/573001234567?text=Hola',
    );
  });

  it('throws on an invalid phone number', () => {
    expect(() => buildWhatsAppUrl('TODO', 'Hola')).toThrow(/WhatsApp phone/);
  });
});
