import Link from 'next/link';
import type { ReactNode } from 'react';
import { BrandLogo } from '@/components/brand/brand-logo';
import { CookieSettingsButton } from '@/components/consent/consent-manager';
import { SOCIAL_PLATFORM_LABELS } from '@/lib/labels';
import { ui } from '@/lib/i18n/es';
import { footerNav, infoNav, legalNav } from '@/lib/public/navigation';
import type { ContactCta } from '@/lib/public/cta';
import { napOf } from '@/lib/public/nap';
import { displayPhone, telHref } from '@/lib/public/site';
import type { PublicSite } from '@/lib/public/types';
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
 * the legal name, RNT and ESCNNA notice only when configured (17.6), legal links and cookies.
 */
export function Footer({ site, cta }: { site: PublicSite; cta: ContactCta | null }) {
  const { hotel } = site;
  const nap = napOf(hotel);
  const whatsappUrl = cta?.kind === 'whatsapp' ? cta.href : null;
  const hasContact = Boolean(whatsappUrl || nap.telephone || hotel.email || nap.addressLine);
  const year = new Date().getFullYear();

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
            {site.socialLinks.length > 0 ? (
              <ul aria-label={ui.footer.social} className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
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
            ) : null}
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
          {hotel.escnnaNotice ? <p className="max-w-3xl">{hotel.escnnaNotice}</p> : null}
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
