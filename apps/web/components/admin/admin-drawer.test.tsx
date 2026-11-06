// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminDrawer } from './admin-drawer';

let pathname = '/admin';
vi.mock('next/navigation', () => ({ usePathname: () => pathname }));

function renderDrawer() {
  return render(
    <>
      <AdminDrawer>
        <nav aria-label="Panel">
          <a href="#resumen">Resumen</a>
          <a href="#hotel">Datos del hotel</a>
        </nav>
      </AdminDrawer>
      <main data-admin-inert="">
        <a href="#fuera">Fuera del menú</a>
      </main>
    </>,
  );
}

const toggle = () => screen.getByRole('button', { name: 'Abrir menú del panel' });
const dialog = () => screen.getByRole('dialog', { name: 'Menú del panel' });

describe('AdminDrawer', () => {
  beforeEach(() => {
    pathname = '/admin';
  });
  afterEach(cleanup);

  it('opens a modal drawer from the toggle and focuses its first control', async () => {
    const user = userEvent.setup();
    renderDrawer();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(toggle().getAttribute('aria-expanded')).toBe('false');

    await user.click(toggle());

    expect(dialog().getAttribute('aria-modal')).toBe('true');
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Cerrar menú del panel' }),
    );
    expect(document.querySelector('main')?.hasAttribute('inert')).toBe(true);
  });

  it('traps Tab and Shift+Tab inside the drawer', async () => {
    const user = userEvent.setup();
    renderDrawer();
    await user.click(toggle());

    const close = screen.getByRole('button', { name: 'Cerrar menú del panel' });
    const last = screen.getByRole('link', { name: 'Datos del hotel' });
    last.focus();
    await user.tab();
    expect(document.activeElement).toBe(close);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(last);
  });

  it('closes on Escape, releases the page and returns focus to the toggle', async () => {
    const user = userEvent.setup();
    renderDrawer();
    await user.click(toggle());

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.querySelector('main')?.hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(toggle());
  });

  it('closes from the close button and the backdrop', async () => {
    const user = userEvent.setup();
    renderDrawer();
    await user.click(toggle());
    await user.click(screen.getByRole('button', { name: 'Cerrar menú del panel' }));
    expect(screen.queryByRole('dialog')).toBeNull();

    await user.click(toggle());
    const backdrop = document.querySelector('[data-admin-backdrop]');
    expect(backdrop).not.toBeNull();
    await user.click(backdrop as Element);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes when the route changes', async () => {
    const user = userEvent.setup();
    const view = renderDrawer();
    await user.click(toggle());

    pathname = '/admin/hotel';
    await act(async () => {
      view.rerender(
        <>
          <AdminDrawer>
            <nav aria-label="Panel">
              <a href="#resumen">Resumen</a>
            </nav>
          </AdminDrawer>
          <main data-admin-inert="" />
        </>,
      );
    });

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
