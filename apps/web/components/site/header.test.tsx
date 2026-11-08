// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ContactCta, PhoneContact } from '@/lib/public/cta';
import { Header } from './header';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

const whatsapp: ContactCta = { kind: 'whatsapp', href: 'https://wa.me/573001234567?text=Hola' };
const phone: PhoneContact = {
  kind: 'phone',
  href: 'tel:+573106798260',
  phone: '310 679 8260',
  label: 'Llamar al 310 679 8260',
};

const banner = () => screen.getByRole('banner');
const telLinks = () =>
  within(banner())
    .queryAllByRole('link')
    .filter((link) => link.getAttribute('href') === phone.href);
const whatsappLinks = () =>
  within(banner())
    .queryAllByRole('link')
    .filter((link) => link.getAttribute('href') === whatsapp.href);

describe('Header contact CTAs (dynamic from the hotel profile)', () => {
  afterEach(cleanup);

  it('shows the WhatsApp button and the phone next to it when both exist', () => {
    render(<Header cta={whatsapp} phone={phone} />);
    expect(screen.getByRole('link', { name: /Escribir por WhatsApp/ })).toHaveProperty(
      'href',
      whatsapp.href,
    );
    // Desktop phone link next to WhatsApp + mobile call icon.
    expect(telLinks()).toHaveLength(2);
    for (const link of telLinks()) {
      expect(link.getAttribute('aria-label') ?? link.textContent).toMatch(/Llamar al 310 679 8260/);
    }
  });

  it('keeps a mobile call icon instead of a WhatsApp icon when a phone exists', () => {
    render(<Header cta={whatsapp} phone={phone} />);
    // Only the desktop WhatsApp button: phones reach WhatsApp through the floating button.
    expect(whatsappLinks()).toHaveLength(1);
  });

  it('shows only the phone button when there is no WhatsApp number', () => {
    render(<Header cta={phone} phone={phone} />);
    expect(whatsappLinks()).toHaveLength(0);
    expect(telLinks()).toHaveLength(2);
  });

  it('falls back to a WhatsApp icon on phones when there is no phone number', () => {
    render(<Header cta={whatsapp} phone={null} />);
    expect(telLinks()).toHaveLength(0);
    expect(whatsappLinks()).toHaveLength(2);
  });

  it('renders no contact link when neither exists', () => {
    render(<Header cta={null} phone={null} />);
    expect(telLinks()).toHaveLength(0);
    expect(whatsappLinks()).toHaveLength(0);
  });
});
