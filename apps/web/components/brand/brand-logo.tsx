import type { CSSProperties } from 'react';

type Tone = 'light' | 'dark';

interface BrandLogoProps {
  /** `light` = green mark on ivory (header); `dark` = ivory mark on charcoal (footer). */
  tone?: Tone;
  /** Colour of the two node "cuts"; defaults to the background of the tone's surface. */
  cutColor?: string;
  /** Accessible name when the logo stands alone. */
  label?: string;
  /** Hide it from assistive tech when a parent link or heading already names it. */
  decorative?: boolean;
  /** Show the two-line wordmark next to the mark. */
  wordmark?: boolean;
  className?: string;
}

const TONES: Record<Tone, { text: string; cut: string }> = {
  light: { text: 'text-green', cut: 'var(--color-ivory)' },
  dark: { text: 'text-ivory', cut: 'var(--color-charcoal)' },
};

export const BRAND_NAME = 'Hotel Bambú';
export const BRAND_SUBLINE = 'PLAZA · MOCOA';
export const BRAND_LABEL = 'Hotel Bambú Plaza, Mocoa';

/**
 * Brand mark (owner-approved, mockup `index.html:23-28`): a bamboo stem with three leaves and two
 * node cuts painted in the surrounding background colour, plus the "Hotel Bambú / PLAZA · MOCOA"
 * wordmark. The SVG uses `currentColor`, so the tone only sets the text colour and the cut colour.
 */
export function BrandLogo({
  tone = 'light',
  cutColor,
  label = BRAND_LABEL,
  decorative = false,
  wordmark = true,
  className = '',
}: BrandLogoProps) {
  const style = { '--brand-cut': cutColor ?? TONES[tone].cut } as CSSProperties;
  const a11y = decorative
    ? ({ 'aria-hidden': true } as const)
    : ({ role: 'img', 'aria-label': label } as const);

  return (
    <span
      {...a11y}
      data-tone={tone}
      style={style}
      className={`inline-flex items-center gap-[11px] ${TONES[tone].text} ${className}`}
    >
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="size-10 shrink-0">
        <rect x="18" y="5" width="9" height="38" rx="4.5" fill="currentColor" />
        <path
          d="M12 17c7 0 10-4 11-10-7 0-11 3-11 10Zm15 11c7-1 11-5 12-12-8 0-12 4-12 12ZM8 32c7 0 11-3 13-10-8 0-12 3-13 10Z"
          fill="currentColor"
          opacity=".72"
        />
        <path
          data-brand-cut=""
          d="M17 18h11M16 31h12"
          style={{ stroke: 'var(--brand-cut)' }}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
      {wordmark ? (
        <span className="grid leading-none">
          <span className="font-display text-base tab:text-wordmark">{BRAND_NAME}</span>
          <span className="mt-[5px] text-wordmark-sub tracking-wordmark">{BRAND_SUBLINE}</span>
        </span>
      ) : null}
    </span>
  );
}
