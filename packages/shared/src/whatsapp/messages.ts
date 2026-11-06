/**
 * Default WhatsApp messages (requirement 5.2, ADR 0016). They are code, not data: the hotel only
 * edits an optional greeting (HotelProfile.whatsappGreeting) that opens every message.
 */

export const DEFAULT_WHATSAPP_GREETING = 'Hola';

/** Message bodies after the greeting, starting in lowercase (the builder adapts the first letter). */
export const WHATSAPP_MESSAGES = {
  GENERAL: () => 'vi su página web y quisiera obtener más información.',
  ROOM_TYPE: (name: string) => `quisiera información sobre disponibilidad y tarifa de la ${name}.`,
} as const;

/** Where a WhatsApp link comes from. */
export type WhatsAppMessageContext = { kind: 'general' } | { kind: 'roomType'; name: string };

const singleLine = (value: string) => value.replace(/\s+/g, ' ').trim();

/**
 * Greeting + body. A bare greeting ("Buen día") is followed by a comma; a greeting that already
 * ends a sentence ("¡Hola, Hotel Bambú Plaza!") starts a new one with a capital letter.
 */
export function buildWhatsAppMessage(
  context: WhatsAppMessageContext,
  greeting?: string | null,
): string {
  const opening = singleLine(greeting ?? '') || DEFAULT_WHATSAPP_GREETING;
  const body =
    context.kind === 'roomType'
      ? WHATSAPP_MESSAGES.ROOM_TYPE(singleLine(context.name))
      : WHATSAPP_MESSAGES.GENERAL();
  if (/[.!?]$/.test(opening)) return `${opening} ${body.charAt(0).toUpperCase()}${body.slice(1)}`;
  return `${opening.replace(/[,;:]$/, '')}, ${body}`;
}
