import type { ButtonHTMLAttributes, ReactNode } from 'react';

/** Static tag (amenity pill, meta). Mockup `.amenity-list li`: line border, .77rem. */
export function Chip({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill border border-line px-[11px] py-2 text-[0.77rem] leading-tight [&_svg]:size-4 ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Filter chip classes (mockup `.chip`): line border, .78rem/700; active = charcoal. Exported so a
 * `<Link href="?tipo=…">` can share the look with `FilterChip` (shareable, indexable filters).
 */
export function chipClass(active: boolean): string {
  return `inline-flex min-h-9 items-center gap-1.5 rounded-pill border px-[13px] py-2 text-chip leading-tight font-bold transition-colors duration-(--duration-fast) [&_svg]:size-4 ${
    active
      ? 'border-charcoal bg-charcoal text-white'
      : 'border-line bg-transparent text-charcoal hover:border-charcoal/40'
  }`;
}

interface FilterChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  active: boolean;
  children: ReactNode;
}

/** Single-select filter button: `aria-pressed` carries the state. */
export function FilterChip({ active, children, className = '', ...props }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`${chipClass(active)} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
