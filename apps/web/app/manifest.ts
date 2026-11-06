import type { MetadataRoute } from 'next';

/**
 * Web app manifest (D6): name, colours and the brand icons for "add to home screen" and Android
 * tab colours. The icons are the same files as the favicon (app/icon.svg) and the Apple icon.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Hotel Bambú Plaza',
    short_name: 'Bambú Plaza',
    description: 'Hotel en Mocoa, Putumayo: habitaciones, ubicación y contacto directo.',
    lang: 'es-CO',
    start_url: '/',
    display: 'browser',
    background_color: '#f8f6f0',
    theme_color: '#315c45',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
