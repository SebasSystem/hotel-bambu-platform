import type { ReactNode } from 'react';

/** Bamboo leaf that draws itself when its kicker enters the viewport (CSS stroke-dashoffset). */
function Leaf() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 16"
      className="kicker-leaf h-3 w-8 shrink-0 text-cane-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path pathLength={1} d="M1 8h11M12 8c6-7 17-8 27-6-6 6-16 9-27 6Zm0 0c9-1 17-3 27-6" />
    </svg>
  );
}

/** Small uppercase label above section titles. */
export function Kicker({ children, onDark = false }: { children: ReactNode; onDark?: boolean }) {
  return (
    <p
      data-reveal
      className={`flex items-center gap-3 text-xs font-semibold tracking-kicker uppercase ${
        onDark ? 'text-cane-500' : 'kicker-light text-cane-700'
      }`}
    >
      <Leaf />
      {children}
    </p>
  );
}

interface SectionHeadingProps {
  kicker?: string | null;
  title: string;
  intro?: string | null;
  onDark?: boolean;
  id?: string;
  as?: 'h1' | 'h2';
  className?: string;
}

export function SectionHeading({
  kicker,
  title,
  intro,
  onDark = false,
  id,
  as: Heading = 'h2',
  className = '',
}: SectionHeadingProps) {
  return (
    <div className={`max-w-2xl ${className}`}>
      {kicker ? <Kicker onDark={onDark}>{kicker}</Kicker> : null}
      <Heading
        id={id}
        data-reveal
        className={`${kicker ? 'mt-4' : ''} ${Heading === 'h1' ? 'text-4xl' : 'text-3xl'} font-medium text-balance ${
          onDark ? 'text-sand-50' : 'text-bamboo-900'
        }`}
      >
        {title}
      </Heading>
      {intro ? (
        <p
          data-reveal
          className={`mt-5 text-lg leading-normal text-pretty ${onDark ? 'text-sand-50/80' : 'text-muted-foreground'}`}
        >
          {intro}
        </p>
      ) : null}
    </div>
  );
}

/** Vertical bamboo divider with nodes (art direction motif). */
export function BambooDivider() {
  return (
    <div aria-hidden="true" className="flex justify-center py-2">
      <svg viewBox="0 0 8 64" className="h-16 w-2 text-sand-200" fill="currentColor">
        <rect x="3.25" y="0" width="1.5" height="64" />
        <rect x="1" y="20" width="6" height="2" rx="1" />
        <rect x="1" y="44" width="6" height="2" rx="1" />
      </svg>
    </div>
  );
}
