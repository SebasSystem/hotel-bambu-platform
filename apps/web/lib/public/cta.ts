import { telHref } from './site';
import { whatsAppLink, type WhatsAppContext, type WhatsAppSource } from './whatsapp';

/**
 * The single contact call to action of the site (owner instruction 2026-11-05): WhatsApp when a
 * valid number is set; otherwise a `tel:` link to the hotel phone. Null when neither exists, so the
 * caller hides the button instead of rendering a dead one.
 */
export type ContactCta =
  | { kind: 'whatsapp'; href: string }
  | { kind: 'phone'; href: string; phone: string; label: string };

export interface ContactSource extends WhatsAppSource {
  hotel: WhatsAppSource['hotel'] & { phone: string | null };
}

/** "+57 310 679 8260" / "573106798260" → "310 679 8260"; other formats stay as written. */
export function localPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  const local = digits.length === 12 && digits.startsWith('57') ? digits.slice(2) : digits;
  if (local.length === 10) {
    return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  return value.trim();
}

export function contactCta(site: ContactSource, context: WhatsAppContext): ContactCta | null {
  const whatsapp = whatsAppLink(site, context);
  if (whatsapp) return { kind: 'whatsapp', href: whatsapp };
  const raw = site.hotel.phone?.trim();
  if (!raw || raw.replace(/\D/g, '').length < 7) return null;
  const phone = localPhone(raw);
  return { kind: 'phone', href: telHref(raw), phone, label: `Llamar al ${phone}` };
}
