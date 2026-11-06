import { describe, expect, it } from 'vitest';
import { PUBLIC_REDIRECTS } from './redirects';
import { routes } from './navigation';

describe('PUBLIC_REDIRECTS (merged pages, C3)', () => {
  const target = (source: string) => PUBLIC_REDIRECTS.find((rule) => rule.source === source);

  it('sends /contacto to the merged location page with a 301', () => {
    expect(target('/contacto')).toEqual({
      source: '/contacto',
      destination: routes.location,
      statusCode: 301,
    });
  });

  it('sends the old FAQ page to the merged policies page with a 301', () => {
    expect(target('/preguntas-frecuentes')).toEqual({
      source: '/preguntas-frecuentes',
      destination: routes.policies,
      statusCode: 301,
    });
  });

  it('sends /servicios to the home page with a 301', () => {
    expect(target('/servicios')).toEqual({
      source: '/servicios',
      destination: '/',
      statusCode: 301,
    });
  });

  it('never redirects a live route', () => {
    const live: string[] = [
      routes.home,
      routes.rooms,
      routes.gallery,
      routes.location,
      routes.policies,
    ];
    expect(PUBLIC_REDIRECTS.filter((rule) => live.includes(rule.source))).toEqual([]);
  });

  it('covers every public page removed since v1 (D6 audit of the git history)', () => {
    // Pages deleted from apps/web/app/(site): contacto and preguntas-frecuentes (C3),
    // servicios (D3). Old room URLs answer a permanent redirect from the API slug map.
    const removed = ['/contacto', '/preguntas-frecuentes', '/servicios'];
    expect(PUBLIC_REDIRECTS.map((rule) => rule.source).sort()).toEqual(removed.sort());
  });

  it('lands on a live page in one hop (no chains, no loops)', () => {
    const sources = new Set<string>(PUBLIC_REDIRECTS.map((rule) => rule.source));
    const live = new Set<string>([routes.home, routes.rooms, routes.location, routes.policies]);
    for (const rule of PUBLIC_REDIRECTS) {
      expect(sources.has(rule.destination)).toBe(false);
      expect(live.has(rule.destination)).toBe(true);
    }
  });
});
