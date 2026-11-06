import { MessageCircle, Phone } from 'lucide-react';
import Link from 'next/link';
import { BRAND_NAME, BRAND_SUBLINE, BrandLogo } from '@/components/brand/brand-logo';
import { buttonClass, iconButtonClass } from '@/components/ui/button';
import { ui } from '@/lib/i18n/es';
import { mainNav, mobileNav, routes } from '@/lib/public/navigation';
import { NavLink } from './header-client';
import { MobileMenu } from './mobile-menu';
import type { ContactCta } from '@/lib/public/cta';
import { ContactCtaLink } from './contact-cta';

interface HeaderProps {
  /** WhatsApp, else the hotel phone (`contactCta`); null hides the button. */
  cta: ContactCta | null;
}

/**
 * Site header (mockup `.site-header`): sticky, translucent ivory with blur, brand on the left,
 * underlined navigation in the middle, contact CTA on the right ("Consultar estadía" on WhatsApp,
 * or the phone number as a `tel:` link). Below 1000 px the navigation moves into the mobile menu
 * and the CTA becomes a compact icon button.
 */
export function Header({ cta }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="mx-auto flex h-full w-full max-w-(--container-site) items-center justify-between gap-4 px-(--header-gutter)">
        <Link
          href={routes.home}
          className="shrink-0 rounded-xs desk:min-w-[190px]"
          // The name starts with the visible wordmark (WCAG 2.5.3 label in name).
          aria-label={`${BRAND_NAME} ${BRAND_SUBLINE}, ${ui.nav.home.toLowerCase()}`}
        >
          <BrandLogo decorative />
        </Link>

        <nav aria-label={ui.menu.label} className="hidden desk:block">
          <ul className="flex items-center gap-[clamp(1rem,2vw,1.8rem)]">
            {mainNav.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2.5">
          {cta ? (
            <>
              {/* The wrapper hides it on phones: `hidden` on the link itself loses to the button's
                  own `inline-flex` (C2: it overflowed the 412 px viewport by 14 px). */}
              <span className="hidden desk:inline-flex">
                <ContactCtaLink
                  cta={cta}
                  source="header"
                  className={buttonClass('dark')}
                  whatsappLabel={
                    <>
                      {ui.whatsapp.stay}
                      <span className="sr-only"> {ui.whatsapp.viaWhatsApp}</span>
                    </>
                  }
                  phoneLabel={
                    cta.kind === 'phone' ? (
                      <>
                        <span className="sr-only">{ui.phone.call} al </span>
                        {cta.phone}
                      </>
                    ) : null
                  }
                />
              </span>
              <ContactCtaLink
                cta={cta}
                source="header"
                icon={false}
                ariaLabel={
                  cta.kind === 'whatsapp'
                    ? `${ui.whatsapp.floating} ${ui.whatsapp.newTab}`
                    : cta.label
                }
                className={`${iconButtonClass()} desk:hidden`}
                whatsappLabel={<MessageCircle aria-hidden="true" strokeWidth={1.5} />}
                phoneLabel={<Phone aria-hidden="true" strokeWidth={1.5} />}
              />
            </>
          ) : null}
          <MobileMenu links={mobileNav} cta={cta} />
        </div>
      </div>
    </header>
  );
}
