import { buildWhatsAppUrl, whatsAppPhoneSchema } from '@hotel-bambu/shared';

/** Where a WhatsApp link comes from: picks the template and its variable (requirement 5.2). */
export type WhatsAppContext =
  { kind: 'general' } | { kind: 'room'; name: string } | { kind: 'promotion'; name: string };

interface TemplateLike {
  key: string;
  body: string;
}

export interface WhatsAppSource {
  hotel: { whatsappNumber: string | null };
  whatsappTemplates: readonly TemplateLike[];
}

/** Replaces `{{variable}}` placeholders; unknown variables are removed (never shown as braces). */
export function renderWhatsAppTemplate(body: string, variables: Record<string, string>): string {
  return body
    .replace(/\{\{\s*([a-zA-Z_]+)\s*\}\}/g, (_match, name: string) => variables[name] ?? '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function messageFor(templates: readonly TemplateLike[], context: WhatsAppContext): string {
  const byKey = (key: string) => templates.find((template) => template.key === key)?.body;
  const general = byKey('GENERAL') ?? '';
  switch (context.kind) {
    case 'room': {
      const body = byKey('ROOM');
      return body ? renderWhatsAppTemplate(body, { habitacion: context.name }) : general;
    }
    case 'promotion': {
      const body = byKey('PROMOTION');
      return body ? renderWhatsAppTemplate(body, { promocion: context.name }) : general;
    }
    default:
      return general;
  }
}

/**
 * Contextual `wa.me` link via the shared builder, or null when the hotel has no valid WhatsApp
 * number configured: callers hide the CTA instead of rendering a broken link.
 */
export function whatsAppLink(site: WhatsAppSource, context: WhatsAppContext): string | null {
  const phone = site.hotel.whatsappNumber;
  if (!phone || !whatsAppPhoneSchema.safeParse(phone).success) return null;
  return buildWhatsAppUrl(phone, messageFor(site.whatsappTemplates, context));
}
