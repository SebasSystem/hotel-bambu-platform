'use client';

import { useAction } from '@/components/admin/hooks';
import { ReorderButtons, moveItem } from '@/components/admin/reorder-buttons';
import { BooleanBadge, Button } from '@/components/admin/ui';
import { browserApi } from '@/lib/api/browser';
import type { LandingSection } from '@/lib/api/types';

export const SECTION_LABELS: Record<string, string> = {
  HERO: 'Portada',
  ABOUT: 'Sobre el hotel',
  ROOMS: 'Habitaciones',
  SERVICES: 'Comodidades',
  GALLERY: 'Galería',
  LOCATION: 'Ubicación',
  FAQ: 'Preguntas frecuentes',
  CONTACT: 'Contacto',
};

/**
 * Home sections (9.8, ADR 0016): each one is only a switch and a position. Headings are code and
 * the hotel texts live in the hotel profile, so there is nothing else to edit here.
 */
export function SectionsManager({ sections }: { sections: LandingSection[] }) {
  const { run, busy } = useAction();

  const move = (from: number, to: number) => {
    const ordered = moveItem(sections, from, to);
    void run(
      'order',
      async () => {
        for (const [index, section] of ordered.entries()) {
          if (section.sortOrder !== index) {
            await browserApi.put(`/admin/content/${section.key}`, { sortOrder: index });
          }
        }
      },
      'Orden actualizado.',
    );
  };

  return (
    <section aria-labelledby="sections-title" className="flex flex-col gap-4">
      <h2 id="sections-title" className="text-lg font-semibold">
        Secciones del inicio
      </h2>
      <ul className="flex flex-col gap-2">
        {sections.map((section, index) => {
          const label = SECTION_LABELS[section.key] ?? section.key;
          return (
            <li
              key={section.key}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold">{label}</span>
                <BooleanBadge value={section.enabled} on="Visible" off="Oculta" />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  aria-pressed={section.enabled}
                  loading={busy === `enabled:${section.key}`}
                  onClick={() =>
                    void run(
                      `enabled:${section.key}`,
                      () =>
                        browserApi.put(`/admin/content/${section.key}`, {
                          enabled: !section.enabled,
                        }),
                      section.enabled ? `«${label}» oculta.` : `«${label}» visible.`,
                    )
                  }
                >
                  {section.enabled ? 'Ocultar' : 'Mostrar'}
                  <span className="sr-only"> {label}</span>
                </Button>
                <ReorderButtons
                  index={index}
                  count={sections.length}
                  label={label}
                  onMove={move}
                  disabled={busy !== null}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
