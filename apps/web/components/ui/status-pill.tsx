import type { ReactNode } from 'react';

export type StatusTone = 'success' | 'neutral' | 'warning' | 'onPhoto';

const tones: Record<StatusTone, string> = {
  success: 'bg-green-50 text-green',
  neutral: 'bg-neutral-bg text-neutral-fg',
  warning: 'bg-warn-bg text-warn-fg',
  onPhoto: 'bg-white/90 text-green backdrop-blur-[8px]',
};

/**
 * Small status label (mockup `.state` and `.status-pill`). PublicationStatus maps PUBLISHED to
 * success, DRAFT to neutral, INACTIVE to warning. 700 replaces the mockup's unloaded 800 weight.
 */
export function StatusPill({
  children,
  tone = 'success',
  className = '',
}: {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2 py-[5px] text-pill leading-tight font-bold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
