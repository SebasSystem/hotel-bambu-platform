import { Fraunces, Manrope } from 'next/font/google';

// Self-hosted at build time by next/font (no runtime requests to Google). Latin subset only
// covers á é í ó ú ñ ü ¿ ¡ (requirement 20.2: max 2 families, font-display swap).
export const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['SOFT', 'opsz'],
  display: 'swap',
  variable: '--font-fraunces',
});

export const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
});
