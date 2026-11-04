'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Button, cx } from './ui';

// ─── Toasts ──────────────────────────────────────────────────────────────────

type ToastTone = 'success' | 'error';
interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <FeedbackProvider>');
  return context;
}

// ─── Confirmation dialog ────────────────────────────────────────────────────

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;
const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used inside <FeedbackProvider>');
  return context;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

/** Toast region (aria-live) + a native <dialog> confirmation (focus trap and Esc built in). */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const nextId = useRef(1);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const push = useCallback((tone: ToastTone, message: string) => {
    const id = nextId.current++;
    setToasts((current) => [...current.slice(-3), { id, tone, message }]);
    window.setTimeout(
      () => setToasts((current) => current.filter((toast) => toast.id !== id)),
      tone === 'error' ? 8000 : 4000,
    );
  }, []);

  const toastApi = useMemo<ToastApi>(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
    }),
    [push],
  );

  const confirm = useCallback<ConfirmFn>((options) => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    return new Promise<boolean>((resolve) => setPending({ ...options, resolve }));
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (pending && dialog && !dialog.open) dialog.showModal();
  }, [pending]);

  const close = (value: boolean) => {
    pending?.resolve(value);
    dialogRef.current?.close();
    setPending(null);
    returnFocus.current?.focus();
  };

  return (
    <ToastContext.Provider value={toastApi}>
      <ConfirmContext.Provider value={confirm}>
        {children}
        <dialog
          ref={dialogRef}
          aria-labelledby="confirm-title"
          aria-describedby={pending?.description ? 'confirm-description' : undefined}
          onCancel={(event) => {
            event.preventDefault();
            close(false);
          }}
          className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-md border border-border bg-card p-6 shadow-lg backdrop:bg-ink-900/50"
        >
          {pending ? (
            <>
              <h2 id="confirm-title" className="text-xl font-semibold">
                {pending.title}
              </h2>
              {pending.description ? (
                <p id="confirm-description" className="mt-2 text-sm text-muted-foreground">
                  {pending.description}
                </p>
              ) : null}
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="secondary" autoFocus onClick={() => close(false)}>
                  Cancelar
                </Button>
                <Button
                  variant={pending.destructive ? 'danger' : 'primary'}
                  onClick={() => close(true)}
                >
                  {pending.confirmLabel ?? 'Confirmar'}
                </Button>
              </div>
            </>
          ) : null}
        </dialog>
        <div
          aria-live="polite"
          role="status"
          className="pointer-events-none fixed right-4 bottom-4 z-(--z-toast) flex w-[min(24rem,calc(100%-2rem))] flex-col gap-2"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={cx(
                'pointer-events-auto rounded-sm px-4 py-3 text-sm font-semibold shadow-md',
                toast.tone === 'success'
                  ? 'bg-bamboo-900 text-on-surface-dark'
                  : 'bg-destructive text-destructive-foreground',
              )}
            >
              {toast.message}
            </div>
          ))}
        </div>
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}
