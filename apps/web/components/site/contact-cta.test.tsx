// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ContactCtaLink } from './contact-cta';

describe('ContactCtaLink icons (owner review A13)', () => {
  afterEach(cleanup);

  it('shows the WhatsApp brand glyph, hidden from assistive tech, on WhatsApp CTAs', () => {
    render(
      <ContactCtaLink
        cta={{ kind: 'whatsapp', href: 'https://wa.me/573106798260' }}
        source="room_card"
        whatsappLabel="Escribir por WhatsApp"
      />,
    );
    const link = screen.getByRole('link', { name: /Escribir por WhatsApp/ });
    const icon = link.querySelector('svg[data-icon="whatsapp"]');
    expect(icon).not.toBeNull();
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps the phone icon, without the WhatsApp glyph, on phone CTAs', () => {
    render(
      <ContactCtaLink
        cta={{
          kind: 'phone',
          href: 'tel:+573106798260',
          phone: '310 679 8260',
          label: 'Llamar al 310 679 8260',
        }}
        source="room_card"
      />,
    );
    const link = screen.getByRole('link', { name: 'Llamar al 310 679 8260' });
    expect(link.querySelector('svg[data-icon="whatsapp"]')).toBeNull();
    expect(link.querySelector('svg')).not.toBeNull();
  });
});
