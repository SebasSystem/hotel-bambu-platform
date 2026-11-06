import type { ReactNode } from 'react';

export type EyebrowTone = 'default' | 'onDark' | 'onPhoto';

const tones: Record<EyebrowTone, string> = {
  default: 'text-green',
  onDark: 'text-sage',
  onPhoto: 'text-on-dark-muted',
};

/**
 * Small uppercase label above titles (mockup `.eyebrow`): a 24 px leading rule, .72rem/700,
 * .16em tracking. Green on light surfaces (≥ 5.6:1, sand included), sage on green bands.
 */
export function Eyebrow({
  children,
  tone = 'default',
  className = '',
}: {
  children: ReactNode;
  tone?: EyebrowTone;
  className?: string;
}) {
  return (
    <p
      className={`inline-flex items-center gap-2 text-eyebrow font-bold tracking-kicker uppercase before:h-px before:w-6 before:shrink-0 before:bg-current before:content-[''] ${tones[tone]} ${className}`}
    >
      {children}
    </p>
  );
}
