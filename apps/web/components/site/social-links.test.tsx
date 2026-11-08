// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SocialLinks } from './social-links';

const links = [
  { id: '1', platform: 'INSTAGRAM', url: 'https://www.instagram.com/hotelbambu' },
  { id: '2', platform: 'FACEBOOK', url: 'https://www.facebook.com/hotelbambu' },
  { id: '3', platform: 'OTHER', url: 'https://example.com/hotel' },
];

describe('SocialLinks (footer brand icons)', () => {
  afterEach(cleanup);

  it('names each link after the platform and the hotel, with a brand icon and a visible label', () => {
    render(<SocialLinks links={links} hotelName="Hotel Bambú Plaza" />);
    const instagram = screen.getByRole('link', { name: /^Instagram de Hotel Bambú Plaza/ });
    expect(instagram.getAttribute('href')).toBe(links[0]!.url);
    expect(instagram.getAttribute('target')).toBe('_blank');
    expect(instagram.getAttribute('rel')).toMatch(/noopener/);
    expect(instagram.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    expect(instagram.textContent).toContain('Instagram');
    expect(screen.getByRole('link', { name: /^Facebook de Hotel Bambú Plaza/ })).toBeTruthy();
  });

  it('uses a generic name and icon for other platforms', () => {
    render(<SocialLinks links={links} hotelName="Hotel Bambú Plaza" />);
    const other = screen.getByRole('link', { name: /^Sitio web de Hotel Bambú Plaza/ });
    expect(other.querySelector('svg')).not.toBeNull();
  });

  it('renders nothing without links', () => {
    const { container } = render(<SocialLinks links={[]} hotelName="Hotel Bambú Plaza" />);
    expect(container.innerHTML).toBe('');
  });
});
