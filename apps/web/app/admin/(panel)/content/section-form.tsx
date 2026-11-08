'use client';

import { OptimisticSwitch } from '@/components/admin/publish-switch';
import { browserApi } from '@/lib/api/browser';
import type { LandingSection } from '@/lib/api/types';

/**
 * What each home switch controls since C3 fixed the home order in code. The DB keys stay as they
 * were (ADR 0016); only the labels say what the switch really shows or hides.
 */
export const SECTION_COPY: Record<string, { label: string; description: string }> = {
  SERVICES: {
    label: 'Comodidades en la franja de confianza',
    description:
      'Las comodidades del hotel bajo la portada. El registro RNT, la dirección y las habitaciones se muestran siempre.',
  },
  ROOMS: {
    label: 'Tipos de habitación',
    description: 'Las tarjetas de los tipos publicados, con foto, capacidad y tarifa.',
  },
  LOCATION: {
    label: 'Ubicación y lugares cercanos',
    description: 'Dirección, teléfono, distancias y mapa. Necesita la dirección del hotel.',
  },
  ABOUT: {
    label: 'Sobre nosotros',
    description: 'El texto «Sobre nosotros» de Datos del hotel, con una foto.',
  },
  FAQ: {
    label: 'Resumen de información para huéspedes',
    description: 'Horarios de entrada y salida, títulos de las políticas y enlace a la página.',
  },
  GALLERY: {
    label: 'Franja de galería',
    description: 'Cuatro fotos publicadas de la galería con enlace a la galería completa.',
  },
  CONTACT: {
    label: 'Llamado final a contactar',
    description: 'Panel con foto y botón de WhatsApp (o de llamada si no hay WhatsApp).',
  },
};

/** Home order (app/(site)/page.tsx); HERO is not a switch: the hero always shows. */
const HOME_ORDER = ['SERVICES', 'ROOMS', 'LOCATION', 'ABOUT', 'FAQ', 'GALLERY', 'CONTACT'];

export function homeSwitches(sections: LandingSection[]): LandingSection[] {
  const byKey = new Map(sections.map((section) => [section.key, section]));
  return HOME_ORDER.flatMap((key) => {
    const section = byKey.get(key);
    return section ? [section] : [];
  });
}

/** Home section switches (9.8, ADR 0016). The order is part of the design and not editable. */
export function SectionsManager({ sections }: { sections: LandingSection[] }) {
  return (
    <ol className="divide-y divide-line">
      {homeSwitches(sections).map((section, index) => {
        const copy = SECTION_COPY[section.key]!;
        return (
          <li
            key={section.key}
            className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4 first:pt-0 last:pb-0"
          >
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-ivory text-xs font-bold text-ink-muted tabular-nums"
              >
                {index + 2}
              </span>
              <div className="min-w-0">
                <p className="text-[0.95rem] font-bold">{copy.label}</p>
                <p className="mt-0.5 text-[0.8125rem] leading-snug text-muted-foreground">
                  {copy.description}
                </p>
              </div>
            </div>
            <OptimisticSwitch
              checked={section.enabled}
              label={`Mostrar «${copy.label}» en la portada`}
              onText="Visible"
              offText="Oculta"
              request={(next) => browserApi.put(`/admin/content/${section.key}`, { enabled: next })}
              successMessage={(next) =>
                next ? `«${copy.label}» visible.` : `«${copy.label}» oculta.`
              }
            />
          </li>
        );
      })}
    </ol>
  );
}
