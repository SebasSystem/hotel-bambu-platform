import Image from 'next/image';
import Link from 'next/link';
import { CookieSettingsButton } from '@/components/consent/consent-manager';
import { SOCIAL_PLATFORM_LABELS } from '@/lib/labels';
import { ui } from '@/lib/i18n/es';
import { footerNav, legalNav } from '@/lib/public/navigation';
import { displayPhone, fullAddress, telHref } from '@/lib/public/site';
import type { PublicSite } from '@/lib/public/types';
import { container } from './styles';
import { WhatsAppLink } from './whatsapp-link';

const footerLink =
  'rounded-xs text-sand-50/90 underline-offset-4 transition-colors duration-(--duration-fast) hover:text-white hover:underline';

/**
 * Footer (requirement 4.2.10): hotel data, navigation, social links, RNT and ESCNNA notice only
 * when configured (17.6), legal links, cookie settings, informative-rates disclaimer.
 */
export function Footer({ site, whatsappUrl }: { site: PublicSite; whatsappUrl: string | null }) {
  const { hotel } = site;
  const address = fullAddress(hotel);
  const hasContact = Boolean(whatsappUrl || hotel.phone || hotel.email || address);
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface-dark pb-28 text-on-surface-dark sm:pb-16">
      <div className={`${container} grid gap-12 pt-16 md:grid-cols-2 lg:grid-cols-12`}>
        <div className="lg:col-span-4">
          <Image
            src="/brand/logo-on-dark.svg"
            alt={hotel.name}
            width={314}
            height={80}
            unoptimized
            className="h-12 w-auto"
          />
          {hotel.shortDescription ? (
            <p className="mt-6 max-w-sm text-sm leading-normal text-sand-50/80">
              {hotel.shortDescription}
            </p>
          ) : null}
        </div>

        <nav aria-label={ui.footer.explore} className="lg:col-span-3">
          <h2 className="text-sm font-semibold tracking-kicker text-cane-500 uppercase [font-family:var(--font-sans)]">
            {ui.footer.explore}
          </h2>
          <ul className="mt-4 grid gap-2 text-sm">
            {footerNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={footerLink}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {hasContact ? (
          <div className="lg:col-span-3">
            <h2 className="text-sm font-semibold tracking-kicker text-cane-500 uppercase [font-family:var(--font-sans)]">
              {ui.footer.contact}
            </h2>
            <ul className="mt-4 grid gap-2 text-sm">
              {whatsappUrl && hotel.whatsappNumber ? (
                <li>
                  <WhatsAppLink
                    href={whatsappUrl}
                    source="footer"
                    icon={false}
                    className={footerLink}
                  >
                    WhatsApp {displayPhone(hotel.whatsappNumber)}
                  </WhatsAppLink>
                </li>
              ) : null}
              {hotel.phone ? (
                <li>
                  <a href={telHref(hotel.phone)} className={footerLink}>
                    {ui.contact.phone} {hotel.phone}
                  </a>
                </li>
              ) : null}
              {hotel.email ? (
                <li>
                  <a href={`mailto:${hotel.email}`} className={footerLink}>
                    {hotel.email}
                  </a>
                </li>
              ) : null}
              {address ? <li className="text-sand-50/80">{address}</li> : null}
            </ul>
          </div>
        ) : null}

        {site.socialLinks.length > 0 ? (
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold tracking-kicker text-cane-500 uppercase [font-family:var(--font-sans)]">
              {ui.footer.social}
            </h2>
            <ul className="mt-4 grid gap-2 text-sm">
              {site.socialLinks.map((social) => (
                <li key={social.id}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={footerLink}
                  >
                    {SOCIAL_PLATFORM_LABELS[
                      social.platform as keyof typeof SOCIAL_PLATFORM_LABELS
                    ] ?? social.platform}
                    <span className="sr-only"> {ui.whatsapp.newTab}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div
        className={`${container} mt-12 grid gap-4 border-t border-sand-50/15 pt-8 text-xs leading-normal text-sand-50/75`}
      >
        <p>{ui.pricesDisclaimer}</p>
        {hotel.rntNumber ? (
          <p>
            {ui.footer.rnt}: <span className="font-semibold text-sand-50">{hotel.rntNumber}</span>
          </p>
        ) : null}
        {hotel.escnnaNotice ? <p className="max-w-3xl">{hotel.escnnaNotice}</p> : null}
        <div className="flex flex-col gap-4 pt-2 md:flex-row md:items-center md:justify-between">
          <p>{ui.footer.rights(year, hotel.legalName ?? hotel.name)}</p>
          <nav aria-label={ui.footer.legal}>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {legalNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={footerLink}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <CookieSettingsButton className={`${footerLink} cursor-pointer`} />
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
