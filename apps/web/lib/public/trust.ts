/**
 * Home facts strip (research §3 row 2): verifiable facts right after the room types, each with a
 * short benefit line. The RNT is not repeated here: it stays in the footer (owner review
 * 2026-11-08). Benefit lines for known hotel amenities are written here (not in the admin) and
 * stay hedged: they describe the equipment, never an outcome the hotel has not verified (no
 * "sin cortes", no speeds, no "gratis").
 */

export interface TrustItem {
  id: string;
  iconKey: string;
  title: string;
  text: string | null;
}

interface TrustAmenity {
  id: string;
  name: string;
  iconKey: string | null;
  description: string | null;
}

interface KnownBenefit {
  icons: string[];
  name: RegExp;
  text: string;
}

const KNOWN_BENEFITS: KnownBenefit[] = [
  {
    icons: ['wifi'],
    name: /wi-?fi|internet/i,
    text: 'En las habitaciones y en todos los pisos: para trabajar o hacer trámites desde la habitación.',
  },
  {
    icons: ['sun', 'solar-panel'],
    name: /solar/i,
    text: 'Energía que mira hacia el futuro, con respaldo de energía solar.',
  },
  {
    icons: ['droplets', 'droplet'],
    name: /agua/i,
    text: 'El hotel cuenta con reserva de agua propia.',
  },
];

export function amenityBenefit(amenity: TrustAmenity): string | null {
  const known =
    KNOWN_BENEFITS.find((benefit) => amenity.iconKey && benefit.icons.includes(amenity.iconKey)) ??
    KNOWN_BENEFITS.find((benefit) => benefit.name.test(amenity.name));
  return known?.text ?? (amenity.description?.trim() || null);
}

function joinKinds(kinds: string[]): string | null {
  const words = kinds.map((kind) => kind.toLowerCase());
  if (words.length === 0) return null;
  const text =
    words.length === 1 ? words[0]! : `${words.slice(0, -1).join(', ')} y ${words.at(-1)}`;
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
}

export function trustItems({
  hotel,
  roomCount,
  roomKinds,
  amenities,
}: {
  hotel: {
    address: string | null;
    municipality: string | null;
    department: string | null;
  };
  roomCount: number;
  /** Public labels of the published room kinds ("Individual", "Pareja"). */
  roomKinds: string[];
  amenities: TrustAmenity[];
}): TrustItem[] {
  const items: TrustItem[] = [];
  if (hotel.address) {
    const place = [hotel.municipality, hotel.department].filter(Boolean).join(', ');
    items.push({
      id: 'address',
      iconKey: 'map-pin',
      title: hotel.address,
      // The owner-approved tagline places the hotel "en el corazón de Mocoa".
      text: hotel.municipality ? `En el corazón de ${place}.` : null,
    });
  }
  if (roomCount > 0) {
    items.push({
      id: 'rooms',
      iconKey: 'bed-double',
      title: roomCount === 1 ? '1 habitación' : `${roomCount} habitaciones`,
      text: joinKinds(roomKinds),
    });
  }
  for (const amenity of amenities) {
    items.push({
      id: amenity.id,
      iconKey: amenity.iconKey ?? 'sparkles',
      title: amenity.name,
      text: amenityBenefit(amenity),
    });
  }
  return items;
}
