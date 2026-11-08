import type { ReactNode } from 'react';
import { Eyebrow } from './eyebrow';

export type Surface = 'light' | 'sand' | 'dark';

interface SectionHeadingProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  as?: 'h1' | 'h2';
  /** `display` = home hero h1; `page` = inner-page hero h1; `section` = h2 scale. */
  size?: 'display' | 'page' | 'section';
  surface?: Surface;
  id?: string;
  className?: string;
  /** Extra content under the intro (actions). */
  children?: ReactNode;
}

const titleSize = {
  display: 'text-display max-w-[780px]',
  page: 'text-page-title max-w-[930px]',
  section: 'text-h2',
} as const;

/** Intro colour per surface: plain muted is 4.3:1 on sand, so sand uses the stronger grey. */
const introTone: Record<Surface, string> = {
  light: 'text-muted-foreground',
  sand: 'text-ink-muted-strong',
  dark: 'text-white/80',
};

/** Section head (mockup `.section-head`): eyebrow, serif title, lead paragraph (max 650 px). */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  as: Heading = 'h2',
  size = Heading === 'h1' ? 'page' : 'section',
  surface = 'light',
  id,
  className = '',
  children,
}: SectionHeadingProps) {
  return (
    <div className={`max-w-[760px] ${className}`}>
      {eyebrow ? (
        <Eyebrow tone={surface === 'dark' ? 'onDark' : 'default'} className="mb-4">
          {eyebrow}
        </Eyebrow>
      ) : null}
      <Heading
        id={id}
        className={`${titleSize[size]} text-balance ${surface === 'dark' ? 'text-ivory' : 'text-charcoal'}`}
      >
        {title}
      </Heading>
      {intro ? (
        <p className={`mt-[18px] max-w-[650px] text-lead text-pretty ${introTone[surface]}`}>
          {intro}
        </p>
      ) : null}
      {children}
    </div>
  );
}
