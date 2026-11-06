// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HeroCarousel } from './hero-carousel';

let reducedMotion = false;

beforeEach(() => {
  reducedMotion = false;
  vi.useFakeTimers();
  window.matchMedia = vi.fn((query: string) => ({
    matches: query.includes('reduce') ? reducedMotion : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const slides = ['Fachada', 'Habitación', 'Pasillo'].map((label) => (
  <span key={label}>{label}</span>
));
const slideGroups = () => screen.getAllByRole('group', { hidden: true });
const activeIndex = () => slideGroups().findIndex((slide) => !slide.hasAttribute('inert'));

describe('HeroCarousel', () => {
  it('renders one slide without controls', () => {
    render(<HeroCarousel slides={slides.slice(0, 1)} label="Fotos del hotel" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText('01')).toBeNull();
  });

  it('exposes carousel semantics and hides inactive slides', () => {
    render(<HeroCarousel slides={slides} label="Fotos del hotel" />);
    const region = screen.getByRole('region', { name: 'Fotos del hotel' });
    expect(region.getAttribute('aria-roledescription')).toBe('carrusel');
    const groups = slideGroups();
    expect(groups.map((group) => group.getAttribute('aria-label'))).toEqual([
      '1 de 3',
      '2 de 3',
      '3 de 3',
    ]);
    expect(groups[0]!.getAttribute('aria-hidden')).toBeNull();
    expect(groups[1]!.getAttribute('aria-hidden')).toBe('true');
    expect(groups[1]!.hasAttribute('inert')).toBe(true);
  });

  it('keeps the later slides out of the server HTML layout so only slide 1 loads before LCP', () => {
    const html = renderToString(<HeroCarousel slides={slides} label="Fotos del hotel" />);
    const groups = html.match(/<div[^>]*role="group"[^>]*>/g) ?? [];
    expect(groups).toHaveLength(3);
    expect(groups[0]).not.toContain('hidden');
    expect(groups[1]).toContain('hidden=""');
    expect(groups[2]).toContain('hidden=""');
  });

  it('shows every slide once the page has loaded', () => {
    render(<HeroCarousel slides={slides} label="Fotos del hotel" />);
    act(() => {
      vi.runOnlyPendingTimers();
    });
    expect(slideGroups().filter((group) => group.hidden)).toEqual([]);
  });

  it('autoplays every 5.5 s and stops when paused', () => {
    render(<HeroCarousel slides={slides} label="Fotos del hotel" />);
    expect(activeIndex()).toBe(0);
    act(() => vi.advanceTimersByTime(5500));
    expect(activeIndex()).toBe(1);

    const pause = screen.getByRole('button', { name: 'Pausar presentación' });
    expect(pause.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(pause);
    expect(pause.getAttribute('aria-pressed')).toBe('true');
    expect(pause.getAttribute('aria-label')).toBe('Reanudar presentación');
    act(() => vi.advanceTimersByTime(20000));
    expect(activeIndex()).toBe(1);
  });

  it('moves with the previous and next buttons and shows the index', () => {
    render(<HeroCarousel slides={slides} label="Fotos del hotel" />);
    fireEvent.click(screen.getByRole('button', { name: 'Foto anterior' }));
    expect(activeIndex()).toBe(2);
    expect(screen.getByText('03')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Foto siguiente' }));
    expect(activeIndex()).toBe(0);
  });

  it('starts paused with reduced motion', () => {
    reducedMotion = true;
    render(<HeroCarousel slides={slides} label="Fotos del hotel" />);
    act(() => vi.advanceTimersByTime(20000));
    expect(activeIndex()).toBe(0);
    expect(
      screen.getByRole('button', { name: 'Reanudar presentación' }).getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('holds the rotation while focus is inside and resumes after', () => {
    render(<HeroCarousel slides={slides} label="Fotos del hotel" />);
    const next = screen.getByRole('button', { name: 'Foto siguiente' });
    fireEvent.focusIn(next);
    act(() => vi.advanceTimersByTime(11000));
    expect(activeIndex()).toBe(0);
    fireEvent.focusOut(next, { relatedTarget: document.body });
    act(() => vi.advanceTimersByTime(5500));
    expect(activeIndex()).toBe(1);
  });
});
