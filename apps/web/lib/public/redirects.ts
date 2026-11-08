/**
 * Permanent redirects of the merged public pages (C3). Read by `next.config.ts` (`redirects()`),
 * so they answer before any page renders. Plain data with no imports: the Next.js config loader
 * compiles this file on its own. Keep the destinations in sync with `routes` (unit tested).
 *
 * - `/contacto` merged into "Ubicación y cómo llegar".
 * - `/preguntas-frecuentes` merged into the rules + FAQ page (C3), now "Información para
 *   huéspedes"; it points straight at the new path so it stays one hop.
 * - `/servicios` was removed in D3 (hotel amenities live on the home page).
 * - `/politicas-del-hotel` renamed to `/informacion-para-huespedes` (owner review 2026-11-08;
 *   "políticas" is kept for the legal pages).
 */
export const PUBLIC_REDIRECTS = [
  { source: '/contacto', destination: '/ubicacion', statusCode: 301 },
  { source: '/preguntas-frecuentes', destination: '/informacion-para-huespedes', statusCode: 301 },
  { source: '/servicios', destination: '/', statusCode: 301 },
  {
    source: '/politicas-del-hotel',
    destination: '/informacion-para-huespedes',
    statusCode: 301,
  },
] as const satisfies readonly { source: string; destination: string; statusCode: 301 }[];
