/**
 * Default guest content for the base seed (owner review 2026-11-08): guest policies, frequent
 * questions, the ESCNNA notice and default check-in/out times. They are realistic starting texts
 * that the hotel edits in /admin; the seed writes them only into empty data and never overwrites
 * an edit.
 *
 * IMPORTANT: these texts are general information, not legal advice. The hotel must review them
 * with its legal adviser before relying on them (references checked 2026-11-08: Ley 2068 de 2020,
 * Ley 1098 de 2006, Ley 1336 de 2009, Ley 679 de 2001, Ley 1335 de 2009, Estatuto Tributario
 * art. 481 lit. d). Prices, penalties, banks and services the owner has not confirmed are
 * deliberately left out.
 */

export { DEMO_MARKER } from './demo-data.js';

/** Default local times ("HH:MM", America/Bogota) written into an empty hotel profile. */
export const DEFAULT_STAY_TIMES = { checkInTime: '15:00', checkOutTime: '12:00' } as const;

/** "15:00" → "3:00 p. m.", "12:00" → "12:00 m." (es-CO); anything else is returned as is. */
export function formatStayTime(value: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return value;
  const hours = Number(match[1]);
  const minutes = match[2]!;
  if (hours > 23 || Number(minutes) > 59) return value;
  if (hours === 12 && minutes === '00') return '12:00 m.';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${minutes} ${hours < 12 ? 'a. m.' : 'p. m.'}`;
}

export interface DefaultPolicy {
  title: string;
  content: string;
}

/**
 * Guest policies in display order (the home summary shows the first titles). The check-in policy
 * points to the times shown above it on the guest-info page instead of repeating them, so editing
 * the times in the hotel profile never leaves a contradicting text behind.
 */
export const DEFAULT_POLICIES: readonly DefaultPolicy[] = [
  {
    title: 'Check-in y check-out',
    content: [
      'Te esperamos a partir de la hora de check-in y te pedimos dejar la habitación antes de la hora de check-out que ves en esta página.',
      'Si necesitas llegar antes o salir más tarde, avísanos con anticipación: la entrada anticipada y la salida tardía están sujetas a disponibilidad.',
    ].join('\n\n'),
  },
  {
    title: 'Registro de huéspedes',
    content: [
      'Al llegar, todos los huéspedes, incluidos los menores de edad, presentan su documento de identidad original. Registramos tu estadía en la Tarjeta de Registro de Alojamiento (TRA), como lo exige la Ley 2068 de 2020.',
      'Si eres extranjero, presenta tu pasaporte con el sello o registro de ingreso a Colombia. Reportamos tu llegada y tu salida a Migración Colombia a través del SIRE.',
    ].join('\n\n'),
  },
  {
    title: 'Menores de edad',
    content: [
      'Las niñas, los niños y los adolescentes se alojan con su padre o su madre, quien presenta el registro civil de nacimiento que acredita el parentesco.',
      'Si viajan con otro adulto, este debe presentar una autorización de ambos padres autenticada en notaría, con copia de sus documentos de identidad.',
      'Así protegemos a los menores, como lo establecen la Ley 1098 de 2006 y la Ley 1336 de 2009. Si no se cumplen estos requisitos, el hotel puede negar el alojamiento.',
    ].join('\n\n'),
  },
  {
    title: 'Cancelaciones y cambios',
    content: [
      'Si necesitas cancelar o cambiar las fechas de tu reserva, avísanos con al menos 48 horas de anticipación.',
      'Si tu reserva requiere un anticipo, te confirmamos las condiciones de pago, cambio y devolución al momento de reservar.',
    ].join('\n\n'),
  },
  {
    title: 'Medios de pago',
    content:
      'Puedes pagar en efectivo o por transferencia bancaria. Si prefieres pagar con tarjeta, consulta con nosotros la disponibilidad del datáfono antes de tu llegada.',
  },
  {
    title: 'IVA para extranjeros no residentes',
    content:
      'Si eres extranjero no residente en Colombia, los servicios de alojamiento pueden estar exentos de IVA (Estatuto Tributario, artículo 481, literal d). Para aplicar la exención, presenta tu pasaporte con el sello o registro de ingreso al país al momento del registro.',
  },
  {
    title: 'Mascotas',
    content:
      'Consulta con nosotros antes de tu llegada si deseas viajar con tu mascota. Te confirmamos si podemos recibirla y en qué condiciones.',
  },
  {
    title: 'Hotel libre de humo',
    content:
      'Como lo establece la Ley 1335 de 2009, no está permitido fumar en los espacios cerrados del hotel, incluidas las habitaciones. Te pedimos tampoco usar cigarrillos electrónicos ni vapeadores dentro del hotel.',
  },
];

export interface DefaultFaq {
  question: string;
  answer: string;
  showOnHome: boolean;
}

export interface FaqContext {
  checkInTime: string | null;
  checkOutTime: string | null;
  address: string | null;
  municipality: string | null;
  department: string | null;
}

const filled = (value: string | null): value is string => Boolean(value?.trim());

/**
 * Frequent questions built from the profile at seed time (times and address). Every answer matches
 * a default policy or an amenity the owner confirmed (Wi-Fi in the whole hotel); if the hotel later
 * changes the times or the address, it updates these answers in /admin.
 */
export function buildDefaultFaqs(context: FaqContext): DefaultFaq[] {
  const checkIn = formatStayTime(
    filled(context.checkInTime) ? context.checkInTime : DEFAULT_STAY_TIMES.checkInTime,
  );
  const checkOut = formatStayTime(
    filled(context.checkOutTime) ? context.checkOutTime : DEFAULT_STAY_TIMES.checkOutTime,
  );
  const place = [context.municipality, context.department].filter(filled);
  const where = filled(context.address)
    ? `Estamos en la ${context.address}${place.length > 0 ? `, ${place[0]}${place[1] ? ` (${place[1]})` : ''}` : ''}. `
    : '';

  return [
    {
      question: '¿A qué hora es el check-in y el check-out?',
      answer: `El check-in es desde las ${checkIn} y el check-out hasta las ${checkOut} Si necesitas llegar antes o salir más tarde, escríbenos y te confirmamos según la disponibilidad.`,
      showOnHome: true,
    },
    {
      question: '¿Cómo reservo una habitación?',
      answer:
        'Escríbenos por WhatsApp o llámanos y te confirmamos disponibilidad y tarifa. Tu reserva queda confirmada cuando el hotel te lo indique.',
      showOnHome: true,
    },
    {
      question: '¿Qué documentos necesito para alojarme?',
      answer:
        'Tu documento de identidad original. Si eres extranjero, tu pasaporte con el sello de ingreso a Colombia. Los menores de edad presentan su registro civil de nacimiento.',
      showOnHome: true,
    },
    {
      question: '¿Tienen Wi-Fi?',
      answer: 'Sí, hay conexión Wi-Fi en las habitaciones y en todos los pisos del hotel.',
      showOnHome: true,
    },
    {
      question: '¿Pueden alojarse menores de edad?',
      answer:
        'Sí, con su padre o su madre y su registro civil de nacimiento. Si viajan con otro adulto, se requiere una autorización de ambos padres autenticada en notaría.',
      showOnHome: false,
    },
    {
      question: '¿Aceptan mascotas?',
      answer:
        'Consulta con nosotros antes de tu llegada y te confirmamos si podemos recibir a tu mascota y en qué condiciones.',
      showOnHome: false,
    },
    {
      question: '¿Qué formas de pago aceptan?',
      answer:
        'Efectivo y transferencia bancaria. Si quieres pagar con tarjeta, consulta antes la disponibilidad del datáfono.',
      showOnHome: false,
    },
    {
      question: '¿Cómo llego al hotel?',
      answer: `${where}En la página de ubicación encuentras el mapa y el enlace para abrir la ruta en Google Maps.`,
      showOnHome: false,
    },
  ];
}

/** The footer prints the first sentence; the guest-info page prints the whole notice. */
export const ESCNNA_NOTICE_MAX_LENGTH = 450;

/** ESCNNA prevention notice (Ley 679 de 2001, Ley 1336 de 2009) for an empty profile. */
export function escnnaNoticeFor(hotelName: string): string {
  return [
    `${hotelName} rechaza la explotación sexual comercial de niñas, niños y adolescentes (ESCNNA) y cumple la Ley 679 de 2001 y la Ley 1336 de 2009.`,
    'En Colombia, la explotación y el abuso sexual de menores de edad son delitos castigados con prisión.',
    'Si conoces un caso, denúncialo a la Línea 141 del ICBF o a la Línea 123 de la Policía Nacional.',
  ].join(' ');
}
