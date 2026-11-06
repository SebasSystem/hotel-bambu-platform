// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BrandLogo } from './brand-logo';

afterEach(cleanup);

describe('BrandLogo', () => {
  it('exposes one accessible name instead of the split wordmark text', () => {
    render(<BrandLogo />);
    const logo = screen.getByRole('img', { name: 'Hotel Bambú Plaza, Mocoa' });
    // The visible wordmark stays on screen but is not read twice.
    expect(logo.textContent).toContain('Hotel Bambú');
    expect(logo.textContent).toContain('PLAZA · MOCOA');
    expect(logo.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('accepts a custom accessible name', () => {
    render(<BrandLogo label="Hotel Bambú Plaza" />);
    expect(screen.getByRole('img', { name: 'Hotel Bambú Plaza' })).toBeTruthy();
  });

  it('is hidden from assistive tech when a parent link carries the name', () => {
    const { container } = render(
      <a href="#inicio" aria-label="Hotel Bambú Plaza, inicio">
        <BrandLogo decorative />
      </a>,
    );
    expect(screen.queryByRole('img')).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Hotel Bambú Plaza, inicio' })).toBeTruthy();
  });

  it('paints the node cuts with the surrounding background colour', () => {
    const { rerender } = render(<BrandLogo />);
    const light = screen.getByRole('img');
    expect(light.style.getPropertyValue('--brand-cut')).toBe('var(--color-ivory)');

    rerender(<BrandLogo tone="dark" />);
    expect(screen.getByRole('img').style.getPropertyValue('--brand-cut')).toBe(
      'var(--color-charcoal)',
    );

    rerender(<BrandLogo tone="dark" cutColor="var(--color-green-900)" />);
    const cuts = screen.getByRole('img').querySelector('[data-brand-cut]');
    expect(screen.getByRole('img').style.getPropertyValue('--brand-cut')).toBe(
      'var(--color-green-900)',
    );
    expect(cuts?.getAttribute('style')).toContain('var(--brand-cut)');
  });

  it('can render the mark alone', () => {
    render(<BrandLogo wordmark={false} />);
    const logo = screen.getByRole('img', { name: 'Hotel Bambú Plaza, Mocoa' });
    expect(logo.textContent).not.toContain('Hotel Bambú');
  });
});
