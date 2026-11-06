'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { PublicationStatus } from '@hotel-bambu/shared';
import { browserApi } from '@/lib/api/browser';
import { describeApiError } from '@/lib/forms/form-errors';
import { useToast } from './feedback';
import { cx } from './ui';

export interface OptimisticSwitchProps {
  checked: boolean;
  /** Accessible name, e.g. "Publicar Pareja". */
  label: string;
  /** Visible state text next to the track. */
  onText: string;
  offText: string;
  /** Persists the new value; a rejection reverts the switch. */
  request: (next: boolean) => Promise<unknown>;
  successMessage: (next: boolean) => string;
  disabled?: boolean;
  /** Why it is disabled, shown as the native tooltip. */
  title?: string;
}

/**
 * On/off switch that flips immediately, persists in the background and reverts with an error
 * toast when the API refuses. Server data is refreshed after a successful change.
 */
export function OptimisticSwitch({
  checked,
  label,
  onText,
  offText,
  request,
  successMessage,
  disabled,
  title,
}: OptimisticSwitchProps) {
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState(checked);
  const [pending, setPending] = useState(false);

  // Follow fresh server data (router.refresh) when the prop itself changes.
  const [synced, setSynced] = useState(checked);
  if (checked !== synced) {
    setSynced(checked);
    setValue(checked);
  }

  const toggle = async () => {
    const next = !value;
    setValue(next);
    setPending(true);
    try {
      await request(next);
      toast.success(successMessage(next));
      router.refresh();
    } catch (error) {
      setValue(!next);
      toast.error(describeApiError(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      aria-busy={pending || undefined}
      disabled={disabled}
      title={title}
      onClick={() => {
        if (!pending) void toggle();
      }}
      className="group inline-flex min-h-11 items-center gap-2.5 rounded-pill pr-1 text-left disabled:cursor-not-allowed disabled:opacity-55"
    >
      <span
        aria-hidden="true"
        className={cx(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-pill border transition-colors duration-(--duration-fast)',
          value ? 'border-green bg-green' : 'border-input-border bg-neutral-bg',
          pending && 'opacity-70',
        )}
      >
        <span
          className={cx(
            'absolute top-0.5 left-0.5 size-[18px] rounded-full bg-white shadow-xs transition-transform duration-(--duration-fast)',
            value && 'translate-x-5',
          )}
        />
      </span>
      <span
        aria-hidden="true"
        className={cx('text-[0.8125rem] font-bold', value ? 'text-green' : 'text-ink-muted')}
      >
        {value ? onText : offText}
      </span>
    </button>
  );
}

/**
 * Inline publish toggle for room types and rooms: PATCH `{ status }` to `endpoint`. On publishes,
 * off returns to DRAFT (an INACTIVE item shows as off and publishes when switched on).
 */
export function PublishSwitch({
  endpoint,
  name,
  status,
  disabled,
  title,
}: {
  endpoint: string;
  name: string;
  status: PublicationStatus;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <OptimisticSwitch
      checked={status === 'PUBLISHED'}
      label={`Publicar ${name}`}
      onText="Publicado"
      offText={status === 'INACTIVE' ? 'Inactivo' : 'Borrador'}
      disabled={disabled}
      title={title}
      request={(next) => browserApi.patch(endpoint, { status: next ? 'PUBLISHED' : 'DRAFT' })}
      successMessage={(next) => (next ? `«${name}» publicado.` : `«${name}» despublicado.`)}
    />
  );
}
