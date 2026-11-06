import type { PublicHotel } from './types';
import { displayPhone, fullAddress } from './site';

/**
 * Name, address and phone (NAP) exactly as the footer prints them and the Hotel JSON-LD declares
 * them (research §1.7: keep NAP identical everywhere). One source so the two can never drift.
 */
export interface Nap {
  name: string;
  /** "Calle 8 # 7-10, Mocoa, Putumayo" (street, locality, region). */
  addressLine: string | null;
  streetAddress: string | null;
  locality: string | null;
  region: string | null;
  /** The hotel phone, else the WhatsApp number in international form. */
  telephone: string | null;
}

export function napOf(
  hotel: Pick<
    PublicHotel,
    'name' | 'address' | 'municipality' | 'department' | 'phone' | 'whatsappNumber'
  >,
): Nap {
  const phone = hotel.phone?.trim() || null;
  return {
    name: hotel.name,
    addressLine: fullAddress(hotel),
    streetAddress: hotel.address,
    locality: hotel.municipality,
    region: hotel.department,
    telephone: phone ?? (hotel.whatsappNumber ? displayPhone(hotel.whatsappNumber) : null),
  };
}
