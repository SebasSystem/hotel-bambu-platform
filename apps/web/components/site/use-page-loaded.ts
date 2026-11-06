'use client';

import { useEffect, useState } from 'react';

/**
 * `false` on the server and until the window `load` event, then `true`. Lets secondary photos
 * (later hero slides, room thumbnails) wait until the LCP photo has loaded instead of competing
 * with it for bandwidth on slow phones (D6).
 */
export function usePageLoaded(): boolean {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let timer: number | undefined;
    const done = () => {
      timer = window.setTimeout(() => setLoaded(true), 0);
    };
    if (document.readyState === 'complete') done();
    else window.addEventListener('load', done, { once: true });
    return () => {
      window.removeEventListener('load', done);
      window.clearTimeout(timer);
    };
  }, []);
  return loaded;
}
