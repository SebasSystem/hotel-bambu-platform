'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { describeApiError } from '@/lib/forms/form-errors';
import { useToast } from './feedback';

/**
 * Runs a mutation with feedback: busy flag, success/error toast and `router.refresh()` so the
 * Server Components re-fetch from the API. Returns the result, or undefined on failure.
 */
export function useAction() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const run = useCallback(
    async <T>(key: string, action: () => Promise<T>, successMessage?: string) => {
      setBusy(key);
      try {
        const result = await action();
        if (successMessage) toast.success(successMessage);
        router.refresh();
        return result;
      } catch (error) {
        toast.error(describeApiError(error));
        return undefined;
      } finally {
        setBusy(null);
      }
    },
    [router, toast],
  );

  return { run, busy };
}

/** Warns before leaving the page with unsaved changes (18.2). */
export function useUnsavedChangesWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
}
