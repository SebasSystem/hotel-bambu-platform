import type { PublicService } from './types';

/** One row of the home fact stack (mockup `.fact`): a number or an icon, a label and a note. */
export interface HomeFact {
  id: string;
  /** Big serif value; null when the fact is a service (shown with its icon instead). */
  value: string | null;
  iconKey: string | null;
  label: string;
  note: string | null;
}

const MAX_FACTS = 3;

/**
 * Home fact stack (owner decision Q3): derived from real data only, the published room count
 * first and then the highlighted services. The mockup's "100%" and "24/7" were invented figures.
 */
export function homeFacts(
  roomCount: number,
  services: Pick<PublicService, 'id' | 'name' | 'description' | 'iconKey'>[],
): HomeFact[] {
  const facts: HomeFact[] = [];
  if (roomCount > 0) {
    facts.push({
      id: 'rooms',
      value: String(roomCount),
      iconKey: null,
      label: roomCount === 1 ? 'habitación publicada' : 'habitaciones publicadas',
      note: null,
    });
  }
  for (const service of services) {
    facts.push({
      id: service.id,
      value: null,
      iconKey: service.iconKey,
      label: service.name,
      note: service.description,
    });
  }
  return facts.slice(0, MAX_FACTS);
}
