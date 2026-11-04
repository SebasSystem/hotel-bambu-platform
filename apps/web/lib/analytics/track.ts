import type { AnalyticsEventInput } from '@hotel-bambu/shared';
import { hasConsent } from '@/lib/consent/consent';

/**
 * Aggregated event counter (requirement 11): sent only with analytics consent (17.5.5).
 * Browser only; failures are ignored (tracking never blocks the visitor).
 */
export function trackEvent(event: AnalyticsEventInput): void {
  if (typeof document === 'undefined' || !hasConsent('analytics', document.cookie)) return;
  const body = JSON.stringify(event);
  try {
    void fetch('/api/v1/public/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true,
      credentials: 'omit',
    }).catch(() => undefined);
  } catch {
    // Ignore: analytics is best effort.
  }
}
