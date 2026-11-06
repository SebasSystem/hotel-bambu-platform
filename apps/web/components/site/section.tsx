import type { ReactNode } from 'react';
import { Eyebrow } from '@/components/ui/eyebrow';
import { SectionHeading as UiSectionHeading, type Surface } from '@/components/ui/section-heading';

/** Small uppercase label above section titles (mockup eyebrow). */
export function Kicker({ children, onDark = false }: { children: ReactNode; onDark?: boolean }) {
  return (
    <div data-reveal>
      <Eyebrow tone={onDark ? 'onDark' : 'default'}>{children}</Eyebrow>
    </div>
  );
}

interface SectionHeadingProps {
  kicker?: string | null;
  title: string;
  intro?: string | null;
  onDark?: boolean;
  /** Background behind the heading; `sand` switches the intro to the stronger grey (contrast). */
  surface?: Surface;
  id?: string;
  as?: 'h1' | 'h2';
  className?: string;
}

/**
 * Pre-mockup heading API used by the current pages (D2 rebuilds them on
 * components/ui/section-heading directly).
 */
export function SectionHeading({
  kicker,
  title,
  intro,
  onDark = false,
  surface,
  id,
  as = 'h2',
  className = '',
}: SectionHeadingProps) {
  return (
    <div data-reveal className={className}>
      <UiSectionHeading
        as={as}
        id={id}
        eyebrow={kicker}
        title={title}
        intro={intro}
        surface={surface ?? (onDark ? 'dark' : 'light')}
      />
    </div>
  );
}
