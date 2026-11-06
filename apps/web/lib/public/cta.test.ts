import { describe, expect, it } from 'vitest';
import { contactCta, localPhone } from './cta';

const hotel = (whatsappNumber: string | null, phone: string | null) => ({
  hotel: { whatsappNumber, whatsappGreeting: null, phone },
});

describe('contactCta (WhatsApp first, phone fallback)', () => {
  it('opens WhatsApp when a valid number is set', () => {
    const cta = contactCta(hotel('573001234567', '+57 310 679 8260'), { kind: 'general' });
    expect(cta?.kind).toBe('whatsapp');
    expect(cta?.href).toMatch(/^https:\/\/wa\.me\/573001234567\?text=/);
  });

  it('falls back to a tel: link with the local number when WhatsApp is not set', () => {
    const cta = contactCta(hotel(null, '+57 310 679 8260'), { kind: 'general' });
    expect(cta).toEqual({
      kind: 'phone',
      href: 'tel:+573106798260',
      phone: '310 679 8260',
      label: 'Llamar al 310 679 8260',
    });
  });

  it('falls back to the phone when the stored WhatsApp number is invalid', () => {
    expect(contactCta(hotel('12', '3106798260'), { kind: 'general' })?.kind).toBe('phone');
  });

  it('is null without WhatsApp and phone (callers hide the CTA)', () => {
    expect(contactCta(hotel(null, null), { kind: 'general' })).toBeNull();
    expect(contactCta(hotel(null, '   '), { kind: 'general' })).toBeNull();
  });

  it('names the room type in the WhatsApp message', () => {
    const cta = contactCta(hotel('573001234567', null), {
      kind: 'roomType',
      name: 'Habitación de pareja',
    });
    expect(new URL(cta?.href ?? '').searchParams.get('text')).toContain('Habitación de pareja');
  });
});

describe('localPhone', () => {
  it('drops the Colombian country code and groups 3-3-4', () => {
    expect(localPhone('+57 310 679 8260')).toBe('310 679 8260');
    expect(localPhone('573106798260')).toBe('310 679 8260');
    expect(localPhone('3106798260')).toBe('310 679 8260');
  });

  it('keeps any other format as written', () => {
    expect(localPhone('+1 555 0100')).toBe('+1 555 0100');
  });
});
