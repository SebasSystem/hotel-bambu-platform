import Image from 'next/image';
import Link from 'next/link';
import { ui } from '@/lib/i18n/es';
import { mainNav, routes } from '@/lib/public/navigation';
import { HeaderFrame, MobileMenu, NavLink } from './header-client';
import { button } from './styles';
import { WhatsAppLink } from './whatsapp-link';

interface HeaderProps {
  hotelName: string;
  whatsappUrl: string | null;
}

/**
 * Site header (requirement 4.2.1): logo, navigation, WhatsApp button, accessible mobile menu.
 * Transparent over the home hero on small screens, solid with blur after scrolling (motion spec).
 */
export function Header({ hotelName, whatsappUrl }: HeaderProps) {
  return (
    <HeaderFrame>
      <div className="mx-auto flex h-full w-full max-w-(--container-site) items-center justify-between gap-6 px-(--gutter)">
        <Link
          href={routes.home}
          className="relative shrink-0 rounded-sm"
          aria-label={`${hotelName}, inicio`}
        >
          <Image
            src="/brand/logo.svg"
            alt=""
            width={314}
            height={80}
            priority
            unoptimized
            className="logo-default h-10 w-auto sm:h-11"
          />
          <Image
            src="/brand/logo-on-dark.svg"
            alt=""
            width={314}
            height={80}
            unoptimized
            className="logo-on-dark h-10 w-auto sm:h-11"
          />
        </Link>

        <nav aria-label={ui.menu.label} className="hidden lg:block">
          <ul className="flex items-center gap-1 xl:gap-2">
            {mainNav.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {whatsappUrl ? (
            <div className="hidden sm:block">
              <WhatsAppLink href={whatsappUrl} source="header" className={button.whatsapp}>
                {ui.whatsapp.short}
              </WhatsAppLink>
            </div>
          ) : null}
          <MobileMenu whatsappUrl={whatsappUrl} />
        </div>
      </div>
    </HeaderFrame>
  );
}
