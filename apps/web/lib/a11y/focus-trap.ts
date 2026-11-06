const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Keyboard-focusable descendants in DOM order, skipping hidden or inert subtrees. */
export function focusableWithin(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (element) => !element.closest('[hidden], [inert], [aria-hidden="true"]'),
  );
}

/**
 * Keeps Tab and Shift+Tab inside `container`: wraps from the last focusable element to the first
 * and back. Returns true when it moved focus (the caller's event default was prevented).
 */
export function trapTab(
  event: Pick<KeyboardEvent, 'key' | 'shiftKey' | 'preventDefault'>,
  container: HTMLElement,
): boolean {
  if (event.key !== 'Tab') return false;
  const items = focusableWithin(container);
  if (items.length === 0) return false;
  const first = items[0]!;
  const last = items[items.length - 1]!;
  const active = container.ownerDocument.activeElement;
  const inside = active instanceof HTMLElement && container.contains(active);

  if (event.shiftKey && (active === first || !inside)) {
    event.preventDefault();
    last.focus();
    return true;
  }
  if (!event.shiftKey && (active === last || !inside)) {
    event.preventDefault();
    first.focus();
    return true;
  }
  return false;
}
