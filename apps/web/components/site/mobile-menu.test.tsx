// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MobileMenu } from './mobile-menu';

let pathname = '/';
vi.mock('next/navigation', () => ({ usePathname: () => pathname }));

const links = [
  { href: '/', label: 'Inicio' },
  { href: '/habitaciones', label: 'Habitaciones' },
  { href: '/galeria', label: 'Galería' },
];

function renderMenu(whatsappUrl: string | null = 'https://wa.me/573000000000') {
  return render(
    <>
      <MobileMenu links={links} whatsappUrl={whatsappUrl} />
      <main data-menu-inert="">
        <a href="#fuera">Fuera del menú</a>
      </main>
    </>,
  );
}

const toggle = () => screen.getByRole('button', { name: /menú/i });

describe('MobileMenu', () => {
  beforeEach(() => {
    pathname = '/';
  });
  afterEach(cleanup);

  it('opens from the toggle and moves focus to the first link', async () => {
    const user = userEvent.setup();
    renderMenu();
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('navigation', { name: 'Menú principal' })).toBeNull();

    await user.click(toggle());

    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(toggle().getAttribute('aria-label')).toBe('Cerrar menú');
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Inicio' }));
  });

  it('traps Tab and Shift+Tab between the toggle and the panel', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(toggle());

    const whatsapp = screen.getByRole('link', { name: /WhatsApp/ });
    whatsapp.focus();
    await user.tab();
    expect(document.activeElement).toBe(toggle());

    await user.tab({ shift: true });
    expect(document.activeElement).toBe(whatsapp);

    // Never escapes to the page behind the menu.
    for (let i = 0; i < 6; i += 1) await user.tab();
    expect(document.activeElement?.textContent).not.toBe('Fuera del menú');
  });

  it('closes on Escape and returns focus to the toggle', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(toggle());
    await user.keyboard('{Escape}');

    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('navigation', { name: 'Menú principal' })).toBeNull();
    expect(document.activeElement).toBe(toggle());
  });

  it('closes when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    const { container } = renderMenu();
    await user.click(toggle());
    await user.click(container.querySelector('[data-menu-backdrop]')!);
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
  });

  it('makes the page behind inert while open', async () => {
    const user = userEvent.setup();
    renderMenu();
    const main = screen.getByRole('main');
    await user.click(toggle());
    expect(main.hasAttribute('inert')).toBe(true);
    await user.keyboard('{Escape}');
    expect(main.hasAttribute('inert')).toBe(false);
  });

  it('closes after navigating to another route', async () => {
    const user = userEvent.setup();
    const view = renderMenu();
    await user.click(toggle());

    pathname = '/galeria';
    act(() => {
      view.rerender(
        <>
          <MobileMenu links={links} whatsappUrl={null} />
          <main data-menu-inert="" />
        </>,
      );
    });
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
  });

  it('marks the current section, including nested routes', async () => {
    const user = userEvent.setup();
    pathname = '/habitaciones/suite-01';
    renderMenu();
    await user.click(toggle());
    expect(screen.getByRole('link', { name: 'Habitaciones' }).getAttribute('aria-current')).toBe(
      'page',
    );
    expect(screen.getByRole('link', { name: 'Inicio' }).getAttribute('aria-current')).toBeNull();
  });
});
