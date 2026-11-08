import Link from 'next/link';
import type { ReactNode } from 'react';
import { BrandLogo } from '@/components/brand/brand-logo';
import { CookieSettingsButton } from '@/components/consent/consent-manager';
import { ui } from '@/lib/i18n/es';
import { escnnaFooterText } from '@/lib/public/escnna';
import { footerNav, infoNav, legalNav, routes } from '@/lib/public/navigation';
import type { ContactCta } from '@/lib/public/cta';
import { napOf } from '@/lib/public/nap';
import { displayPhone, telHref } from '@/lib/public/site';
import type { PublicSite } from '@/lib/public/types';
import { SocialLinks } from './social-links';
import { container } from './styles';
import { WhatsAppLink } from './whatsapp-link';

const footerLink =
  'rounded-xs underline-offset-4 transition-colors duration-(--duration-fast) hover:text-white hover:underline';

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 font-sans text-[0.74rem] leading-normal font-bold tracking-label text-ivory uppercase">
        {title}
      </h2>
      <ul className="grid gap-2">{children}</ul>
    </div>
  );
}

/**
 * Footer (mockup `.footer`, requirement 4.2.10): charcoal, brand + blurb and three columns
 * (Explorar, Información, Contacto) from the site data. The contact column prints the full NAP
 * from `napOf`, the same source as the Hotel JSON-LD, so both always match. The bottom row carries
 * the legal name, RNT and ESCNNA notice only when configured (17.6), legal links and cookies. The
 * ESCNNA notice is shortened to its first sentence with a link to the full text on the guest-info
 * page (owner review 2026-11-08).
 */
export function Footer({ site, cta }: { site: PublicSite; cta: ContactCta | null }) {
  const { hotel } = site;
  const nap = napOf(hotel);
  const whatsappUrl = cta?.kind === 'whatsapp' ? cta.href : null;
  const hasContact = Boolean(whatsappUrl || nap.telephone || hotel.email || nap.addressLine);
  const year = new Date().getFullYear();
  const escnna = hotel.escnnaNotice ? escnnaFooterText(hotel.escnnaNotice) : null;

  return (
    <footer
      data-surface="dark"
      className="bg-charcoal pt-14 pb-28 text-[0.83rem] text-white/65 tab:pb-24"
    >
      <div className={container}>
        <div className="grid gap-10 pb-14 xs:grid-cols-2 desk:grid-cols-[1.4fr_repeat(3,0.7fr)]">
          <div className="xs:col-span-2 desk:col-span-1">
            <BrandLogo tone="dark" label={hotel.name} />
            {hotel.shortDescription ? (
              <p className="mt-5 max-w-[320px] leading-body">{hotel.shortDescription}</p>
            ) : null}
            <SocialLinks links={site.socialLinks} hotelName={hotel.name} />
          </div>

          <nav aria-label={ui.footer.explore}>
            <Column title={ui.footer.explore}>
              {footerNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={footerLink}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </Column>
          </nav>

          <nav aria-label={ui.footer.info}>
            <Column title={ui.footer.info}>
              {infoNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={footerLink}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </Column>
          </nav>

          {hasContact ? (
            <div>
              <h2 className="mb-4 font-sans text-[0.74rem] leading-normal font-bold tracking-label text-ivory uppercase">
                {ui.footer.contact}
              </h2>
              <address data-testid="footer-nap" className="grid gap-2 not-italic">
                <strong className="font-bold text-ivory">{nap.name}</strong>
                {nap.addressLine ? <span>{nap.addressLine}</span> : null}
                {nap.telephone ? (
                  <a href={telHref(nap.telephone)} className={`${footerLink} justify-self-start`}>
                    {ui.contact.phone} {nap.telephone}
                  </a>
                ) : null}
                {whatsappUrl && hotel.whatsappNumber ? (
                  <WhatsAppLink
                    href={whatsappUrl}
                    source="footer"
                    icon={false}
                    className={`${footerLink} justify-self-start`}
                  >
                    WhatsApp {displayPhone(hotel.whatsappNumber)}
                  </WhatsAppLink>
                ) : null}
                {hotel.email ? (
                  <a
                    href={`mailto:${hotel.email}`}
                    className={`${footerLink} justify-self-start break-all`}
                  >
                    {hotel.email}
                  </a>
                ) : null}
              </address>
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 border-t border-white/12 pt-5 text-[0.72rem] leading-body text-white/62">
          <p>{ui.pricesDisclaimer}</p>
          {hotel.rntNumber ? (
            <p>
              {ui.footer.rnt}: <span className="font-bold text-ivory">{hotel.rntNumber}</span>
            </p>
          ) : null}
          {escnna ? (
            <p className="max-w-3xl">
              {escnna.text}
              {escnna.shortened ? (
                <>
                  {' '}
                  <Link
                    href={`${routes.policies}#aviso-escnna`}
                    className={`${footerLink} underline`}
                  >
                    {ui.footer.escnnaMore}
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}
          <div className="flex flex-col gap-3 pt-1 tab:flex-row tab:items-center tab:justify-between">
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
      </div>
    </footer>
  );
}
