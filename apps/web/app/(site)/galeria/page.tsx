import type { Metadata } from 'next';
import { FilterLink, PageHeader, Toolbar } from '@/components/site/page-header';
import { PhotoGallery } from '@/components/site/photo-gallery';
import { container } from '@/components/site/styles';
import { ui } from '@/lib/i18n/es';
import { pageMetadata } from '@/lib/seo/metadata';
import { getGallery, getSite } from '@/lib/public/api';
import { galleryCategoryFromParam, galleryFilters } from '@/lib/public/gallery';
import { routes } from '@/lib/public/navigation';
import { sectionOf } from '@/lib/public/site';

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

/**
 * Gallery (mockup `#galeria`): page hero, category chips (platform categories with Spanish labels,
 * `?categoria=`), a 3/2/1-column masonry whose tiles always fill (defect 3) and the lightbox.
 */
export default async function GalleryPage({ searchParams }: PageProps<'/galeria'>) {
  const [site, items, query] = await Promise.all([getSite(), getGallery(), searchParams]);
  const section = sectionOf(site, 'GALLERY');
  const filters = galleryFilters(items);
  const requested = galleryCategoryFromParam(query.categoria);
  const active = filters.some((filter) => filter.category === requested) ? requested : null;
  const visible = active ? items.filter((item) => item.category === active) : items;

  return (
    <>
      <PageHeader
        path={routes.gallery}
        title={section?.title ?? ui.nav.gallery}
        kicker={section?.subtitle ?? ui.home.galleryKicker}
        intro={section?.body}
      />
      <Toolbar label={ui.gallery.filter} count={ui.gallery.count(visible.length)}>
        {filters.length > 1 ? (
          <>
            <FilterLink href={routes.gallery} active={!active}>
              {ui.rooms.all}
            </FilterLink>
            {filters.map((filter) => (
              <FilterLink
                key={filter.category}
                href={`${routes.gallery}?categoria=${filter.param}`}
                active={active === filter.category}
              >
                {filter.label}
              </FilterLink>
            ))}
          </>
        ) : null}
      </Toolbar>
      <section aria-label={ui.nav.gallery} className={`${container} pt-12 pb-[110px]`}>
        {visible.length > 0 ? (
          <PhotoGallery
            key={active ?? 'all'}
            variant="masonry"
            images={visible.map((item) => item.media)}
          />
        ) : (
          <p className="text-lg text-muted-foreground">{ui.empty.generic}</p>
        )}
      </section>
    </>
  );
}
