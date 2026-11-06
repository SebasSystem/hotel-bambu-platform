import { buttonClass } from '@/components/ui/button';

/**
 * Shared class lists for public-site controls. The keys predate the mockup port; they now map to
 * the mockup button variants (components/ui/button.ts) so existing pages inherit the new look.
 */
export const button = {
  primary: buttonClass('primary'),
  /** WhatsApp CTAs use the brand primary (mockup "Consultar"); the FAB keeps WhatsApp green. */
  whatsapp: buttonClass('primary'),
  outline: buttonClass('ghost'),
  outlineOnDark: buttonClass('ghostOnDark'),
  light: buttonClass('light'),
  dark: buttonClass('dark'),
};

/** Page container: content capped at 1440 px (mockup has none; spec §1.6). */
export const container = 'mx-auto w-full max-w-(--container-site) px-(--gutter)';

export const link =
  'font-semibold text-primary underline decoration-sage decoration-2 underline-offset-4 transition-colors duration-(--duration-fast) hover:decoration-primary';
