import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand/brand-logo';
import { buttonClass, iconButtonClass } from '@/components/ui/button';
import { ui } from '@/lib/i18n/es';
import { mainNav, mobileNav, routes } from '@/lib/public/navigation';
import { NavLink } from './header-client';
import { MobileMenu } from './mobile-menu';
import { WhatsAppLink } from './whatsapp-link';

interface HeaderProps {
  hotelName: string;
  whatsappUrl: string | null;
}

/**
 * Site header (mockup `.site-header`): sticky, translucent ivory with blur, brand on the left,
 * underlined navigation in the middle, WhatsApp CTA on the right. Below 1000 px the navigation
 * moves into the mobile menu and the CTA becomes a compact WhatsApp icon button.
 */
export function Header({ hotelName, whatsappUrl }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="mx-auto flex h-full w-full max-w-(--container-site) items-center justify-between gap-4 px-(--header-gutter)">
        <Link
          href={routes.home}
          className="shrink-0 rounded-xs desk:min-w-[190px]"
          aria-label={`${hotelName}, ${ui.nav.home.toLowerCase()}`}
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
          {whatsappUrl ? (
            <>
              <WhatsAppLink
                href={whatsappUrl}
                source="header"
                className={`${buttonClass('dark')} hidden desk:inline-flex`}
              >
                {ui.whatsapp.stay}
                <span className="sr-only"> {ui.whatsapp.viaWhatsApp}</span>
              </WhatsAppLink>
              <WhatsAppLink
                href={whatsappUrl}
                source="header"
                icon={false}
                ariaLabel={`${ui.whatsapp.floating} ${ui.whatsapp.newTab}`}
                className={`${iconButtonClass()} desk:hidden`}
              >
                <MessageCircle aria-hidden="true" strokeWidth={1.5} />
              </WhatsAppLink>
            </>
          ) : null}
          <MobileMenu links={mobileNav} whatsappUrl={whatsappUrl} />
        </div>
      </div>
    </header>
  );
}
