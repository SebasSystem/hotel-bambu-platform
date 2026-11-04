/** Shared class lists for public-site controls (tokens from styles/tokens.css). */

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-pill px-6 py-2.5 text-sm font-semibold transition-[background-color,color,border-color,filter] duration-(--duration-fast) ease-(--ease-standard)';

export const button = {
  primary: `${base} bg-primary text-primary-foreground hover:bg-primary-hover`,
  /** `ink-900` on `#25D366` (8.43:1); never white text on WhatsApp green. */
  whatsapp: `${base} bg-whatsapp text-whatsapp-foreground hover:brightness-95`,
  outline: `${base} border border-bamboo-700 text-bamboo-700 hover:bg-bamboo-100`,
  outlineOnDark: `${base} border border-sand-50/60 text-sand-50 hover:bg-sand-50/10`,
  light: `${base} bg-sand-50 text-bamboo-900 hover:bg-white`,
};

export const container = 'mx-auto w-full max-w-(--container-site) px-(--gutter)';

export const link =
  'font-semibold text-primary underline decoration-bamboo-300 decoration-2 underline-offset-4 transition-colors duration-(--duration-fast) hover:decoration-primary';
