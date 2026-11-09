// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { PublicHotel } from '@/lib/public/types';
import { LegalDocument, legalTodos, type LegalContext, type LegalDocKey } from './legal-documents';

const hotel: PublicHotel = {
  name: 'Hotel Bambú Plaza',
  legalName: 'Hotel Bambú Plaza S.A.S., NIT 900.000.000-1',
  rntNumber: '232175',
  tagline: null,
  shortDescription: null,
  description: null,
  address: 'Calle 8 # 7-10',
  municipality: 'Mocoa',
  department: 'Putumayo',
  country: 'Colombia',
  latitude: null,
  longitude: null,
  mapUrl: null,
  directions: null,
  nearbyAttractions: null,
  phone: '+57 310 679 8260',
  whatsappNumber: null,
  whatsappGreeting: null,
  email: 'reservas@hotelbambu.test',
  openingHours: null,
  checkInTime: null,
  checkOutTime: null,
  updatedAt: '2026-11-01T00:00:00.000Z',
  logo: null,
};

const context: LegalContext = { hotel, effectiveDate: '2026-12-01' };

function renderDoc(doc: LegalDocKey, ctx: LegalContext = context) {
  const { container } = render(<LegalDocument doc={doc} context={ctx} />);
  const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent ?? '');
  return { text: container.textContent ?? '', headings };
}

describe('legal documents: mandatory content (Decreto 1377 de 2013, compiled in Decreto 1074 de 2015)', () => {
  afterEach(cleanup);

  it('data-processing policy carries every element of art. 13', () => {
    const { text, headings } = renderDoc('tratamiento-de-datos');
    expect(headings).toEqual([
      '1. Responsable del tratamiento',
      '2. Datos que tratamos',
      '3. Tratamiento y finalidades',
      '4. Autorización',
      '5. Tus derechos',
      '6. Área responsable de consultas y reclamos',
      '7. Procedimiento para ejercer tus derechos',
      '8. Seguridad, conservación y encargados',
      '9. Vigencia de la política y de las bases de datos',
    ]);
    // Controller identity: name, domicile, address, email and phone.
    for (const fact of [hotel.legalName!, 'Mocoa', 'Calle 8 # 7-10', hotel.email!, hotel.phone!]) {
      expect(text).toContain(fact);
    }
    expect(text).toMatch(/recolección, almacenamiento, uso, circulación y supresión/);
    expect(text).toMatch(/administración del Hotel/);
    for (const action of ['conocer', 'actualizar', 'rectificar', 'suprimir', 'revocar']) {
      expect(text.toLowerCase()).toContain(action);
    }
    expect(text).toContain('1 de diciembre de 2026');
    expect(text).toMatch(/bases de datos .* vigentes/);
  });

  it('privacy notice carries every element of art. 15', () => {
    const { text, headings } = renderDoc('aviso-de-privacidad');
    expect(headings).toEqual([
      'Responsable del tratamiento',
      'Tratamiento y finalidades',
      'Tus derechos',
      'Datos sensibles y de menores de edad',
      'Política de tratamiento y cambios',
    ]);
    expect(text).toContain(hotel.email!);
    expect(text).toContain(hotel.phone!);
    expect(text).toMatch(/facultativ/);
    expect(text).toMatch(/cambios sustanciales/);
    expect(screen.getByRole('link', { name: /política de tratamiento de datos/ })).toBeTruthy();
  });

  it('cookie policy explains the types, their purpose and how to change consent', () => {
    const { text, headings } = renderDoc('cookies');
    expect(headings).toEqual(['Categorías', 'Inventario', 'Cambiar o retirar tu consentimiento']);
    expect(screen.getByRole('columnheader', { name: 'Finalidad' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Configurar cookies' })).toBeTruthy();
    expect(text).toMatch(/configuración de tu navegador/);
  });

  it('keeps the draft mechanism: missing facts become visible markers and TODO items', () => {
    const empty: LegalContext = {
      hotel: { ...hotel, legalName: null, email: null },
      effectiveDate: null,
    };
    const { text } = renderDoc('tratamiento-de-datos', empty);
    expect(text).toContain('[pendiente: razón social y NIT]');
    expect(legalTodos('tratamiento-de-datos', empty).map((t) => t.label)).toEqual(
      expect.arrayContaining([
        'razón social y NIT del responsable del tratamiento',
        'correo para consultas y reclamos',
        'fecha de entrada en vigencia',
      ]),
    );
  });
});
