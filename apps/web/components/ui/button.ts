/**
 * Button classes (mockup `styles.css:55-62`): 46 px pill, .88rem/700, 2 px lift on hover. Shared by
 * `<a>`, `<Link>` and `<button>`, so this is a class builder rather than a component.
 */
export type ButtonVariant = 'primary' | 'dark' | 'light' | 'ghost' | 'ghostOnDark' | 'whatsapp';
export type ButtonSize = 'md' | 'compact';

const base =
  'inline-flex items-center justify-center gap-[9px] rounded-pill border border-transparent text-button leading-tight font-bold transition-[translate,background-color,color,border-color] duration-(--duration-fast) ease-(--ease-mockup) hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 disabled:pointer-events-none disabled:opacity-55 aria-disabled:pointer-events-none aria-disabled:opacity-55 [&_svg]:size-[18px] [&_svg]:shrink-0';

const sizes: Record<ButtonSize, string> = {
  md: 'min-h-[46px] px-5 py-2',
  compact: 'min-h-10 px-3 py-1.5',
};

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-green text-white hover:bg-green-900',
  dark: 'bg-charcoal text-white hover:bg-green-900',
  light: 'bg-paper text-charcoal hover:bg-white',
  ghost: 'border-line bg-transparent text-charcoal hover:border-charcoal/40',
  ghostOnDark: 'border-white/40 bg-transparent text-white hover:border-white hover:bg-white/10',
  whatsapp: 'bg-whatsapp text-white hover:bg-green-900',
};

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md'): string {
  return `${base} ${sizes[size]} ${variants[variant]}`;
}

/** 42 px round icon button (menu toggle, carousel). `onPhoto` = glass on images. */
export function iconButtonClass(onPhoto = false): string {
  return `inline-grid size-[42px] shrink-0 place-items-center rounded-full border transition-colors duration-(--duration-fast) [&_svg]:size-[18px] ${
    onPhoto
      ? 'border-white/30 bg-[rgb(18_32_24/0.35)] text-white backdrop-blur-[10px] hover:bg-[rgb(18_32_24/0.55)]'
      : 'border-line bg-paper text-charcoal hover:bg-ivory'
  }`;
}
