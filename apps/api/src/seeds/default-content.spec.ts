import { describe, expect, it } from 'vitest';
import {
  DEFAULT_POLICIES,
  DEFAULT_STAY_TIMES,
  DEMO_MARKER,
  buildDefaultFaqs,
  formatStayTime,
} from './default-content.js';

const context = {
  checkInTime: '15:00',
  checkOutTime: '12:00',
  address: 'Calle 8 # 7-10',
  municipality: 'Mocoa',
  department: 'Putumayo',
};

describe('default guest content (owner review 2026-11-08)', () => {
  it('formats the stay times the way guests read them in Colombia', () => {
    expect(formatStayTime('15:00')).toBe('3:00 p. m.');
    expect(formatStayTime('12:00')).toBe('12:00 m.');
    expect(formatStayTime('09:30')).toBe('9:30 a. m.');
    expect(formatStayTime('00:15')).toBe('12:15 a. m.');
    expect(formatStayTime('mediodía')).toBe('mediodía');
    expect(DEFAULT_STAY_TIMES).toEqual({ checkInTime: '15:00', checkOutTime: '12:00' });
  });

  it('publishes the eight guest policies without demo markers or invented penalties', () => {
    expect(DEFAULT_POLICIES.map((policy) => policy.title)).toEqual([
      'Check-in y check-out',
      'Registro de huéspedes',
      'Menores de edad',
      'Cancelaciones y cambios',
      'Medios de pago',
      'IVA para extranjeros no residentes',
      'Mascotas',
      'Hotel libre de humo',
    ]);
    const text = DEFAULT_POLICIES.map((p) => `${p.title} ${p.content}`).join('\n');
    expect(text).not.toContain(DEMO_MARKER);
    expect(text).not.toMatch(/\bTODO\b|\$|penalidad|\bmulta/);
    // The check-in policy refers to the profile figures instead of repeating the hours.
    expect(DEFAULT_POLICIES[0]!.content).not.toMatch(/\d{1,2}:\d{2}/);
    for (const law of [
      'Ley 2068 de 2020',
      'Ley 1098 de 2006',
      'Ley 1336 de 2009',
      'Ley 1335 de 2009',
    ]) {
      expect(text).toContain(law);
    }
    expect(text).toMatch(/SIRE/);
    expect(text).toMatch(/artículo 481, literal d/);
    expect(text).toMatch(/48 horas/);
  });

  it('answers the frequent questions from the profile facts', () => {
    const faqs = buildDefaultFaqs(context);
    expect(faqs.length).toBeGreaterThanOrEqual(6);
    expect(faqs.length).toBeLessThanOrEqual(8);
    expect(faqs[0]!.answer).toContain('desde las 3:00 p. m. y el check-out hasta las 12:00 m.');
    const location = faqs.find((faq) => faq.question === '¿Cómo llego al hotel?');
    expect(location?.answer).toContain('Calle 8 # 7-10, Mocoa (Putumayo)');
    expect(faqs.find((faq) => /Wi-Fi/.test(faq.question))).toBeDefined();
    const text = faqs.map((f) => `${f.question} ${f.answer}`).join('\n');
    expect(text).not.toContain(DEMO_MARKER);
    expect(text).not.toMatch(/\bTODO\b|\$|parqueadero|desayuno/i);
    expect(faqs.filter((faq) => faq.showOnHome).length).toBe(4);
  });

  it('falls back to the default times and drops the address sentence when unknown', () => {
    const faqs = buildDefaultFaqs({
      checkInTime: null,
      checkOutTime: ' ',
      address: null,
      municipality: null,
      department: null,
    });
    expect(faqs[0]!.answer).toContain('3:00 p. m.');
    expect(faqs.find((faq) => faq.question === '¿Cómo llego al hotel?')?.answer).not.toMatch(
      /Estamos en/,
    );
  });
});
