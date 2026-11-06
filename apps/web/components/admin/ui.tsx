import { Check, CircleAlert, Pause, Pencil, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from 'react';

/**
 * Admin UI primitives on the mockup admin look (docs/design/mockup-design-spec.md §3 "Admin shell"):
 * white 16 px cards with a hairline border, pill buttons, green / gray / gold status pills.
 */

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const VARIANTS: Record<Variant, string> = {
  primary: 'border border-transparent bg-primary text-primary-foreground hover:bg-primary-hover',
  secondary: 'border border-line-strong bg-white text-foreground hover:border-green hover:bg-ivory',
  ghost: 'border border-transparent text-foreground hover:bg-ivory',
  danger: 'border border-danger bg-white text-danger hover:bg-danger hover:text-white',
};

const SIZES: Record<Size, string> = {
  sm: 'min-h-9 px-3.5 text-sm',
  md: 'min-h-11 px-5 text-sm',
};

export function buttonClasses(variant: Variant = 'primary', size: Size = 'md', extra?: string) {
  return cx(
    'inline-flex items-center justify-center gap-2 rounded-pill font-bold whitespace-nowrap',
    'transition-colors duration-(--duration-fast)',
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

/** Mockup `.panel`: white, hairline border, 16 px radius. */
export const panelClasses = 'rounded-2xl border border-line bg-white';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx(panelClasses, 'p-5 tab:p-[22px]', className)}>{children}</div>;
}

/** Card heading row (mockup `.panel-head`). */
export function CardHeader({
  title,
  id,
  description,
  actions,
}: {
  title: string;
  id?: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 id={id} className="font-sans text-base leading-snug font-bold tracking-normal">
          {title}
        </h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Page title (mockup `.admin-heading`): one h1 per page, a muted subline, actions on the right. */
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
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-sans text-[1.55rem] leading-tight font-bold tracking-[-0.02em] tab:text-[1.7rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-3xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

type Tone = 'success' | 'neutral' | 'warning' | 'danger';

const TONES: Record<Tone, string> = {
  success: 'bg-notice-bg text-green',
  neutral: 'bg-neutral-bg text-ink-muted',
  warning: 'bg-warn-bg text-warn-fg',
  danger: 'bg-[#fbeaea] text-danger',
};

/** Mockup `.state` pill, at a readable 12 px; pass an icon so colour is never the only cue. */
export function Badge({
  tone = 'neutral',
  icon: Icon,
  children,
}: {
  tone?: Tone;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs leading-none font-bold whitespace-nowrap',
        TONES[tone],
      )}
    >
      {Icon ? <Icon aria-hidden="true" className="size-3.5" strokeWidth={2} /> : null}
      {children}
    </span>
  );
}

const STATUS_LABELS = {
  PUBLISHED: { label: 'Publicado', tone: 'success', icon: Check },
  DRAFT: { label: 'Borrador', tone: 'neutral', icon: Pencil },
  INACTIVE: { label: 'Inactivo', tone: 'warning', icon: Pause },
} as const;

/** Publication status as text + icon + colour (never colour alone, 18.3). */
export function StatusBadge({ status }: { status: keyof typeof STATUS_LABELS }) {
  const { label, tone, icon } = STATUS_LABELS[status];
  return (
    <Badge tone={tone} icon={icon}>
      {label}
    </Badge>
  );
}

export function BooleanBadge({ value, on, off }: { value: boolean; on: string; off: string }) {
  return (
    <Badge tone={value ? 'success' : 'neutral'} icon={value ? Check : Pause}>
      {value ? on : off}
    </Badge>
  );
}

export function WarningBadge({ children }: { children: ReactNode }) {
  return (
    <Badge tone="warning" icon={CircleAlert}>
      {children}
    </Badge>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-line-strong bg-white p-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

/** Mockup `.notice`: green tint for guidance, amber for warnings. */
export function Notice({
  title,
  tone = 'info',
  children,
}: {
  title?: string;
  tone?: 'info' | 'warning';
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        'rounded-sm px-4 py-3.5 text-sm',
        tone === 'info' ? 'bg-notice-bg text-notice-fg' : 'bg-warn-bg text-warn-fg',
      )}
    >
      {title ? <p className="mb-1 font-bold">{title}</p> : null}
      <div className="leading-normal">{children}</div>
    </div>
  );
}
