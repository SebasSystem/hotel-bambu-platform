import { MessageCircle, Phone } from 'lucide-react';
import Link from 'next/link';
import { BRAND_NAME, BRAND_SUBLINE, BrandLogo } from '@/components/brand/brand-logo';
import { buttonClass, iconButtonClass } from '@/components/ui/button';
import { ui } from '@/lib/i18n/es';
import { mainNav, mobileNav, routes } from '@/lib/public/navigation';
import { NavLink } from './header-client';
import { MobileMenu } from './mobile-menu';
import type { ContactCta, PhoneContact } from '@/lib/public/cta';
import { ContactCtaLink } from './contact-cta';
import { WhatsAppLink } from './whatsapp-link';

interface HeaderProps {
  /** WhatsApp, else the hotel phone (`contactCta`); null hides the button. */
  cta: ContactCta | null;
  /** The hotel phone (`phoneContact`), shown next to WhatsApp; null when not set. */
  phone: PhoneContact | null;
}

/** Visible phone number with the verb for screen readers ("Llamar al 310 679 8260"). */
function PhoneLabel({ phone }: { phone: PhoneContact }) {
  return (
    <>
      <span className="sr-only">{ui.phone.callTo} </span>
      {phone.phone}
    </>
  );
}

/**
 * Site header (mockup `.site-header`): sticky, translucent ivory with blur, brand on the left,
 * underlined navigation in the middle, contact CTAs on the right. Everything comes from the hotel
 * profile (owner review 2026-11-08):
 * - WhatsApp set: "Escribir por WhatsApp" button plus the phone as a `tel:` link next to it
 *   (icon only between 1000 and 1280 px, where the number would not fit).
 * - Only a phone: the phone button.
 * Below 1000 px the navigation moves into the mobile menu and the header keeps a call icon; phones
 * reach WhatsApp through the floating button (a WhatsApp icon only when there is no phone).
 */
export function Header({ cta, phone }: HeaderProps) {
  const whatsappUrl = cta?.kind === 'whatsapp' ? cta.href : null;
  const mobileCta: ContactCta | null = phone ?? cta;

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
          {/* The wrappers hide desktop CTAs on phones: `hidden` on the link itself loses to the
              button's own `inline-flex` (C2: it overflowed the 412 px viewport by 14 px). */}
          {whatsappUrl ? (
            <span className="hidden items-center gap-2.5 desk:inline-flex">
              <WhatsAppLink
                href={whatsappUrl}
                source="header"
                className={buttonClass('primary')}
                ariaLabel={`${ui.whatsapp.floating} ${ui.whatsapp.newTab}`}
              >
                {ui.whatsapp.floating}
              </WhatsAppLink>
              {phone ? (
                // One link: a round icon between 1000 and 1280 px, icon + number from 1280 px.
                <a
                  href={phone.href}
                  aria-label={phone.label}
                  className="inline-flex min-h-[42px] min-w-[42px] items-center justify-center gap-2 rounded-full border border-line bg-paper text-[0.88rem] font-bold whitespace-nowrap text-charcoal transition-colors duration-(--duration-fast) hover:bg-ivory wide:rounded-xs wide:border-transparent wide:bg-transparent wide:px-1 wide:hover:bg-transparent wide:hover:text-green [&_svg]:size-[18px]"
                >
                  <Phone aria-hidden="true" strokeWidth={1.75} />
                  <span className="hidden wide:inline">{phone.phone}</span>
                </a>
              ) : null}
            </span>
          ) : phone ? (
            <span className="hidden desk:inline-flex">
              <a href={phone.href} className={buttonClass('dark')}>
                <Phone aria-hidden="true" strokeWidth={1.75} />
                <PhoneLabel phone={phone} />
              </a>
            </span>
          ) : null}
          {mobileCta ? (
            <ContactCtaLink
              cta={mobileCta}
              source="header"
              icon={false}
              ariaLabel={
                mobileCta.kind === 'whatsapp'
                  ? `${ui.whatsapp.floating} ${ui.whatsapp.newTab}`
                  : mobileCta.label
              }
              className={`${iconButtonClass()} desk:hidden`}
              whatsappLabel={<MessageCircle aria-hidden="true" strokeWidth={1.5} />}
              phoneLabel={<Phone aria-hidden="true" strokeWidth={1.5} />}
            />
          ) : null}
          <MobileMenu links={mobileNav} cta={cta} />
        </div>
      </div>
    </header>
  );
}
