import { Globe } from 'lucide-react';
import type { ReactNode } from 'react';
import { ui } from '@/lib/i18n/es';
import type { PublicSocialLink } from '@/lib/public/types';

/**
 * Monochrome brand marks drawn inline (no icon dependency, no external script). They inherit
 * `currentColor`; simplified shapes, 24 × 24 viewBox.
 */
const BRAND_ICONS: Record<string, ReactNode> = {
  INSTAGRAM: (
    <g fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="0.6" fill="currentColor" />
    </g>
  ),
  FACEBOOK: (
    <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.3H7.4V14h2.8v8h3.3z" />
  ),
  TIKTOK: (
    <path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9.1a7.4 7.4 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6z" />
  ),
  YOUTUBE: (
    <path
      fillRule="evenodd"
      d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8A26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z"
    />
  ),
  X: (
    <path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.2-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z" />
  ),
  TRIPADVISOR: (
    <g fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M3 9.5C5.5 7.5 8.6 6.5 12 6.5s6.5 1 9 3" />
      <circle cx="7" cy="13.5" r="4" />
      <circle cx="17" cy="13.5" r="4" />
      <circle cx="7" cy="13.5" r="1" fill="currentColor" />
      <circle cx="17" cy="13.5" r="1" fill="currentColor" />
    </g>
  ),
  GOOGLE_BUSINESS: (
    <path d="M21 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.1a4.4 4.4 0 0 1-1.9 2.9v2.4h3.1c1.8-1.7 2.7-4.1 2.7-7zM12 21.5c2.6 0 4.7-.9 6.3-2.3l-3.1-2.4c-.9.6-2 .9-3.2.9-2.5 0-4.6-1.7-5.3-3.9H3.5v2.5A9.5 9.5 0 0 0 12 21.5zM6.7 13.8a5.7 5.7 0 0 1 0-3.6V7.7H3.5a9.5 9.5 0 0 0 0 8.6l3.2-2.5zM12 6.3c1.4 0 2.6.5 3.6 1.4l2.7-2.7A9.5 9.5 0 0 0 3.5 7.7l3.2 2.5C7.4 8 9.5 6.3 12 6.3z" />
  ),
};

function SocialIcon({ platform }: { platform: string }) {
  const mark = BRAND_ICONS[platform];
  if (!mark) return <Globe aria-hidden="true" strokeWidth={1.75} className="size-[18px]" />;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-[18px]"
    >
      {mark}
    </svg>
  );
}

/**
 * Footer social profiles (owner review 2026-11-08): a brand icon plus the visible platform name,
 * named "Instagram de Hotel Bambú Plaza" for screen readers. The same URLs feed the Hotel JSON-LD
 * `sameAs`, which this component does not touch.
 */
export function SocialLinks({
  links,
  hotelName,
}: {
  links: PublicSocialLink[];
  hotelName: string;
}) {
  if (links.length === 0) return null;
  return (
    <ul aria-label={ui.footer.social} className="mt-5 flex flex-wrap gap-x-5 gap-y-3">
      {links.map((social) => {
        const label = ui.footer.socialLabel(social.platform);
        return (
          <li key={social.id}>
            <a
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${ui.footer.socialName(label, hotelName)} ${ui.whatsapp.newTab}`}
              className="group inline-flex min-h-11 items-center gap-2.5 rounded-xs transition-colors duration-(--duration-fast) hover:text-white"
            >
              <span className="inline-grid size-9 shrink-0 place-items-center rounded-full border border-white/25 transition-colors duration-(--duration-fast) group-hover:border-white/60">
                <SocialIcon platform={social.platform} />
              </span>
              <span className="underline-offset-4 group-hover:underline">{label}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
