import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  whatsAppPhoneSchema,
  type WhatsAppMessageContext,
} from '@hotel-bambu/shared';

/** Where a WhatsApp link comes from: the general message or one naming a room type. */
export type WhatsAppContext = WhatsAppMessageContext;

export interface WhatsAppSource {
  hotel: { whatsappNumber: string | null; whatsappGreeting: string | null };
}

/**
 * Contextual `wa.me` link via the shared builders (code default messages with the hotel greeting,
 * ADR 0016), or null when the hotel has no valid WhatsApp number configured: callers hide the CTA
 * instead of rendering a broken link.
 */
export function whatsAppLink(site: WhatsAppSource, context: WhatsAppContext): string | null {
  const phone = site.hotel.whatsappNumber;
  if (!phone || !whatsAppPhoneSchema.safeParse(phone).success) return null;
  return buildWhatsAppUrl(phone, buildWhatsAppMessage(context, site.hotel.whatsappGreeting));
}
