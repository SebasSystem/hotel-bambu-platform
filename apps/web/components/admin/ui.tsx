import Link from 'next/link';
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from 'react';

/** Small local UI primitives for the admin panel (shadcn/ui-style classes on brand tokens). */

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
  secondary: 'border border-border bg-card text-foreground hover:bg-muted',
  ghost: 'text-foreground hover:bg-muted',
  danger: 'bg-destructive text-destructive-foreground hover:opacity-90',
};

const SIZES: Record<Size, string> = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4 text-sm',
};

export function buttonClasses(variant: Variant = 'primary', size: Size = 'md', extra?: string) {
  return cx(
    'inline-flex items-center justify-center gap-2 rounded-sm font-semibold transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-60',
    VARIANTS[variant],
    SIZES[size],
    extra,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx('rounded-md border border-border bg-card p-5 shadow-xs', className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold text-bamboo-900">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

type Tone = 'success' | 'neutral' | 'warning' | 'danger';

const TONES: Record<Tone, string> = {
  success: 'bg-accent text-accent-foreground',
  neutral: 'bg-muted text-muted-foreground',
  warning: 'bg-sand-200 text-ink-900',
  danger: 'bg-destructive text-destructive-foreground',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold',
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

const STATUS_LABELS = {
  PUBLISHED: { label: 'Publicado', tone: 'success' },
  DRAFT: { label: 'Borrador', tone: 'neutral' },
  INACTIVE: { label: 'Inactivo', tone: 'warning' },
} as const;

/** Publication status as text + color (never color alone, 18.3). */
export function StatusBadge({ status }: { status: keyof typeof STATUS_LABELS }) {
  const { label, tone } = STATUS_LABELS[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function BooleanBadge({ value, on, off }: { value: boolean; on: string; off: string }) {
  return <Badge tone={value ? 'success' : 'neutral'}>{value ? on : off}</Badge>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
