import { formatCop } from './format';

/**
 * "Desde $X COP/noche" price signal of the hero and the meta descriptions (research §3, §7).
 * Derived from the published room types only: no rate, no signal. Nightly rates win over per-person
 * rates because they are the comparable figure; an `OTHER` unit is explained only by the hotel's
 * notes, so it never feeds a "desde" claim.
 */

export interface RateInput {
  basePrice: number | null;
  priceUnit: string;
  currency: string;
}

export interface FromRate {
  amount: number;
  currency: string;
  unit: 'PER_NIGHT' | 'PER_PERSON_PER_NIGHT';
  /** "Desde $ 120.000 COP/noche". */
  label: string;
  /** "$ 120.000 COP/noche", for running text after "desde". */
  value: string;
}

const UNIT_TEXT = { PER_NIGHT: '/noche', PER_PERSON_PER_NIGHT: ' por persona/noche' } as const;

export function fromRate(types: RateInput[]): FromRate | null {
  for (const unit of ['PER_NIGHT', 'PER_PERSON_PER_NIGHT'] as const) {
    const priced = types.filter(
      (type): type is RateInput & { basePrice: number } =>
        type.basePrice !== null && type.priceUnit === unit,
    );
    if (priced.length === 0) continue;
    const lowest = priced.reduce((min, type) => (type.basePrice < min.basePrice ? type : min));
    // Plain spaces (Intl uses a no-break space after "$"): the text also feeds meta descriptions.
    const amount = formatCop(lowest.basePrice).replace(/\s/g, ' ');
    const value = `${amount} ${lowest.currency}${UNIT_TEXT[unit]}`;
    return {
      amount: lowest.basePrice,
      currency: lowest.currency,
      unit,
      value,
      label: `Desde ${value}`,
    };
  }
  return null;
}

/** Room amenities every published type has (safe to claim for "all rooms"). */
export function sharedRoomAmenities(types: { amenities: { name: string }[] }[]): string[] {
  const [first, ...rest] = types;
  if (!first) return [];
  return first.amenities
    .map((amenity) => amenity.name)
    .filter((name) => rest.every((type) => type.amenities.some((a) => a.name === name)));
}
