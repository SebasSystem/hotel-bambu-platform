/**
 * Interface strings of the public site (requirement 19.4: UI copy in a dictionary, hotel content
 * comes from the API). Spanish (Colombia), neutral and professional.
 */
export const ui = {
  skipToContent: 'Saltar al contenido',
  menu: { open: 'Abrir menú', close: 'Cerrar menú', label: 'Menú principal' },
  nav: {
    home: 'Inicio',
    rooms: 'Habitaciones',
    gallery: 'Galería',
    location: 'Ubicación',
    /** Short header label of «Información para huéspedes» (the desktop header has no room). */
    policies: 'Huéspedes',
    faq: 'Preguntas frecuentes',
  },
  breadcrumb: 'Ruta de navegación',
  /** H1 and breadcrumb name of the merged inner pages (C3). */
  pages: {
    location: 'Ubicación y cómo llegar',
    policies: 'Información para huéspedes',
    policiesIntro: 'Normas de la estadía y preguntas frecuentes, para que llegues sin sorpresas.',
    /** Accessible name of the ESCNNA notice on the guest-info page. */
    escnnaLabel:
      'Aviso de prevención de la explotación sexual comercial de niñas, niños y adolescentes',
    gallery: 'Galería de fotos',
  },
  phone: { call: 'Llamar', callTo: 'Llamar al' },
  whatsapp: {
    cta: 'Escríbenos por WhatsApp',
    short: 'WhatsApp',
    ask: 'Consultar',
    open: 'Abrir WhatsApp',
    stay: 'Consultar estadía',
    viaWhatsApp: 'por WhatsApp',
    room: 'Consultar por WhatsApp',
    floating: 'Escribir por WhatsApp',
    newTab: '(se abre en una pestaña nueva)',
    external:
      'WhatsApp es un servicio externo con sus propias políticas. Abrir el chat no constituye una reserva.',
  },
  rooms: {
    seeAll: 'Ver habitaciones',
    seeDetail: 'Ver habitación',
    from: 'Desde',
    capacity: (n: number) => (n === 1 ? '1 persona' : `${n} personas`),
    noPrice: 'Consultar tarifa',
    noPriceNote: 'Te la confirmamos al consultar tus fechas.',
    confirm: 'El precio final y la disponibilidad se confirman directamente con el hotel.',
    countLabel: (n: number) => (n === 1 ? '1 habitación' : `${n} habitaciones`),
    typeCount: (n: number) => (n === 1 ? '1 tipo de habitación' : `${n} tipos de habitación`),
    all: 'Todas',
    others: 'Otros tipos de habitación',
    includes: 'Incluye',
    beds: 'Camas',
    area: 'Área',
    back: 'Todas las habitaciones',
    filter: 'Filtrar por tipo de habitación',
    capacityLabel: 'Capacidad',
    guestsLabel: 'Huéspedes',
    description: 'Descripción',
    rate: 'Tarifa',
    schedule: 'Horarios',
    upTo: (n: number) => `Hasta ${n} ${n === 1 ? 'persona' : 'personas'}`,
    featured: 'Habitación destacada',
    /** Mockup "Elige según tu capacidad y necesidades…", without the availability promise. */
    intro:
      'Elige según tu capacidad y necesidades. Cada tipo muestra sus fotos reales, camas y comodidades.',
  },
  pricesDisclaimer:
    'Las tarifas publicadas son informativas. El precio final y la disponibilidad se confirman directamente con el hotel.',
  map: {
    load: 'Cargar mapa',
    notice:
      'El mapa se carga desde Google Maps, un servicio externo que puede instalar sus propias cookies.',
    directions: 'Cómo llegar',
    title: (name: string) => `Mapa de ubicación de ${name}`,
  },
  gallery: {
    seeAll: 'Ver galería completa',
    open: (alt: string) => `Ampliar imagen: ${alt}`,
    close: 'Cerrar',
    previous: 'Imagen anterior',
    next: 'Imagen siguiente',
    position: (i: number, n: number) => `Imagen ${i} de ${n}`,
    count: (n: number) => (n === 1 ? '1 foto' : `${n} fotos`),
    filter: 'Filtrar por categoría',
    seeAllPhotos: (n: number) => `Ver las ${n} fotos`,
    intro: 'Fotos reales de nuestras instalaciones, sin imágenes de catálogo.',
  },
  hero: {
    pause: 'Pausar presentación',
    play: 'Reanudar presentación',
    previous: 'Foto anterior',
    next: 'Foto siguiente',
    label: 'Fotos del hotel',
    slide: (i: number, n: number) => `${i} de ${n}`,
    carousel: 'carrusel',
    slideRole: 'diapositiva',
  },
  footer: {
    contact: 'Contacto',
    explore: 'Explorar',
    info: 'Información',
    legal: 'Legal',
    social: 'Redes sociales',
    /** Public platform names for the footer icons (admin labels live in lib/labels.ts). */
    socialLabel: (platform: string) =>
      ({
        FACEBOOK: 'Facebook',
        INSTAGRAM: 'Instagram',
        TIKTOK: 'TikTok',
        YOUTUBE: 'YouTube',
        X: 'X',
        TRIPADVISOR: 'Tripadvisor',
        GOOGLE_BUSINESS: 'Google',
      })[platform] ?? 'Sitio web',
    socialName: (label: string, hotel: string) => `${label} de ${hotel}`,
    rnt: 'Registro Nacional de Turismo (RNT)',
    /** Link from the short ESCNNA notice to the full text on the guest-info page. */
    escnnaMore: 'Leer el aviso completo y cómo denunciar',
    cookies: 'Configurar cookies',
    rights: (year: number, name: string) => `© ${year} ${name}. Todos los derechos reservados.`,
  },
  legal: {
    data: 'Tratamiento de datos',
    privacy: 'Aviso de privacidad',
    cookies: 'Política de cookies',
  },
  contact: {
    phone: 'Teléfono',
    email: 'Correo',
    address: 'Dirección',
    hours: 'Horarios de atención',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    call: 'Llamar',
    direct: 'Contacto directo',
  },
  location: {
    nearby: 'Lugares cercanos',
    surroundings: 'Alrededores',
    kicker: 'Ubicación',
    /** Mockup "Ubicación y contacto" heading, true for the hotel. */
    title: (city: string) => `Estamos en ${city}.`,
    titleFallback: 'Dónde estamos',
    /** Home link to /ubicacion (the map card's "Cómo llegar" opens Google Maps). */
    seePage: 'Ver ubicación',
    /** Shown when no nearby places are listed yet: an invitation, not a fact. */
    askDirections: (kind: 'whatsapp' | 'phone') =>
      kind === 'whatsapp'
        ? 'Escríbenos y te indicamos cómo llegar.'
        : 'Llámanos y te indicamos cómo llegar.',
    distance: 'Distancia',
    time: 'Tiempo',
    contactTitle: (city: string) => `Cuéntanos cuándo vienes a ${city}.`,
    contactTitleFallback: 'Cuéntanos cuándo vienes.',
  },
  closing: {
    kicker: 'Tu próxima estadía',
    /** Mockup contact heading, used for the final CTA panel. */
    title: 'Tu estadía empieza con una conversación.',
    withWhatsApp: (city: string | null) =>
      `Cuéntanos cuándo vienes${city ? ` a ${city}` : ''} y te confirmamos disponibilidad y tarifa. Abrir WhatsApp no constituye una reserva.`,
    withPhone: (city: string | null) =>
      `Cuéntanos cuándo vienes${city ? ` a ${city}` : ''}: llámanos y te confirmamos disponibilidad y tarifa.`,
    withoutContact: 'Conoce nuestras habitaciones y sus características.',
  },
  home: {
    heroKicker: (place: string) => `Hotel en ${place}`,
    trustLabel: 'Datos del hotel',
    roomsKicker: (n: number) => (n === 1 ? '1 habitación' : `${n} habitaciones`),
    /** Mockup "Un espacio para bajar el ritmo." adapted to the hotel's own words. */
    roomsTitle: 'Un espacio para descansar al final del día.',
    hotelWide: 'En todo el hotel',
    aboutKicker: 'Sobre nosotros',
    /** Mockup "Hospitalidad serena, cerca de todo…" without the unverified "cerca de todo". */
    aboutTitle: (city: string | null) =>
      city ? `Hospitalidad cálida en el corazón de ${city}.` : 'Hospitalidad cálida.',
    policiesKicker: 'Antes de llegar',
    policiesTitle: 'Información para huéspedes',
    policiesAll: 'Ver información para huéspedes',
    galleryKicker: 'Una mirada al hotel',
    galleryTitle: 'Espacios para sentirte a gusto.',
    reviewsKicker: 'Opiniones de huéspedes',
  },
  faq: { title: 'Preguntas frecuentes', other: '¿Tienes otra pregunta?' },
  consent: {
    bannerLabel: 'Aviso de cookies',
    bannerTitle: 'Tu privacidad',
    bannerText:
      'Usamos cookies necesarias para que el sitio funcione. Con tu permiso cargamos el mapa de Google (funcionales) y contamos visitas sin identificarte (analíticas).',
    acceptAll: 'Aceptar todas',
    rejectAll: 'Rechazar no esenciales',
    configure: 'Configurar preferencias',
    dialogTitle: 'Preferencias de cookies',
    dialogIntro:
      'Elige qué categorías permites. Rechazar las no esenciales no te impide usar el sitio ni contactarnos.',
    save: 'Guardar preferencias',
    close: 'Cerrar',
    alwaysOn: 'Siempre activas',
    categories: {
      necessary: {
        title: 'Necesarias',
        text: 'Guardan tu decisión sobre cookies y, solo en el panel administrativo, la sesión del personal del hotel. No se pueden desactivar.',
      },
      functional: {
        title: 'Funcionales',
        text: 'Cargan automáticamente el mapa de Google Maps, que puede instalar sus propias cookies de terceros.',
      },
      analytics: {
        title: 'Analíticas',
        text: 'Cuentan visitas y clics en WhatsApp como totales diarios, sin cookies de seguimiento, sin IP y sin identificarte.',
      },
    },
    policyLinks: 'Más información en la',
    and: 'y la',
    saved: 'Preferencias guardadas.',
  },
  empty: {
    location: 'Pronto publicaremos la dirección y las indicaciones para llegar al hotel.',
    contact: 'Pronto publicaremos los datos de contacto del hotel.',
    generic: 'Estamos preparando este contenido.',
  },
} as const;
