import { DM_Sans, Gilda_Display } from 'next/font/google';

// Self-hosted at build time by next/font: the woff2 files are emitted under /_next/static/media
// and served by this app, with no runtime request to Google. The Latin subset covers
// á é í ó ú ñ ü ¿ ¡ (requirement 20.2: max 2 families, font-display swap).

/**
 * DM Sans as one variable file (weight axis): covers the mockup's 400/500/600/700 in a single
 * preload. The mockup also asks for 800, which it never loaded; our styles cap at 700.
 */
export const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: 'variable',
  display: 'swap',
  variable: '--font-dm-sans',
});

/** Gilda Display ships one weight (400): headings, wordmark, fact numbers. */
export const gildaDisplay = Gilda_Display({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-gilda',
});
