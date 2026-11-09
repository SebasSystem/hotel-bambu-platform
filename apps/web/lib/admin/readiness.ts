import { whatsAppPhoneSchema } from '@hotel-bambu/shared';
import type { Faq, HotelProfile, NearbyPlace, Policy, RoomType, SocialLink } from '@/lib/api/types';

/**
 * Content readiness for the admin dashboard (owner decision Q4: no bookings, occupancy or revenue).
 * Pure functions over data the admin endpoints already return, so the checks stay testable and the
 * API needs no extra endpoint.
 */

/**
 * Hero photos: landscape and at least as wide as the largest hero variant (1920 px), so a
 * full-bleed hero stays sharp on large and high-density screens (ADR 0015; raised from 1600 px in
 * the owner review 2026-11-08).
 */
export const HERO_MIN_SLIDES = 3;
export const HERO_MIN_WIDTH = 1920;

export interface PhotoSize {
  width: number | null;
  height: number | null;
}

export type HeroPhotoIssue = 'portrait' | 'small' | 'unknown';

export function heroPhotoIssues({ width, height }: PhotoSize): HeroPhotoIssue[] {
  if (!width || !height) return ['unknown'];
  const issues: HeroPhotoIssue[] = [];
  if (height >= width) issues.push('portrait');
  if (width < HERO_MIN_WIDTH) issues.push('small');
  return issues;
}

const isLandscape = ({ width, height }: PhotoSize) => Boolean(width && height && width > height);

export interface ReadinessData {
  hotel: Pick<
    HotelProfile,
    | 'tagline'
    | 'description'
    | 'address'
    | 'municipality'
    | 'department'
    | 'latitude'
    | 'longitude'
    | 'phone'
    | 'whatsappNumber'
    | 'email'
    | 'checkInTime'
    | 'checkOutTime'
  >;
  roomTypes: Pick<RoomType, 'status' | 'basePrice'>[];
  heroSlides: { active: boolean; mediaAsset: PhotoSize }[];
  nearbyPlaces: Pick<NearbyPlace, 'active'>[];
  policies: Pick<Policy, 'published' | 'title' | 'content'>[];
  faqs: Pick<Faq, 'published' | 'question' | 'answer'>[];
  socialLinks: Pick<SocialLink, 'active' | 'url'>[];
  /** All media assets and how many have no alt text (dashboard summary). */
  media: { total: number; missingAlt: number };
}

/** Hotel facts used when the role cannot read the hotel profile (those items are then hidden). */
export const EMPTY_READINESS_HOTEL: ReadinessData['hotel'] = {
  tagline: null,
  description: null,
  address: null,
  municipality: null,
  department: null,
  latitude: null,
  longitude: null,
  phone: null,
  whatsappNumber: null,
  email: null,
  checkInTime: null,
  checkOutTime: null,
};

export type ChecklistId =
  | 'whatsapp'
  | 'rates'
  | 'hero'
  | 'schedule'
  | 'nearby'
  | 'policies'
  | 'social'
  | 'about'
  | 'coordinates';

export interface ChecklistItem {
  id: ChecklistId;
  title: string;
  /** What is missing, or what is already in place. */
  note: string;
  done: boolean;
  /** Admin section that fixes it. */
  href: string;
}

const filled = (value: string | null | undefined) => Boolean(value?.trim());

export function hasValidWhatsApp(number: string | null | undefined): boolean {
  return filled(number) && whatsAppPhoneSchema.safeParse(number).success;
}

/** A social link without a profile path (e.g. `https://instagram.com`) is a placeholder. */
export function isPlaceholderSocialUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/\/+$/, '') === '' && parsed.search === '';
  } catch {
    return true;
  }
}

const DEMO = /\[demo\]/i;

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

export function publishChecklist(data: ReadinessData): ChecklistItem[] {
  const { hotel } = data;

  const published = data.roomTypes.filter((type) => type.status === 'PUBLISHED');
  const withoutRate = published.filter((type) => type.basePrice === null).length;

  const landscape = data.heroSlides.filter(
    (slide) => slide.active && isLandscape(slide.mediaAsset),
  ).length;

  const publishedPolicies = data.policies.filter((policy) => policy.published);
  const demoTexts =
    publishedPolicies.filter((policy) => DEMO.test(policy.title) || DEMO.test(policy.content))
      .length +
    data.faqs.filter((faq) => faq.published && (DEMO.test(faq.question) || DEMO.test(faq.answer)))
      .length;

  const social = data.socialLinks.filter((link) => link.active);
  const placeholders = social.filter((link) => isPlaceholderSocialUrl(link.url)).length;

  const activeNearby = data.nearbyPlaces.filter((place) => place.active).length;
  const whatsapp = hasValidWhatsApp(hotel.whatsappNumber);

  return [
    {
      id: 'whatsapp',
      title: 'Configurar WhatsApp',
      note: whatsapp ? 'Los botones abren WhatsApp' : 'Sin número, los botones llaman al teléfono',
      done: whatsapp,
      href: '/admin/hotel#whatsapp',
    },
    {
      id: 'rates',
      title: 'Cargar tarifas',
      note:
        published.length === 0
          ? 'No hay tipos de habitación publicados'
          : withoutRate > 0
            ? `${withoutRate} de ${published.length} tipos publicados sin tarifa`
            : 'Todos los tipos publicados tienen tarifa',
      done: published.length > 0 && withoutRate === 0,
      href: '/admin/room-types',
    },
    {
      id: 'hero',
      title: 'Fotos horizontales para la portada',
      note: `${Math.min(landscape, HERO_MIN_SLIDES)} de ${HERO_MIN_SLIDES} fotos horizontales visibles`,
      done: landscape >= HERO_MIN_SLIDES,
      href: '/admin/hero-slides',
    },
    {
      id: 'schedule',
      title: 'Horarios de check-in y check-out',
      note:
        filled(hotel.checkInTime) && filled(hotel.checkOutTime)
          ? `Entrada ${hotel.checkInTime?.trim()} · salida ${hotel.checkOutTime?.trim()}`
          : 'Se muestran en la portada y en las políticas',
      done: filled(hotel.checkInTime) && filled(hotel.checkOutTime),
      href: '/admin/hotel#horarios',
    },
    {
      id: 'nearby',
      title: 'Lugares cercanos',
      note:
        activeNearby > 0
          ? `${activeNearby} ${plural(activeNearby, 'lugar visible', 'lugares visibles')}`
          : 'Distancias a terminal, centro y sitios de interés',
      done: activeNearby > 0,
      href: '/admin/nearby-places',
    },
    {
      id: 'policies',
      title: 'Información para huéspedes sin textos de ejemplo',
      note:
        publishedPolicies.length === 0
          ? 'No hay políticas publicadas'
          : demoTexts > 0
            ? `${demoTexts} ${plural(demoTexts, 'texto', 'textos')} de ejemplo [DEMO]`
            : 'Sin textos de ejemplo',
      done: publishedPolicies.length > 0 && demoTexts === 0,
      href: '/admin/policies',
    },
    {
      id: 'social',
      title: 'Redes sociales del hotel',
      note:
        social.length === 0
          ? 'Ninguna red activa'
          : placeholders > 0
            ? `${placeholders} ${plural(placeholders, 'enlace', 'enlaces')} sin perfil del hotel`
            : `${social.length} ${plural(social.length, 'red activa', 'redes activas')}`,
      done: social.length > 0 && placeholders === 0,
      href: '/admin/social',
    },
    {
      id: 'about',
      title: 'Texto «Sobre nosotros»',
      note: filled(hotel.description)
        ? 'Visible en la portada'
        : 'Sin él, la portada oculta esta sección',
      done: filled(hotel.description),
      href: '/admin/hotel#datos',
    },
    {
      id: 'coordinates',
      title: 'Coordenadas del mapa',
      note:
        hotel.latitude !== null && hotel.longitude !== null
          ? 'El mapa y «Cómo llegar» usan la ubicación exacta'
          : 'Latitud y longitud del hotel',
      done: hotel.latitude !== null && hotel.longitude !== null,
      href: '/admin/hotel#ubicacion',
    },
  ];
}

export type KpiId = 'roomTypes' | 'altText' | 'profile' | 'whatsapp';

export interface Kpi {
  id: KpiId;
  label: string;
  value: string;
  note: string;
  /** Nothing left to do for this KPI. */
  done: boolean;
  href: string;
}

/** The eleven public facts of the hotel profile (name is required, so it is not counted). */
function profileFacts(hotel: ReadinessData['hotel']): boolean[] {
  return [
    filled(hotel.tagline),
    filled(hotel.description),
    filled(hotel.address),
    filled(hotel.municipality),
    filled(hotel.department),
    hotel.latitude !== null && hotel.longitude !== null,
    filled(hotel.phone),
    hasValidWhatsApp(hotel.whatsappNumber),
    filled(hotel.email),
    filled(hotel.checkInTime),
    filled(hotel.checkOutTime),
  ];
}

export function readinessKpis(data: ReadinessData): Kpi[] {
  const published = data.roomTypes.filter((type) => type.status === 'PUBLISHED');
  const priced = published.filter((type) => type.basePrice !== null).length;

  const { total, missingAlt } = data.media;
  const described = Math.max(total - missingAlt, 0);

  const facts = profileFacts(data.hotel);
  const done = facts.filter(Boolean).length;
  const percent = Math.round((done / facts.length) * 100);

  const whatsapp = hasValidWhatsApp(data.hotel.whatsappNumber);

  return [
    {
      id: 'roomTypes',
      label: 'Tipos de habitación publicados',
      value: `${published.length} de ${data.roomTypes.length}`,
      note: `${priced} ${plural(priced, 'publicado', 'publicados')} con tarifa`,
      done: published.length > 0 && priced === published.length,
      href: '/admin/room-types',
    },
    {
      id: 'altText',
      label: 'Fotos con texto alternativo',
      value: total === 0 ? '0' : `${described} de ${total}`,
      note:
        total === 0
          ? 'Aún no hay fotos'
          : missingAlt > 0
            ? `${missingAlt} sin texto alternativo`
            : 'Todas tienen descripción',
      done: total > 0 && missingAlt === 0,
      href: missingAlt > 0 ? '/admin/media?missingAlt=true' : '/admin/media',
    },
    {
      id: 'profile',
      label: 'Perfil del hotel',
      value: `${percent} %`,
      note: `${done} de ${facts.length} datos`,
      done: done === facts.length,
      href: '/admin/hotel',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      value: whatsapp ? 'Configurado' : 'Pendiente',
      note: whatsapp ? 'Los botones abren el chat' : 'Los botones llaman al teléfono',
      done: whatsapp,
      href: '/admin/hotel#whatsapp',
    },
  ];
}
