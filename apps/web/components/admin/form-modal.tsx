'use client';

import { X } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type FormEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type SyntheticEvent,
} from 'react';
import { useConfirm } from './feedback';
import { useUnsavedChangesWarning } from './hooks';
import { Button, cx } from './ui';

export type FormModalSize = 'sm' | 'md' | 'lg';

export interface FormModalProps {
  open: boolean;
  /** Called once the modal may close (after the discard confirmation when `dirty`). */
  onClose: () => void;
  title: string;
  description?: ReactNode;
  size?: FormModalSize;
  /** Unsaved changes: closing asks «¿Descartar cambios?» and leaving the page warns. */
  dirty?: boolean;
  /**
   * When set, the content is a `<form noValidate>` (labelled by the title) wrapping body and footer,
   * so the default footer's submit button submits it (e.g. react-hook-form's `handleSubmit(...)`).
   */
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  /** Default footer: primary submit label. */
  submitLabel?: string;
  /** Default footer: submit spinner; closing is ignored while submitting. */
  submitting?: boolean;
  /** Replaces the default footer (Cancelar + submit). */
  footer?: ReactNode;
  children: ReactNode;
}

const SIZES: Record<FormModalSize, string> = {
  sm: 'tab:w-[min(30rem,calc(100%-2rem))] tab:max-h-[min(32rem,calc(100dvh-6rem))]',
  md: 'tab:w-[min(42rem,calc(100%-2rem))] tab:max-h-[min(38rem,calc(100dvh-6rem))]',
  lg: 'tab:w-[min(56rem,calc(100%-2rem))] tab:max-h-[min(44rem,calc(100dvh-6rem))]',
};

const FIELD_SELECTOR = [
  '[autofocus]',
  '[aria-invalid="true"]',
  'input:not([type="hidden"]):not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
].join(', ');

/**
 * Create/edit modal of the admin lists (owner feedback 2026-11-09: no inline panels). A native
 * `<dialog>` opened with `showModal()` gives the top layer, the inert background, the focus trap and
 * Esc; nested dialogs (media picker, confirmation) stack on top of it. Header, scrollable body and a
 * pinned footer; a full-screen sheet below the `tab` breakpoint. Focus goes to the first field on
 * open and back to the trigger on close; the page does not scroll behind it.
 */
export function FormModal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  dirty = false,
  onSubmit,
  submitLabel = 'Guardar',
  submitting = false,
  footer,
  children,
}: FormModalProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const backdropPress = useRef(false);
  const asking = useRef(false);
  const confirm = useConfirm();
  useUnsavedChangesWarning(open && dirty);

  // Latest values for the event handlers without re-running the open effect.
  const state = useRef({ open, dirty, submitting, onClose });
  useLayoutEffect(() => {
    state.current = { open, dirty, submitting, onClose };
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = 'hidden';
    bodyRef.current?.querySelector<HTMLElement>(FIELD_SELECTOR)?.focus();
    return () => {
      root.style.overflow = overflow;
      if (dialog.open) dialog.close();
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open]);

  const requestClose = useCallback(async () => {
    const current = state.current;
    if (!current.open || current.submitting || asking.current) return;
    if (current.dirty) {
      asking.current = true;
      const discard = await confirm({
        title: '¿Descartar cambios?',
        description: 'Los cambios que no guardó se perderán.',
        confirmLabel: 'Descartar',
        cancelLabel: 'Seguir editando',
        destructive: true,
      });
      asking.current = false;
      if (!discard) return;
    }
    state.current.onClose();
  }, [confirm]);

  const ownEvent = (event: SyntheticEvent) => event.target === event.currentTarget;

  const onCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    // Esc on a nested dialog (media picker) is handled by that dialog.
    if (!ownEvent(event)) return;
    event.preventDefault();
    void requestClose();
  };

  // Browsers may close without a cancelable `cancel` event (repeated Esc without user activation).
  const onNativeClose = (event: SyntheticEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!ownEvent(event) || !dialog || dialog.open || !state.current.open) return;
    if (state.current.dirty || state.current.submitting) dialog.showModal();
    void requestClose();
  };

  // The dialog box has no padding, so only a press on the backdrop targets the dialog itself.
  const onPointerDown = (event: PointerEvent<HTMLDialogElement>) => {
    backdropPress.current = ownEvent(event);
  };
  const onClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (ownEvent(event) && backdropPress.current) void requestClose();
    backdropPress.current = false;
  };

  const content = (
    <>
      <header className="flex items-start gap-3 border-b border-line px-5 py-4 tab:px-6">
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="font-sans text-lg leading-snug font-bold tracking-normal">
            {title}
          </h2>
          {description ? (
            <p id={descriptionId} className="mt-1 text-sm break-words text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Cerrar"
          onClick={() => void requestClose()}
          className="-mt-1.5 -mr-2 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-(--duration-fast) hover:bg-ivory hover:text-foreground"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </header>
      <div
        ref={bodyRef}
        className="admin-modal-body min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5 tab:px-6"
      >
        {children}
      </div>
      <footer className="flex flex-wrap justify-end gap-2 border-t border-line bg-white px-5 pt-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] max-tab:*:flex-1 tab:px-6">
        {footer ?? (
          <>
            <Button variant="secondary" onClick={() => void requestClose()} disabled={submitting}>
              Cancelar
            </Button>
            {onSubmit ? (
              <Button type="submit" loading={submitting}>
                {submitLabel}
              </Button>
            ) : null}
          </>
        )}
      </footer>
    </>
  );

  const frame = 'flex h-full max-h-[inherit] flex-col';

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={onCancel}
      onClose={onNativeClose}
      onPointerDown={onPointerDown}
      onClick={onClick}
      className={cx(
        'admin-modal m-0 h-dvh max-h-none w-full max-w-none bg-white p-0 text-foreground backdrop:bg-charcoal/50',
        'tab:m-auto tab:h-auto tab:rounded-2xl tab:border tab:border-line tab:shadow-lg',
        SIZES[size],
      )}
    >
      {/* Content mounts per opening, so forms start from their default values. */}
      {open ? (
        onSubmit ? (
          <form onSubmit={onSubmit} noValidate aria-labelledby={titleId} className={frame}>
            {content}
          </form>
        ) : (
          <div className={frame}>{content}</div>
        )
      ) : null}
    </dialog>
  );
}
