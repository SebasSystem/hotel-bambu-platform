// @vitest-environment jsdom
import type { PublicMedia } from '@hotel-bambu/shared';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PhotoGallery } from './photo-gallery';

let pathname = '/galeria';
vi.mock('next/navigation', () => ({ usePathname: () => pathname }));

const media = (id: string, altText: string): PublicMedia => ({
  id,
  altText,
  caption: null,
  width: 960,
  height: 1280,
  blurDataUrl: null,
  dominantColor: null,
  variants: [{ format: 'webp', width: 960, height: 1280, url: `/media/${id}.webp` }],
});

const images = [media('a', 'Fachada del hotel'), media('b', 'Pasillo'), media('c', 'Habitación')];

const page = () => (
  <main data-menu-inert="">
    <PhotoGallery images={images} variant="masonry" />
    <a href="#fuera">Enlace de la página</a>
  </main>
);

const dialog = () => screen.queryByRole('dialog');
const main = () => document.querySelector('main')!;

describe('PhotoGallery lightbox', () => {
  beforeEach(() => {
    pathname = '/galeria';
  });
  afterEach(cleanup);

  it('opens a modal dialog on the clicked photo and focuses the close button', async () => {
    const user = userEvent.setup();
    render(page());
    expect(dialog()).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Ampliar imagen: Pasillo' }));
    expect(dialog()?.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByText('Imagen 2 de 3')).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cerrar' }));
    expect(main().hasAttribute('inert')).toBe(true);
  });

  it('traps Tab inside the dialog and navigates with the arrow keys', async () => {
    const user = userEvent.setup();
    render(page());
    await user.click(screen.getByRole('button', { name: 'Ampliar imagen: Fachada del hotel' }));
    const close = screen.getByRole('button', { name: 'Cerrar' });
    const next = screen.getByRole('button', { name: 'Imagen siguiente' });
    next.focus();
    await user.tab();
    expect(document.activeElement).toBe(close);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(next);
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('Imagen 2 de 3')).toBeTruthy();
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByText('Imagen 3 de 3')).toBeTruthy();
  });

  it('closes on Escape, returns focus to the photo and frees the page', async () => {
    const user = userEvent.setup();
    render(page());
    const trigger = screen.getByRole('button', { name: 'Ampliar imagen: Habitación' });
    await user.click(trigger);
    // Browsers ignore focus() inside an inert subtree (jsdom does not): record such attempts.
    const focusWhileInert = vi.fn();
    const focus = trigger.focus.bind(trigger);
    trigger.focus = (options) => {
      if (trigger.closest('[inert]')) focusWhileInert();
      focus(options);
    };
    await user.keyboard('{Escape}');
    expect(focusWhileInert).not.toHaveBeenCalled();
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(main().hasAttribute('inert')).toBe(false);
    expect(document.querySelector('[data-lightbox]')).toBeNull();
  });

  it('closes on the backdrop and when the route changes', async () => {
    const user = userEvent.setup();
    const view = render(page());
    await user.click(screen.getByRole('button', { name: 'Ampliar imagen: Pasillo' }));
    await user.click(screen.getByTestId('lightbox-backdrop'));
    expect(dialog()).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Ampliar imagen: Pasillo' }));
    expect(dialog()).not.toBeNull();
    pathname = '/contacto';
    view.rerender(page());
    expect(dialog()).toBeNull();
    expect(main().hasAttribute('inert')).toBe(false);
  });
});
