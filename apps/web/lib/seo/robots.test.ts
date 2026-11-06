import { describe, expect, it } from 'vitest';
import { buildRobots } from './robots';

describe('buildRobots', () => {
  it('blocks everything on staging and local copies, with no sitemap', () => {
    expect(buildRobots({ indexable: false, origin: 'http://localhost:3000' })).toEqual({
      rules: [{ userAgent: '*', disallow: '/' }],
    });
  });

  it('allows the public site, keeps the admin and the API out and points to the sitemap', () => {
    expect(buildRobots({ indexable: true, origin: 'https://hotelbambuplaza.com' })).toEqual({
      rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }],
      sitemap: 'https://hotelbambuplaza.com/sitemap.xml',
    });
  });

  it('never blocks the Next.js assets that render the pages', () => {
    const robots = buildRobots({ indexable: true, origin: 'https://hotelbambuplaza.com' });
    const disallowed = [robots.rules]
      .flat()
      .flatMap((rule) => (Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow ?? '']));
    expect(disallowed.some((path) => path && '/_next/static/chunks/app.js'.startsWith(path))).toBe(
      false,
    );
  });
});
