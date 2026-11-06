/** Spanish wording for the audit log (`<entity>.<verb>`, apps/api/src/modules/audit). */

/** Grammatical gender and number of each entity label, for the participle agreement. */
type Agreement = 'm' | 'f' | 'mp';

const ENTITIES: Record<string, [label: string, agreement: Agreement]> = {
  amenity: ['Comodidad', 'f'],
  content: ['Sección de la portada', 'f'],
  faq: ['Pregunta frecuente', 'f'],
  gallery: ['Foto de la galería', 'f'],
  heroSlide: ['Diapositiva del carrusel', 'f'],
  hotel: ['Datos del hotel', 'mp'],
  media: ['Foto', 'f'],
  nearbyPlace: ['Lugar cercano', 'm'],
  policy: ['Política', 'f'],
  room: ['Habitación', 'f'],
  roomType: ['Tipo de habitación', 'm'],
  social_link: ['Red social', 'f'],
};

/** Participles agree with the entity ("Habitación: eliminada"); the other changes are fixed. */
const PARTICIPLES: Record<string, string> = {
  create: 'cread',
  update: 'actualizad',
  delete: 'eliminad',
};
const ENDINGS: Record<Agreement, string> = { m: 'o', f: 'a', mp: 'os' };

const VERBS: Record<string, string> = {
  reorder: 'orden cambiado',
  status: 'estado cambiado',
  images: 'fotos actualizadas',
  upload: 'subida',
};

/** Sign-ins, lockouts and migrations are not content changes. */
export function isContentChange(action: string): boolean {
  const [entity] = action.split('.');
  return Boolean(entity && entity in ENTITIES);
}

export function describeAction(action: string): string {
  const [entity = '', verb = ''] = action.split('.');
  const [subject, agreement] = ENTITIES[entity] ?? [entity, 'm'];
  const stem = PARTICIPLES[verb];
  const change = stem ? stem + ENDINGS[agreement] : (VERBS[verb] ?? verb);
  return change ? `${subject}: ${change}` : subject;
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
];

const relative = new Intl.RelativeTimeFormat('es-CO', { numeric: 'auto' });

/** "hace 5 minutos", "ayer"… ; under a minute is "ahora". Older than a week: the date. */
export function timeAgo(iso: string, now = new Date()): string {
  const elapsed = now.getTime() - new Date(iso).getTime();
  if (elapsed < 60_000) return 'ahora';
  if (elapsed >= 7 * 86_400_000) {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeZone: 'America/Bogota',
    }).format(new Date(iso));
  }
  for (const [unit, size] of UNITS) {
    if (elapsed >= size) return relative.format(-Math.floor(elapsed / size), unit);
  }
  return 'ahora';
}

export interface ActivityEntry {
  id: string;
  action: string;
  entityId: string | null;
  createdAt: string;
  adminUser: { email: string; name: string | null } | null;
}

/**
 * Content changes only, newest first, with consecutive repeats of the same change (same action,
 * item and person; e.g. several saves of the hotel form) merged into one row with a count.
 */
export function collapseActivity<T extends ActivityEntry>(entries: T[]): (T & { count: number })[] {
  const rows: (T & { count: number })[] = [];
  for (const entry of entries) {
    if (!isContentChange(entry.action)) continue;
    const last = rows.at(-1);
    if (
      last &&
      last.action === entry.action &&
      last.entityId === entry.entityId &&
      last.adminUser?.email === entry.adminUser?.email
    ) {
      last.count += 1;
    } else {
      rows.push({ ...entry, count: 1 });
    }
  }
  return rows;
}
