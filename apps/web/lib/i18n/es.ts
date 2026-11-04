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
    services: 'Servicios',
    gallery: 'Galería',
    location: 'Ubicación',
    faq: 'Preguntas frecuentes',
    policies: 'Políticas del hotel',
    contact: 'Contacto',
  },
  whatsapp: {
    cta: 'Escríbenos por WhatsApp',
    short: 'WhatsApp',
    room: 'Consultar por WhatsApp',
    floating: 'Escribir por WhatsApp',
    newTab: '(se abre en una pestaña nueva)',
    external:
      'WhatsApp es un servicio externo con sus propias políticas. Abrir el chat no constituye una reserva.',
  },
  rooms: {
    seeAll: 'Ver habitaciones',
    seeDetail: 'Ver detalle',
    from: 'Desde',
    capacity: (n: number) => (n === 1 ? '1 persona' : `${n} personas`),
    noPrice: 'Consulta la tarifa por WhatsApp',
    noPriceNoWhatsApp: 'Consulta la tarifa con el hotel',
    confirm: 'El precio final y la disponibilidad se confirman por WhatsApp.',
    countLabel: (n: number) => (n === 1 ? '1 habitación' : `${n} habitaciones`),
    all: 'Todas',
    others: 'Otras habitaciones',
    includes: 'Incluye',
    beds: 'Camas',
    area: 'Área',
    promotion: 'Promoción vigente',
    validUntil: 'Válida hasta',
    conditions: 'Condiciones',
    back: 'Todas las habitaciones',
  },
  pricesDisclaimer:
    'Las tarifas publicadas son informativas. El precio final y la disponibilidad se confirman por WhatsApp.',
  map: {
    load: 'Cargar mapa',
    notice:
      'El mapa se carga desde Google Maps, un servicio externo que puede instalar sus propias cookies.',
    directions: 'Cómo llegar',
    open: 'Abrir en Google Maps',
    title: (name: string) => `Mapa de ubicación de ${name}`,
  },
  gallery: {
    seeAll: 'Ver galería completa',
    open: (alt: string) => `Ampliar imagen: ${alt}`,
    close: 'Cerrar',
    previous: 'Imagen anterior',
    next: 'Imagen siguiente',
    position: (i: number, n: number) => `Imagen ${i} de ${n}`,
  },
  hero: { pause: 'Pausar presentación', play: 'Reanudar presentación' },
  footer: {
    contact: 'Contacto',
    explore: 'Explora',
    legal: 'Legal',
    social: 'Redes sociales',
    rnt: 'Registro Nacional de Turismo (RNT)',
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
  },
  location: { nearby: 'Alrededores', kicker: 'Cómo llegar' },
  closing: {
    title: (name: string) => `Planea tu estadía en ${name}`,
    withWhatsApp:
      'Escríbenos y te confirmamos disponibilidad y tarifa. Abrir WhatsApp no constituye una reserva.',
    withoutWhatsApp: 'Conoce nuestras habitaciones y sus características.',
  },
  home: {
    roomsAll: (n: number) => `Ver las ${n} habitaciones`,
    amenitiesTitle: 'En todas las habitaciones',
    faqAll: 'Ver todas las preguntas',
  },
  empty: {
    location: 'Pronto publicaremos la dirección y las indicaciones para llegar al hotel.',
    contact: 'Pronto publicaremos los datos de contacto del hotel.',
    generic: 'Estamos preparando este contenido.',
  },
} as const;
