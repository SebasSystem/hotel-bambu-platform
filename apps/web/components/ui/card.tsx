import type { ElementType, ReactNode } from 'react';

/**
 * Card shells (mockup radii and borders): `room` 24 px with clipped media, `feature` 32 px,
 * `tile` 18 px (amenity card), `panel` for contact and map cards. Content and layout stay with
 * the caller; `interactive` adds the mockup hover (5 px lift + soft shadow).
 */
export type CardVariant = 'room' | 'feature' | 'tile' | 'panel';

const variants: Record<CardVariant, string> = {
  room: 'overflow-hidden rounded-lg border border-line bg-paper',
  feature: 'overflow-hidden rounded-xl bg-paper',
  tile: 'rounded-md border border-line bg-paper p-[18px] tab:p-6',
  panel: 'rounded-lg border border-line bg-paper p-[clamp(28px,4vw,48px)]',
};

export function cardClass(variant: CardVariant = 'panel', interactive = false): string {
  return `${variants[variant]} ${
    interactive
      ? 'transition-[translate,box-shadow] duration-(--duration-base) ease-(--ease-mockup) hover:-translate-y-[5px] hover:shadow-md motion-reduce:hover:translate-y-0'
      : ''
  }`;
}

export function Card({
  as: Tag = 'div',
  variant = 'panel',
  interactive = false,
  className = '',
  children,
}: {
  as?: ElementType;
  variant?: CardVariant;
  interactive?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return <Tag className={`${cardClass(variant, interactive)} ${className}`}>{children}</Tag>;
}
