'use client';

import { ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from './ui';

/** Keyboard-friendly ordering (alternative to drag and drop, 18.3). */
export function ReorderButtons({
  index,
  count,
  label,
  onMove,
  disabled,
}: {
  index: number;
  count: number;
  label: string;
  onMove: (from: number, to: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Subir ${label}`}
        disabled={disabled || index === 0}
        onClick={() => onMove(index, index - 1)}
      >
        <ArrowUp aria-hidden="true" className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Bajar ${label}`}
        disabled={disabled || index === count - 1}
        onClick={() => onMove(index, index + 1)}
      >
        <ArrowDown aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
}

export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return next;
  next.splice(to, 0, moved);
  return next;
}
