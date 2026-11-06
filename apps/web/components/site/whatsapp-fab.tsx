'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ui } from '@/lib/i18n/es';
import { WhatsAppLink } from './whatsapp-link';

/**
 * Floating WhatsApp button (requirement 5.1, mockup `.whatsapp-fab` without "Por configurar"): appears once the element marked
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
        className="inline-flex min-h-[55px] items-center gap-2 rounded-pill bg-whatsapp px-[15px] py-2 text-[0.78rem] font-bold text-white shadow-fab transition-colors duration-(--duration-fast) hover:bg-green-900 [&_svg]:size-[26px]"
      >
        {ui.whatsapp.short}
      </WhatsAppLink>
    </div>
  );
}
