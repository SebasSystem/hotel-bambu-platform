'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ui } from '@/lib/i18n/es';
import { WhatsAppLink } from './whatsapp-link';

/**
 * Floating WhatsApp button (requirement 5.1, motion spec): appears once the element marked
 * `data-fab-sentinel` (the home hero) leaves the viewport, or after a short scroll elsewhere.
 * Without JS it is simply not shown (the header and section CTAs remain).
 */
export function WhatsAppFab({ href }: { href: string }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sentinel = document.querySelector('[data-fab-sentinel]');
    if (sentinel) {
      const observer = new IntersectionObserver(([entry]) => setVisible(!entry?.isIntersecting));
      observer.observe(sentinel);
      return () => observer.disconnect();
    }
    const update = () => setVisible(window.scrollY > 320);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [pathname]);

  return (
    <div className="whatsapp-fab" data-visible={visible ? 'true' : 'false'} inert={!visible}>
      <WhatsAppLink
        href={href}
        source="floating"
        ariaLabel={`${ui.whatsapp.floating} ${ui.whatsapp.newTab}`}
        className="inline-flex size-14 items-center justify-center rounded-pill bg-whatsapp text-whatsapp-foreground shadow-lg transition-[filter] duration-(--duration-fast) hover:brightness-95 [&_svg]:size-7"
      />
    </div>
  );
}
