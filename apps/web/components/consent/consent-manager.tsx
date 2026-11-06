'use client';

import type { AnalyticsSource } from '@hotel-bambu/shared';
import { X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import { button } from '@/components/site/styles';
import { trackEvent } from '@/lib/analytics/track';
import {
  consentCookieString,
  createConsent,
  type ConsentChoices,
  type ConsentState,
} from '@/lib/consent/consent';
import { ui } from '@/lib/i18n/es';
import { routes } from '@/lib/public/navigation';

interface ConsentContextValue {
  /** Current decision (null until the visitor decides). */
  consent: ConsentState | null;
  openPreferences: () => void;
}

const ConsentContext = createContext<ConsentContextValue>({
  consent: null,
  openPreferences: () => undefined,
});

export function useConsent(): ConsentContextValue {
  return useContext(ConsentContext);
}

/** Evidence for 17.5.9: categories, version and a random id. No IP, no profile. Best effort. */
function recordEvidence(state: ConsentState): void {
  try {
    void fetch('/api/v1/public/consents', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      keepalive: true,
      body: JSON.stringify({
        consentId: state.id,
        policyVersion: state.v,
        categories: {
          functional: state.functional,
          analytics: state.analytics,
          marketing: state.marketing,
        },
      }),
    }).catch(() => undefined);
  } catch {
    // Evidence is best effort; the decision itself is stored in the cookie.
  }
}

const SOURCE_BY_PATH: Record<string, AnalyticsSource> = {
  [routes.home]: 'home',
  [routes.rooms]: 'rooms',
  [routes.gallery]: 'gallery',
  [routes.location]: 'location',
  [routes.policies]: 'policies',
};

/** Aggregated PAGE_VIEW / ROOM_VIEW counters (requirement 11), only with analytics consent. */
function PageViews({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  useEffect(() => {
    if (!enabled) return;
    const room = /^\/habitaciones\/([a-z0-9-]+)$/.exec(pathname);
    if (room?.[1]) {
      trackEvent({ type: 'ROOM_VIEW', source: 'room_detail', entityId: room[1] });
      return;
    }
    const source = pathname.startsWith('/legal/') ? 'legal' : (SOURCE_BY_PATH[pathname] ?? 'other');
    trackEvent({ type: 'PAGE_VIEW', source });
  }, [pathname, enabled]);
  return null;
}

const categoryRow = 'flex items-start justify-between gap-6 border-t border-sand-200 py-4 sm:py-5';

/**
 * Cookie consent manager (requirement 17.5): first-visit banner with three equally prominent
 * choices, a preferences dialog by category, the versioned `hb_consent` cookie and evidence via
 * `POST /api/v1/public/consents`. Built in-house: the site has one first-party cookie and one
 * optional third-party embed, so a CMP dependency would add weight and third-party requests.
 */
export function ConsentProvider({
  initial,
  children,
}: {
  initial: ConsentState | null;
  children: ReactNode;
}) {
  const [consent, setConsent] = useState<ConsentState | null>(initial);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<Required<Pick<ConsentChoices, 'functional' | 'analytics'>>>({
    functional: initial?.functional ?? false,
    analytics: initial?.analytics ?? false,
  });

  const save = useCallback(
    (choices: ConsentChoices) => {
      const next = createConsent(choices, consent);
      document.cookie = consentCookieString(next, { secure: location.protocol === 'https:' });
      setConsent(next);
      setDraft({ functional: next.functional, analytics: next.analytics });
      recordEvidence(next);
      dialogRef.current?.close();
    },
    [consent],
  );

  const openPreferences = useCallback(() => {
    setDraft({ functional: consent?.functional ?? false, analytics: consent?.analytics ?? false });
    dialogRef.current?.showModal();
  }, [consent]);

  const value = useMemo(() => ({ consent, openPreferences }), [consent, openPreferences]);
  const acceptAll = () => save({ functional: true, analytics: true });
  const rejectAll = () => save({ functional: false, analytics: false });

  return (
    <ConsentContext.Provider value={value}>
      {children}
      <PageViews enabled={consent?.analytics === true} />

      {/*
        Server-rendered from the request cookie so it paints with the page (rendering it after
        hydration made the banner text the mobile LCP element at ~4 s in Lighthouse).
      */}
      {!consent ? (
        <section aria-labelledby="consent-title" className="consent-banner" data-consent-banner>
          <div className="mx-auto grid max-w-5xl gap-4 rounded-xl border border-sand-200 bg-card p-5 shadow-lg sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8">
            <div>
              <h2
                id="consent-title"
                className="text-base font-semibold text-bamboo-900 [font-family:var(--font-sans)]"
              >
                {ui.consent.bannerTitle}
              </h2>
              <p className="mt-2 text-sm leading-normal text-foreground/90">
                {ui.consent.bannerText} {ui.consent.policyLinks}{' '}
                <Link
                  href={routes.legalCookies}
                  className="font-semibold text-primary underline underline-offset-4"
                >
                  {ui.legal.cookies.toLowerCase()}
                </Link>{' '}
                {ui.consent.and}{' '}
                <Link
                  href={routes.legalData}
                  className="font-semibold text-primary underline underline-offset-4"
                >
                  política de tratamiento de datos
                </Link>
                .
              </p>
            </div>
            {/* Same size, weight and style for every choice (17.5.2: equal hierarchy). */}
            <div className="grid gap-2 sm:grid-cols-3 lg:w-72 lg:grid-cols-1">
              <button type="button" className={button.outline} onClick={acceptAll}>
                {ui.consent.acceptAll}
              </button>
              <button type="button" className={button.outline} onClick={rejectAll}>
                {ui.consent.rejectAll}
              </button>
              <button type="button" className={button.outline} onClick={openPreferences}>
                {ui.consent.configure}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <dialog
        ref={dialogRef}
        aria-labelledby="consent-dialog-title"
        className="consent-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <form
          method="dialog"
          className="p-5 sm:p-8"
          onSubmit={(event) => {
            event.preventDefault();
            save(draft);
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <h2 id="consent-dialog-title" className="text-2xl font-medium text-bamboo-900">
              {ui.consent.dialogTitle}
            </h2>
            <button
              type="button"
              className="-mt-2 -mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-pill text-bamboo-900 hover:bg-sand-100"
              onClick={() => dialogRef.current?.close()}
            >
              <X aria-hidden="true" strokeWidth={1.75} className="size-6" />
              <span className="sr-only">{ui.consent.close}</span>
            </button>
          </div>
          <p className="mt-3 text-sm leading-normal text-muted-foreground">
            {ui.consent.dialogIntro}{' '}
            <Link
              href={routes.legalCookies}
              className="font-semibold text-primary underline underline-offset-4"
            >
              {ui.legal.cookies}
            </Link>
          </p>

          <div className="mt-6">
            <div className={categoryRow}>
              <div>
                <p className="font-semibold text-bamboo-900" id="consent-necessary">
                  {ui.consent.categories.necessary.title}
                </p>
                <p className="mt-1 text-sm leading-normal text-muted-foreground">
                  {ui.consent.categories.necessary.text}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-bamboo-700">
                {ui.consent.alwaysOn}
              </span>
            </div>
            {(['functional', 'analytics'] as const).map((key) => (
              <div key={key} className={categoryRow}>
                <div>
                  <label htmlFor={`consent-${key}`} className="font-semibold text-bamboo-900">
                    {ui.consent.categories[key].title}
                  </label>
                  <p
                    id={`consent-${key}-text`}
                    className="mt-1 text-sm leading-normal text-muted-foreground"
                  >
                    {ui.consent.categories[key].text}
                  </p>
                </div>
                <input
                  id={`consent-${key}`}
                  type="checkbox"
                  role="switch"
                  className="consent-switch"
                  aria-describedby={`consent-${key}-text`}
                  checked={draft[key]}
                  onChange={(event) => setDraft((d) => ({ ...d, [key]: event.target.checked }))}
                />
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            <button type="button" className={button.outline} onClick={rejectAll}>
              {ui.consent.rejectAll}
            </button>
            <button type="button" className={button.outline} onClick={acceptAll}>
              {ui.consent.acceptAll}
            </button>
            <button type="submit" className={button.primary}>
              {ui.consent.save}
            </button>
          </div>
        </form>
      </dialog>
    </ConsentContext.Provider>
  );
}

/** Persistent "Configurar cookies" entry point (17.5.7): reopens the preferences dialog. */
export function CookieSettingsButton({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const { openPreferences } = useConsent();
  return (
    <button type="button" className={className} onClick={openPreferences} aria-haspopup="dialog">
      {children ?? ui.footer.cookies}
    </button>
  );
}
