import { GALLERY_CATEGORIES } from '@hotel-bambu/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { GalleryGrid } from '@/components/site/gallery-grid';
import { PageHeader } from '@/components/site/page-header';
import { container } from '@/components/site/styles';
import { GALLERY_CATEGORY_LABELS } from '@/lib/labels';
import { ui } from '@/lib/i18n/es';
import { pageMetadata } from '@/lib/seo/metadata';
import { getGallery, getSite } from '@/lib/public/api';
import { routes } from '@/lib/public/navigation';
import { sectionOf } from '@/lib/public/site';

type Category = (typeof GALLERY_CATEGORIES)[number];

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const section = sectionOf(site, 'GALLERY');
  return pageMetadata({
    path: routes.gallery,
    siteName: site.hotel.name,
    title: section?.title ?? ui.nav.gallery,
    description: section?.subtitle ?? `Fotografías reales de ${site.hotel.name}.`,
  });
}

export default async function GalleryPage({ searchParams }: PageProps<'/galeria'>) {
  const [site, items, query] = await Promise.all([getSite(), getGallery(), searchParams]);
  const section = sectionOf(site, 'GALLERY');
  const categories = GALLERY_CATEGORIES.filter((category) =>
    items.some((item) => item.category === category),
  );
  const requested = typeof query.categoria === 'string' ? query.categoria.toUpperCase() : null;
  const active = categories.find((category) => category === requested) ?? null;
  const visible = active ? items.filter((item) => item.category === active) : items;
  const filterClass =
    'inline-flex min-h-11 items-center rounded-pill border px-5 text-sm font-semibold transition-colors';
  const on = 'border-bamboo-700 bg-bamboo-700 text-white';
  const off = 'border-sand-200 bg-sand-50 text-bamboo-900 hover:border-bamboo-700';

  return (
    <>
      <PageHeader
        path={routes.gallery}
        title={section?.title ?? ui.nav.gallery}
        kicker={section?.subtitle}
        intro={section?.body}
      >
        {categories.length > 1 ? (
          <nav aria-label="Filtrar por categoría" className="mt-8">
            <ul className="flex flex-wrap gap-2">
              <li>
                <Link
                  href={routes.gallery}
                  aria-current={active ? undefined : 'page'}
                  className={`${filterClass} ${active ? off : on}`}
                >
                  {ui.rooms.all}
                </Link>
              </li>
              {categories.map((category: Category) => (
                <li key={category}>
                  <Link
                    href={`${routes.gallery}?categoria=${category.toLowerCase()}`}
                    aria-current={active === category ? 'page' : undefined}
                    className={`${filterClass} ${active === category ? on : off}`}
                  >
                    {GALLERY_CATEGORY_LABELS[category]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </PageHeader>
      <section aria-label={ui.nav.gallery} className={`${container} py-16`}>
        {visible.length > 0 ? (
          <GalleryGrid images={visible.map((item) => item.media)} />
        ) : (
          <p className="text-lg text-muted-foreground">{ui.empty.generic}</p>
        )}
      </section>
    </>
  );
}
