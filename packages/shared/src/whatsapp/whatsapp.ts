import { z } from 'zod';

const WHATSAPP_BASE_URL = 'https://wa.me/';

/**
 * International number, digits only, country code first (E.164 without "+"): 8–15 digits,
 * never starting with 0. This is the stored format (requirement 5.3).
 */
export const whatsAppPhoneSchema = z
  .string()
  .regex(/^[1-9]\d{7,14}$/, 'WhatsApp phone must be 8–15 digits with country code, no symbols');

export type WhatsAppPhone = z.infer<typeof whatsAppPhoneSchema>;

/** Removes common formatting ("+", spaces, dashes, dots, parentheses) and validates the result. */
export function normalizeWhatsAppPhone(input: string): WhatsAppPhone {
  const digits = input.replace(/[\s+\-.()]/g, '');
  const result = whatsAppPhoneSchema.safeParse(digits);
  if (!result.success) {
    throw new Error(`Invalid WhatsApp phone: ${result.error.issues[0]?.message ?? 'unknown'}`);
  }
  return result.data;
}

/**
 * Single shared builder for every WhatsApp entry point (requirement 5.3):
 * `https://wa.me/<number>?text=<encodeURIComponent(message)>`.
 * Render the link with `target="_blank" rel="noopener noreferrer"`.
 */
export function buildWhatsAppUrl(phone: string, message?: string): string {
  const url = `${WHATSAPP_BASE_URL}${normalizeWhatsAppPhone(phone)}`;
  const text = message?.trim();
  return text ? `${url}?text=${encodeURIComponent(text)}` : url;
}
