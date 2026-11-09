# Plataforma web para hotel — Documento de contexto y requisitos

> **Versión:** 2.0
> **Fecha:** 4 de noviembre de 2026
> **Estado:** Alcance, arquitectura y dirección de diseño consolidados — listo para iniciar desarrollo
> **Tipo de solución:** Sitio web público + panel administrativo
> **Contexto:** Hotel en Colombia (identidad actual: letrero verde con bambú)
> **Arquitectura:** Monolito modular con frontend (Next.js) y backend (NestJS) separados

---

## 0. Cómo usar este documento

Este documento es la **fuente de verdad** del proyecto. Está escrito para el equipo y para el agente de desarrollo que construirá la plataforma.

### 0.1 Reglas para el agente de desarrollo

1. **Leer el documento completo antes de escribir código.** Las secciones 6, 7 y 8 (identidad, investigación y animación) condicionan el frontend; la 15 condiciona los seeds y la gestión de imágenes.
2. **Verificar versiones al instalar.** Las versiones de la sección 25 son una referencia a noviembre de 2026. Antes de instalar, consultar la documentación oficial y usar la última versión estable compatible. No copiar guías antiguas sin verificar.
3. **No inventar datos del hotel.** Nombres, precios, servicios, horarios, número RNT, dirección y textos legales vienen del hotel. Donde falten, usar marcadores explícitos `TODO(hotel): …` y listarlos en `docs/pendientes-hotel.md`.
4. **No inventar reseñas, testimonios, premios ni certificaciones.** Solo contenido real con fuente verificable.
5. **Registrar decisiones técnicas** relevantes como ADR cortos en `docs/adr/NNNN-titulo.md` (contexto, decisión, consecuencias).
6. **Trabajar por fases** (sección 26) y cerrar cada fase con su checklist antes de pasar a la siguiente.
7. **Cambios pequeños y verificables.** Cada funcionalidad con pruebas mínimas y sin romper el build.
8. **Si una instrucción de este documento entra en conflicto con la documentación oficial vigente de una librería**, prevalece la documentación oficial; registrar la diferencia en un ADR y actualizar este documento.
9. **Proporcionalidad.** No agregar dependencias, capas ni abstracciones sin necesidad concreta (ver sección 30).

### 0.2 Cambios respecto a la versión 1.0

- Nuevas secciones: **identidad visual y sistema de diseño** (6), **investigación de diseño** con hallazgos iniciales y protocolo (7), **sistema de movimiento y animación** (8), **imágenes del hotel, medios y seeds** (15), **presupuestos de rendimiento** (20).
- Nueva **Fase 0** (investigación y dirección de arte) antes de construir la interfaz pública.
- **Normativa turística colombiana** agregada como referencia: campo **opcional** para número RNT (se muestra solo si el hotel lo configura) y precios con impuestos incluidos (17.6).
- **Elementos opcionales claramente marcados** (2.3): video en el hero, narrativa con video, scroll suave y 3D son opciones a investigar en la Fase 0, no requisitos.
- Arquitectura de información: la home sigue siendo una landing narrativa, pero las **habitaciones, ubicación y políticas tienen páginas propias indexables** (mejor SEO).
- Nuevos contenidos: **políticas del hotel, preguntas frecuentes, cómo llegar y alrededores**, horarios de check-in/check-out.
- **Autenticación**: el navegador habla con la API a través del mismo origen (Next.js como proxy) para simplificar cookies, CORS y CSRF (12.4).
- **Invalidación de caché** definida: la API notifica a Next.js por etiquetas tras cada cambio (21).
- **Prisma** movido dentro de `apps/api` y ajustado a la configuración de Prisma 7 (`prisma.config.ts`, adaptadores de driver).
- Módulo `contact` fusionado en `hotel` (evita duplicar datos). Modelo de medios aclarado (`MediaAsset` + tablas de relación).
- Video en el hero contemplado (especificaciones, accesibilidad y rendimiento).
- Mapa de Google cargado bajo demanda/consentimiento (los iframes de terceros pueden instalar cookies).
- Preparado para un segundo idioma (inglés) sin implementarlo en la primera versión.

---

## 1. Resumen del proyecto

Se desarrollará una plataforma web para mejorar la presencia digital de un hotel, presentar sus instalaciones, habitaciones, servicios, tarifas, ubicación y canales de contacto, y facilitar que los visitantes interesados se comuniquen directamente con el establecimiento mediante WhatsApp.

La solución tendrá dos partes:

1. **Sitio público:** orientado a visitantes y potenciales huéspedes. Presentará la información comercial del hotel de forma atractiva, inmersiva, clara, rápida y adaptable a móviles.
2. **Panel administrativo:** permitirá al personal autorizado mantener actualizada la información que aparece en el sitio público, sin conocimientos de programación.

El sistema **no** será un motor de reservas ni una plataforma de comercio electrónico. No procesará pagos, no confirmará disponibilidad en tiempo real y no almacenará reservas. El llamado a la acción principal será contactar al hotel por WhatsApp.

### 1.1 Objetivo general

Construir una presencia digital profesional, memorable y administrable que permita al hotel darse a conocer en Internet, comunicar su oferta y convertir visitas en contactos directos.

### 1.2 Objetivos específicos

- Presentar la identidad, propuesta de valor e instalaciones del hotel con una experiencia visual cuidada (no plana ni genérica).
- Publicar habitaciones, fotografías, características y tarifas informativas.
- Mostrar servicios, comodidades, ubicación, cómo llegar y medios de contacto.
- Facilitar el contacto por WhatsApp con mensajes contextuales.
- Permitir que el administrador actualice textos, imágenes, tarifas y datos de contacto.
- Mejorar la visibilidad en buscadores (SEO técnico, local y contenido estructurado).
- Medir interacciones comerciales básicas sin recopilar información personal innecesaria.
- Mantener una aplicación segura, accesible, rápida y fácil de mantener.
- Cumplir las obligaciones de publicidad turística y protección de datos aplicables en Colombia.

---

## 2. Alcance funcional

### 2.1 Incluido en la primera versión

- Sitio público responsive con home narrativa y páginas indexables (ver 4.1).
- Presentación del hotel (sobre nosotros).
- Listado y detalle de habitaciones con URL propia.
- Tarifas informativas y promociones, si el hotel las maneja.
- Galería de imágenes (el video es opcional; ver 2.3).
- Servicios y comodidades.
- Ubicación, mapa, cómo llegar y atractivos cercanos.
- Políticas del hotel (check-in/check-out, mascotas, menores, cancelación informativa, etc.).
- Preguntas frecuentes.
- Datos de contacto y enlaces a redes sociales.
- Botones de contacto por WhatsApp con mensaje contextual.
- Panel administrativo privado para todo el contenido anterior.
- Autenticación y protección del administrador.
- Métricas básicas agregadas, si se habilitan.
- Política de tratamiento de datos, aviso de privacidad, política de cookies y gestor de consentimiento.
- Campo opcional para el número de Registro Nacional de Turismo (RNT); se muestra en el footer solo si el hotel lo configura (ver 17.6).
- Identidad visual base (logo, paleta, tipografía, tokens).
- SEO, accesibilidad, rendimiento, registro de errores y despliegue.

### 2.2 Fuera del alcance

La primera versión **NO** incluirá:

- Registro o inicio de sesión para visitantes / cuentas de huéspedes.
- Reservas en línea, calendario de disponibilidad o confirmación automática.
- Pasarela de pagos o facturación electrónica.
- Gestión de huéspedes, CRM o chat interno.
- Programa de fidelización.
- Constructor visual genérico de páginas.
- Aplicación móvil nativa.
- Integración con PMS/channel manager o WhatsApp Business API (posibles ampliaciones).
- Traducción al inglés (la arquitectura queda preparada; ver 19.4).

**Importante:** las tarifas publicadas son informativas. El sitio debe indicar que el precio final y la disponibilidad se confirman directamente con el hotel por WhatsApp.

### 2.3 Opcional: a investigar y decidir en la Fase 0

Estos elementos **no son requisitos**. Son ideas a evaluar en la investigación (sección 7). Solo se implementan si la investigación y el material disponible lo justifican, y la decisión se registra en un ADR:

| Elemento | Situación actual | Por defecto si no se aprueba |
|---|---|---|
| Video en el hero | Solo existe **un video sencillo** (una habitación y la entrada). Evaluar su calidad, duración y luz | Hero con fotografía |
| Narrativa con varios videos por sección | Solo era un ejemplo visto en otros hoteles; hoy no hay material suficiente | Narrativa con fotografías (sticky, transiciones de imagen) |
| Video en el detalle de una habitación o en la galería | Posible uso del video existente | Solo fotos |
| Scroll suave (Lenis) | A evaluar | Scroll nativo |
| Elementos 3D (Three.js / React Three Fiber) | Exploración de investigación | Sin 3D |
| Motion (además de GSAP) | Solo si un componente lo necesita | Solo CSS + GSAP |

El sitio debe verse completo y cuidado **sin ninguno** de estos elementos.

---

## 3. Tipos de usuario

### 3.1 Visitante

No crea cuenta ni inicia sesión. Puede consultar información del hotel, explorar habitaciones, tarifas, fotografías, servicios, políticas, ubicación y redes, y contactar al hotel por WhatsApp. No puede modificar información ni acceder al panel.

### 3.2 Administrador

Usuario autorizado para mantener el sitio. Puede:

- Iniciar y cerrar sesión; cambiar su contraseña.
- Consultar el dashboard.
- Actualizar información general, contacto, ubicación, horarios, RNT y políticas.
- Crear, editar, publicar, desactivar, ordenar y eliminar habitaciones (según reglas de integridad).
- Gestionar tarifas, promociones, servicios, galería, preguntas frecuentes y redes.
- Editar los textos e imágenes de las secciones definidas de la landing.
- Consultar métricas agregadas, si están habilitadas.

Los usuarios del panel tienen un rol, y cada rol concede permisos por sección del panel: «ver» o «gestionar» (gestionar incluye ver) en Resumen, Datos del hotel, Habitaciones, Contenido, Fotos y medios, Actividad y Usuarios y roles. El rol Administrador (del sistema) tiene todos los permisos y no se puede modificar ni eliminar; se incluyen además los roles Editor de contenido y Recepción, editables. Los usuarios con permiso se gestionan desde el panel (crear, editar nombre, rol y estado, restablecer contraseña; nunca se eliminan, se desactivan). Nadie puede cambiar su propio rol ni desactivarse, y siempre debe quedar al menos un Administrador activo. La API aplica los permisos en cada ruta y el panel oculta lo que el rol no puede abrir. Decisión: [ADR 0017](adr/0017-admin-roles-permissions.md) (antes existía un único rol de administrador).

---

## 4. Sitio público

El sitio debe comunicar confianza, transmitir la experiencia del lugar (naturaleza, bambú, descanso) y permitir encontrar rápido lo importante: habitaciones, precio orientativo, ubicación y WhatsApp.

### 4.1 Arquitectura de información y rutas

La home funciona como una landing narrativa con anclas; además, el contenido con intención de búsqueda propia tiene páginas indexables.

```text
/                          Home narrativa (landing)
/habitaciones              Listado de habitaciones
/habitaciones/[slug]       Detalle de cada habitación
/servicios                 Servicios y comodidades (opcional: puede vivir solo en la home)
/galeria                   Galería completa
/ubicacion                 Ubicación, mapa, cómo llegar y alrededores
/preguntas-frecuentes      FAQ
/politicas-del-hotel       Check-in/out, mascotas, menores, cancelación, etc.
/legal/tratamiento-de-datos
/legal/aviso-de-privacidad
/legal/cookies
/admin/...                 Panel (no indexable)
```

Las rutas pueden ajustarse tras la investigación (sección 7), pero las habitaciones y la ubicación deben conservar URL propia.

### 4.2 Estructura sugerida de la home

1. **Header** — logo, navegación por secciones/páginas, botón destacado de WhatsApp, menú móvil. Transparente sobre el hero y sólido al hacer scroll.
2. **Hero / portada** — fotografía principal (video solo si se aprueba, ver 2.3), nombre, propuesta de valor, descripción corta, CTA a WhatsApp y CTA secundario "Ver habitaciones".
3. **Sobre nosotros** — historia, enfoque, diferenciales, fotografías.
4. **Habitaciones** — tarjetas de habitaciones publicadas: foto principal, nombre, capacidad, características clave, tarifa "desde", botón de consulta por WhatsApp y enlace al detalle.
5. **Experiencia / servicios** — servicios reales confirmados con icono o imagen.
6. **Galería** — selección destacada con enlace a la galería completa.
7. **Ubicación** — dirección, mapa bajo demanda, botón "Cómo llegar", atractivos cercanos.
8. **Preguntas frecuentes** — selección de las más útiles.
9. **Contacto** — teléfono, WhatsApp, correo, dirección, horarios.
10. **Footer** — datos del hotel, navegación, redes, número RNT (si está configurado), enlaces legales, "Configurar cookies", derechos de autor.

La estructura puede reordenarse según la investigación y el contenido real. No mostrar secciones vacías.

### 4.3 Detalle de habitación

- Galería (con imagen principal definida).
- Descripción completa, capacidad, camas, área (si se publica).
- Servicios incluidos.
- Tarifa informativa con unidad, condiciones e indicación de impuestos (ver 17.6).
- Promoción vigente, si existe, con condiciones y fechas.
- Botón de WhatsApp con mensaje que incluye el nombre de la habitación.
- Navegación a otras habitaciones.
- Metadatos y datos estructurados propios (sección 19).

### 4.4 Reglas de visualización

- Solo se muestran habitaciones, servicios, FAQ e imágenes **publicados**.
- Los elementos sin información suficiente no producen bloques vacíos ni errores visuales.
- Tarifas en pesos colombianos (COP) con formato `es-CO` (ej.: `$ 250.000`).
- Sin tarifa publicada: mostrar "Consulta la tarifa por WhatsApp".
- Promociones: mostrar condiciones y vigencia; ocultarlas automáticamente fuera de su rango de fechas.
- Todo el contenido proviene del backend; no duplicar textos fijos en componentes (excepto textos de interfaz, ver 19.4).
- El sitio sigue funcionando si una sección opcional no tiene contenido.

---

## 5. Lógica de WhatsApp

WhatsApp es el canal principal de conversión.

### 5.1 Puntos de entrada

Header, hero, tarjeta de habitación, detalle de habitación, sección de contacto y botón flotante (si el diseño lo justifica y no tapa contenido en móvil).

### 5.2 Mensajes preparados

Plantillas editables desde el panel, con variables controladas:

> General: "Hola, vi su hotel en su página web y quisiera obtener más información."

> Habitación: "Hola, estoy interesado en la habitación {{habitacion}}. ¿Podrían brindarme información sobre disponibilidad y tarifa?"

> Promoción: "Hola, vi la promoción {{promocion}} en su página web y quisiera más información."

### 5.3 Reglas técnicas

- Número almacenado en formato internacional, solo dígitos con código de país (ej.: `57XXXXXXXXXX`); validar en backend.
- Enlace con el formato oficial `https://wa.me/NUMERO?text=MENSAJE_CODIFICADO` (usar `encodeURIComponent`).
- Construir el enlace en una única función compartida y probada.
- Abrir en nueva pestaña con `rel="noopener noreferrer"`.
- Nunca mostrar "Reserva confirmada" ni equivalentes; abrir WhatsApp no es una reserva.
- Informar (por ejemplo, en el aviso de privacidad) que el contacto ocurre en un servicio externo.
- El sistema no almacena conversaciones.

---

## 6. Identidad visual y sistema de diseño

El hotel no tiene manual de marca. El punto de partida es su letrero actual: **verde con un bambú**. El objetivo es construir una identidad base coherente y fácil de cambiar después, porque todo el frontend consumirá **tokens de diseño** en lugar de valores sueltos.

### 6.1 Concepto

- **Atributos:** natural, sereno, acogedor, auténtico, cuidado.
- **Metáforas visuales:** bambú (líneas verticales, nudos/segmentos, hojas alargadas), luz filtrada entre hojas, materiales naturales (madera, fibra, piedra).
- **Evitar:** estética genérica de plantilla de hotel, verdes neón, exceso de efectos oscuros "tecnológicos", iconografía de stock incoherente.

### 6.2 Logo

Entregables (SVG optimizado, vectorial):

- Isotipo: bambú estilizado (por ejemplo, tallo segmentado con una o dos hojas; o la inicial del hotel construida con segmentos de bambú).
- Versión horizontal (isotipo + nombre) y vertical.
- Versiones a color, monocromo oscuro y monocromo claro (sobre fotografía/video).
- Favicon (SVG + PNG 32/180/192/512) y `apple-touch-icon`.
- Imagen Open Graph por defecto (1200×630).
- Tamaño mínimo y área de protección documentados en `docs/brand/README.md`.

Reglas: el logo debe leerse a 32 px; no depender de degradados para funcionar; derivar el verde del letrero real (muestrear color de una foto del letrero con buena luz y ajustarlo). La propuesta final debe ser aprobada por el hotel. Si el hotel lo desea, un diseñador puede refinarla después; el sistema de tokens permite cambiarla sin tocar componentes.

### 6.3 Paleta inicial propuesta

Valores de partida; **ajustar con el verde real del letrero** y verificar contraste (WCAG AA: 4.5:1 texto normal, 3:1 texto grande y componentes).

| Token | Uso | Valor inicial |
|---|---|---|
| `--color-bamboo-900` | Texto sobre claro, fondos oscuros | `#14332A` |
| `--color-bamboo-700` | Primario (botones, enlaces, header sólido) | `#1F4D3A` |
| `--color-bamboo-500` | Primario medio, hovers | `#3E7D4F` |
| `--color-bamboo-300` | Detalles, ilustraciones | `#8DB580` |
| `--color-cane-500` | Acento "caña seca" (decorativo, no texto sobre claro) | `#C9A55C` |
| `--color-sand-50` | Fondo principal | `#F7F3EA` |
| `--color-sand-100` | Fondo de secciones alternas | `#EEE7D8` |
| `--color-earth-600` | Acento secundario puntual | `#A8582F` |
| `--color-ink-900` | Texto principal | `#1A1F1C` |
| `--color-whatsapp` | Solo para el icono/botón de WhatsApp si se usa su color | `#25D366` (verificar contraste del texto) |

Notas: el acento caña no cumple contraste como texto sobre fondo claro; usarlo en líneas, iconos grandes o sobre fondos oscuros. Definir los colores en OKLCH o HEX como tokens de Tailwind v4 (`@theme`) y mapearlos a las variables semánticas de shadcn/ui (`--primary`, `--background`, `--foreground`, etc.). El panel administrativo usa la misma base con estilo más sobrio.

### 6.4 Tipografía

- **Display (títulos):** serif con carácter orgánico. Candidatas: *Fraunces* (variable, con ejes de suavidad), *Cormorant Garamond*, *Playfair Display*.
- **Texto e interfaz:** sans legible. Candidatas: *Manrope*, *Inter*, *DM Sans*.
- Propuesta inicial: **Fraunces + Manrope**. Probar 2–3 combinaciones en la Fase 0 con contenido real.
- Requisitos: subconjunto latino con tildes y ñ, carga con `next/font` (autoalojada, sin llamadas a Google en tiempo de ejecución), máximo 2 familias y pocos pesos, escala tipográfica fluida (`clamp`).

### 6.5 Otros fundamentos

- Escala de espaciado, radios (suaves, orgánicos), sombras discretas.
- Iconografía: Lucide para interfaz; iconos de servicios con un mismo estilo de trazo.
- Fotografía: tratamiento de color coherente; nunca alterar la realidad del lugar (no "mejorar" habitaciones de forma engañosa).
- Textura opcional sutil (grano, líneas de bambú) que no afecte rendimiento ni legibilidad.
- Documentar todo en `docs/brand/README.md` y en una página interna `/admin/design-system` o Storybook **solo si** aporta valor (opcional).

---

## 7. Investigación de diseño

Objetivo: que la interfaz no quede plana ni genérica. La investigación alimenta la dirección de arte, los componentes, las animaciones y los flujos. Se hace en la **Fase 0**, antes de construir el sitio público.

### 7.1 Hallazgos iniciales (investigación preliminar, noviembre 2026)

**Patrones frecuentes en sitios de hoteles bien valorados:**

- Hero a pantalla completa con **video de fondo** y header transparente que se vuelve sólido al hacer scroll.
- **Narrativa por scroll** (storytelling): secciones fijas (*sticky*) donde el fondo cambia de video/imagen mientras el texto avanza; revelado de títulos por líneas o palabras.
- Galerías horizontales o en mosaico, transiciones de imágenes con máscaras, parallax suave.
- Mapas interactivos y ubicación como parte de la historia ("cómo llegar" como experiencia).
- Camino de conversión **visible en todo momento** (botón persistente), precios claros y prueba social real.
- Tendencias 2026: minimalismo con gran impacto visual, móvil primero, accesibilidad, velocidad y contenido estructurado para buscadores y asistentes de IA.

**Referencias para revisar (el agente debe abrirlas, verificar que existan y documentarlas):**

- Awwwards — hoteles: *Hotel Odisej*, *Ayana Bali*, *Silena (soulful hotel)*, *Schlosshotel Kitzbühel*, *The Beaux Arts* (scroll, transiciones, video inmersivo, tipografía).
- Eco/boutique en Colombia (competencia aspiracional, mismo nicho naturaleza): *Cannúa* (Antioquia), *Bio Habitat Hotel* (Quindío), *Calanoa Amazonas*, *Hotel PietraSanta* (Guatapé), *Entre Palos*.
- Galerías de inspiración: Awwwards (categoría Hotel/Restaurant y "Elements"), Godly, Land-book, Lapa Ninja, SiteInspire, Codrops (técnicas con código).

**Librerías de componentes animados (copiar y adaptar, no instalar en bloque):**

| Fuente | Fortaleza | Cuidado |
|---|---|---|
| React Bits | Gran variedad de textos animados, fondos y efectos; usa CSS y solo incorpora GSAP/Three.js en los componentes que lo requieren; incluye controles de movimiento reducido | Revisar cada componente; algunos son experimentales |
| Magic UI | Microinteracciones pulidas (marquees, contadores, bordes) | Depende de Motion; adaptar a tokens |
| Aceternity UI | Efectos cinematográficos para landings | Pensado para modo oscuro; en fondos claros requiere rehacer estilos. Usar con moderación |
| shadcn/ui | Base accesible para el panel y formularios | Animación mínima por defecto (correcto para el admin) |
| GSAP (showcase y demos oficiales) | Estándar para animación ligada al scroll | Ver reglas de la sección 8 |

### 7.2 Protocolo de investigación (Fase 0)

**R1. Competencia local y regional** (requiere conocer el municipio del hotel):
- 5–8 hoteles del mismo municipio/región y 3–5 referentes aspiracionales del nicho.
- Fuentes: búsqueda en Google ("hotel en [municipio]"), Google Maps, Booking/Expedia (para identificar competidores; no copiar contenido), Instagram.
- Por cada uno, completar la plantilla 7.3.

**R2. Referentes de diseño (no solo hoteles):** 15–25 sitios con animaciones, estilos o flujos aplicables al nicho (naturaleza, hospitalidad, arquitectura, gastronomía, bienestar). Guardar capturas o grabaciones cortas en `docs/research/refs/` con nota de qué se toma de cada uno.

**R3. Componentes y técnicas:** evaluar efectos concretos (revelado de texto, galería horizontal, transición de imágenes, sticky storytelling, video por secciones, mapa, cursor, microinteracciones de botones) con estos criterios: licencia, dependencias y peso, compatibilidad con SSR/App Router, soporte de `prefers-reduced-motion`, funcionamiento en móvil de gama media, compatibilidad con fondo claro y facilidad de adaptación a los tokens.

**R4. Flujos:** cómo llevan otros sitios del interés a la acción (dónde ponen el CTA, cuántos clics hasta el contacto, cómo presentan precio y políticas, qué ven primero en móvil).

**R5. SEO competitivo:** títulos, descripciones, estructura de URLs, datos estructurados (ver con la prueba de resultados enriquecidos), presencia en Google Business Profile, velocidad (PageSpeed Insights móvil).

### 7.3 Plantilla de análisis por sitio

| Campo | Contenido |
|---|---|
| URL y tipo | Competidor local / aspiracional / referente de diseño |
| Propuesta de valor | Qué promete en el primer pantallazo |
| Estructura | Orden de secciones y páginas |
| Hero | Video / foto / slider; texto; CTA |
| Conversión | Canal (reserva, WhatsApp, formulario), ubicación del CTA |
| Precios y políticas | ¿Muestra precio? ¿Cómo? ¿Impuestos? |
| Movimiento | Animaciones destacadas y su calidad en móvil |
| Visual | Paleta, tipografías, fotografía, iconografía |
| Rendimiento | Puntuación móvil, LCP aproximado |
| SEO | Title, description, schema, URLs |
| Tomar | Qué ideas aplicar |
| Evitar | Qué no repetir |

### 7.4 Entregables de la investigación

1. `docs/research/design-research.md` — análisis completo con las plantillas.
2. `docs/research/refs/` — capturas y clips de referencia.
3. **Dos direcciones de arte** (moodboard + home en baja/media fidelidad para móvil y escritorio), por ejemplo: *A. "Refugio sereno"* (mucho aire, serif elegante, transiciones lentas) y *B. "Selva viva"* (más textura, collage de fotos, movimiento más expresivo).
4. **Especificación de movimiento** (sección 8.5) con la lista de animaciones aprobadas.
5. Decisión documentada (ADR) tras la revisión del responsable del proyecto.

**Regla:** inspiración no es copia. No reproducir diseños, textos, fotografías ni código de otros sitios.

---

## 8. Sistema de movimiento y animación

Las animaciones deben **contar la historia del lugar** y guiar hacia el contacto, nunca ralentizar ni impedir el acceso a la información.

### 8.1 Capas tecnológicas (de menor a mayor costo)

1. **CSS** (transiciones, `@keyframes`, View Transitions, animaciones ligadas al scroll nativas cuando estén soportadas): primera opción para revelados simples, hovers y estados.
2. **GSAP + ScrollTrigger** (con `@gsap/react` / `useGSAP`): motor principal para narrativa por scroll, *pin/scrub*, galerías horizontales y revelado de texto (SplitText). Todo GSAP, incluidos sus plugins antes de pago, es gratuito también para uso comercial.
3. **Lenis** (opcional): scroll suave que envuelve el scroll nativo; sincronizar con ScrollTrigger. Desactivarlo con movimiento reducido y evaluar desactivarlo en táctil.
4. **Motion** (`motion/react`): solo si se necesitan animaciones de presencia/salida o gestos en componentes concretos. **Evitar usar dos motores para lo mismo.**
5. **3D (Three.js / React Three Fiber):** solo si la investigación justifica un elemento 3D concreto y aporta al relato (por ejemplo, hojas en partículas sutiles o un mapa en relieve). Cargar de forma diferida, solo cliente, fuera del camino de LCP, con alternativa estática.

En el panel administrativo: solo transiciones de shadcn/ui y CSS. Nada de animaciones narrativas.

### 8.2 Patrones candidatos (ejemplos para investigar, no requisitos)

Lista de ideas para evaluar en la Fase 0. Se eligen solo las que aporten y sean viables con el material real del hotel (ver 2.3).


- Hero con fotografía (o video si se aprueba) + título que se revela por líneas.
- Header transparente → sólido con fondo desenfocado al hacer scroll.
- Sección "Sobre nosotros" con texto que avanza mientras las imágenes cambian (sticky).
- Narrativa por secciones: el fondo pasa de una imagen a otra según la sección visible (patrón visto en sitios de hoteles con video; aquí se haría con fotos salvo que haya material de video suficiente).
- Habitaciones en tarjetas con transición de imagen al pasar el cursor y entrada escalonada.
- Galería horizontal con scroll (en móvil, carrusel táctil nativo con *scroll-snap*).
- Línea de bambú/hoja que se "dibuja" en SVG al llegar a una sección (DrawSVG o `stroke-dashoffset`).
- Contadores sutiles (años de experiencia, número de habitaciones) solo con datos reales.
- Mapa: revelado de la ruta o del punto al entrar en la sección.

### 8.3 Reglas obligatorias

- **`prefers-reduced-motion: reduce`**: desactivar scroll suave, parallax, pin/scrub y autoplay; mostrar el contenido final sin animación.
- **Contenido visible sin JavaScript**: el HTML debe renderizar el contenido completo (SEO y accesibilidad); las animaciones parten de estados que no ocultan contenido si el script falla.
- **Animar solo `transform` y `opacity`** siempre que sea posible; evitar animar propiedades que causen *layout*.
- **No bloquear la interacción**: nada de *preloaders* largos ni animaciones que retrasen el primer contenido útil. El LCP no puede esperar a una animación.
- **Limpieza**: usar `gsap.context()` / `useGSAP` para revertir animaciones al desmontar; `ScrollTrigger.refresh()` tras cargar imágenes que cambian alturas.
- **Contenido en movimiento automático de más de 5 s** (video, carruseles): debe poder pausarse (WCAG 2.2.2).
- **Móvil de gama media** es el dispositivo de referencia: probar con CPU y red limitadas.
- Los componentes copiados de librerías se adaptan a los tokens y se revisan uno a uno (accesibilidad, peso, SSR).

### 8.4 Video (solo si se aprueba en la Fase 0)

Material disponible hoy: **un video sencillo** de una habitación y la entrada. El agente debe revisarlo y proponer uno de estos usos, o ninguno: (a) fondo del hero, si la calidad, la luz y la estabilidad lo permiten; (b) video corto en el detalle de esa habitación o en la galería; (c) no usarlo. Si se pide más material al hotel, anotarlo en la lista de fotos faltantes (15.2).

Si se usa, aplicar estas reglas:

- Formatos: MP4 (H.264) como base; opcional WebM/AV1 adicional. Sin audio, `muted`, `playsInline`, `loop`, `autoplay` solo si no hay movimiento reducido.
- Duración 8–20 s, recortado y comprimido. Referencia: ≤ 4 MB escritorio (1080p), ≤ 1,5 MB móvil (720p). Variantes con `media`/selección por tamaño.
- **Imagen `poster` optimizada como elemento LCP**; el video empieza a cargar después.
- No cargar video si el usuario tiene `Save-Data` o la conexión es lenta: mostrar la imagen.
- Botón visible de pausa/reproducción con etiqueta accesible.
- El video se gestiona desde el panel como `MediaAsset` de tipo video (límite de tamaño estricto) o, en la primera versión, como archivo estático versionado si el hotel no necesita cambiarlo con frecuencia (decidir en Fase 0).

### 8.5 Especificación de movimiento (entregable de Fase 0)

Tabla en `docs/research/motion-spec.md`: componente, disparador, duración, *easing*, comportamiento en móvil, comportamiento con movimiento reducido y librería usada. Definir *easings* y duraciones como tokens (`--ease-out-soft`, `--duration-base`, etc.).

---

## 9. Panel administrativo

Interfaz privada especializada. **No** es un CMS genérico ni un constructor visual: formularios específicos por tipo de información; la estructura y el diseño los controla el código.

### 9.1 Navegación

```text
/admin
├── Dashboard
├── Información del hotel (datos, contacto, ubicación, horarios, RNT)
├── Habitaciones
├── Promociones
├── Servicios
├── Galería y medios
├── Contenido de la landing
├── Preguntas frecuentes
├── Políticas del hotel
├── Redes sociales
├── WhatsApp (número y plantillas)
├── Estadísticas (opcional)
└── Mi cuenta
```

### 9.2 Dashboard

Habitaciones publicadas/borrador, servicios activos, promociones vigentes, última actualización, contenido incompleto (por ejemplo, imágenes sin texto alternativo, habitaciones sin tarifa) y métricas agregadas si existen. No mostrar reservas ni ingresos.

### 9.3 Información del hotel

Nombre comercial, razón social (opcional), número RNT (opcional), descripción corta y completa, logo, imagen/video principal, dirección, municipio, departamento, coordenadas, enlace de mapa, indicaciones de cómo llegar, atractivos cercanos, teléfono, WhatsApp, correo, horarios de atención, horas de check-in y check-out.

### 9.4 Habitaciones

Operaciones: crear, consultar, editar, publicar/despublicar, ordenar, gestionar imágenes, eliminar si no hay dependencias que lo impidan.

Campos: nombre, `slug` (autogenerado y editable, único), tipo, descripción corta y completa, capacidad máxima, configuración de camas, área (opcional), tarifa informativa, unidad de tarifa, indicación de impuestos incluidos, notas de tarifa, servicios incluidos, imagen principal, galería, estado (`DRAFT`, `PUBLISHED`, `INACTIVE`), orden, título y descripción SEO (opcionales, con valor por defecto).

**Reglas:** desactivar oculta sin borrar. Publicar exige los campos mínimos (nombre, slug, descripción corta, capacidad, imagen principal con texto alternativo). Cambiar el slug de una habitación publicada crea una redirección 301 desde el anterior.

### 9.5 Tarifas y promociones

- Precio publicado en COP (`Decimal`), unidad (por noche, por persona por noche, otra), texto de condiciones.
- Indicar si el precio incluye impuestos; por defecto debe publicarse el precio total con impuestos (17.6).
- Promociones con título, descripción, condiciones, fecha de inicio y fin, habitación asociada opcional y estado.
- No calcular precios de reserva ni bloquear inventario.
- No presentar una tarifa como definitiva si depende de temporada u ocupación: usar "desde" y la nota de confirmación por WhatsApp.

### 9.6 Servicios

Crear, editar, activar/desactivar, ordenar. Campos: nombre, descripción, icono (de un catálogo controlado) o imagen, indicador de si se muestra en la home.

### 9.7 Galería y medios

Subir, previsualizar, definir texto alternativo (obligatorio para publicar), título o descripción opcional, categoría (habitaciones, zonas comunes, exteriores, gastronomía, entorno), ordenar (arrastrar), marcar portada, reemplazar, retirar. Validación de tamaño, extensión y tipo real. Generación de versiones optimizadas.

### 9.8 Contenido de la landing

Solo campos definidos por sección (`key` fija): título, subtítulo, texto, etiqueta de CTA, imagen asociada, activar/desactivar. Sin HTML libre; si se necesita formato, usar un subconjunto controlado (negrita, enlaces, listas) sanitizado.

### 9.9 Preguntas frecuentes y políticas

FAQ: pregunta, respuesta, orden, publicada, mostrar en home. Políticas: título, contenido, orden (check-in/out, mascotas, menores, fumadores, cancelación informativa, métodos de pago aceptados al llegar, etc.).

### 9.10 Redes sociales y WhatsApp

Redes: plataforma (catálogo), URL validada, orden, activa. WhatsApp: número validado y plantillas de mensaje con variables permitidas.

---

## 10. Lógica de publicación y consistencia

- Borrador e inactivo no aparecen en el sitio.
- Publicar exige campos mínimos validados en backend.
- No se puede publicar una imagen cuyo procesamiento no haya terminado (`MediaAsset.status = READY`).
- Validar antes de guardar; operaciones que afecten varios registros usan transacciones.
- Al eliminar una imagen: borrar registro y archivo; si falla el borrado externo, registrar en `PendingStorageDeletion` para limpieza posterior (tarea programada).
- El backend es la autoridad sobre estados y permisos; ocultar un botón no es seguridad.
- Todas las entidades administrables guardan `createdAt` y `updatedAt`; acciones administrativas relevantes quedan en `AuditLog`.
- Tras cada cambio publicado, la API solicita la revalidación del contenido afectado (sección 21).

---

## 11. Métricas y analítica

### 11.1 Eventos

`PAGE_VIEW`, `WHATSAPP_CLICK` (con origen: header, hero, habitación, etc.), `ROOM_VIEW`, `MAP_CLICK`, `SOCIAL_CLICK`.

### 11.2 Implementación recomendada

- Contador propio agregado: endpoint `POST /api/v1/public/events` con lista blanca de tipos, validación estricta y rate limiting.
- Guardar **conteos diarios agregados** (`fecha`, `tipo`, `origen`, `entidad`), no eventos individuales.
- Sin cookies, sin identificadores persistentes, sin guardar IP ni user agent completos.
- **Por defecto**, enviar eventos solo con consentimiento de la categoría analítica (postura conservadora). Si el hotel quiere medir sin consentimiento con el contador agregado sin identificadores, documentar la decisión con su asesor y reflejarla en la política de cookies/privacidad.
- No incorporar Google Analytics, Meta Pixel u otras herramientas hasta definir necesidad, configuración y tratamiento (ver 17.5).
- Retención definida (por ejemplo, 24 meses de agregados).

---

## 12. Arquitectura técnica

### 12.1 Estilo arquitectónico

**Monolito modular** en el backend (NestJS), frontend Next.js, desplegables por separado. No se proponen microservicios: el alcance no lo justifica.

### 12.2 Diagrama general

```text
          VISITANTE                         ADMINISTRADOR
              |                                   |
              v                                   v
   +------------------------------------------------------+
   |                 Next.js (apps/web)                   |
   |  Sitio público (SSG/ISR + caché por etiquetas)       |
   |  Panel /admin (dinámico, sin caché compartida)       |
   |  /api/*  -> proxy (rewrite) hacia NestJS             |
   |  /api/revalidate (protegido por secreto)             |
   +---------------------------+--------------------------+
                               | HTTPS (red interna si es posible)
                               v
                  +--------------------------+
                  |   NestJS + Fastify       |
                  |   REST /api/v1           |
                  +------------+-------------+
                               |
     +------+------+------+----+-----+-------+--------+---------+
     |      |      |      |          |       |        |         |
   auth   hotel  rooms  amenities  media  content   faq/      analytics
                 promos            gallery         policies
                               |
                            Prisma
                               |
                         PostgreSQL
                               
                  Almacenamiento de objetos (S3 compatible)
                  imágenes y video (originales + variantes)
```

### 12.3 Frontend — Next.js + TypeScript + App Router

- Server Components por defecto; Client Components solo para interacción y animación.
- Páginas públicas estáticas/revalidables con caché por etiquetas (`hotel`, `rooms`, `room:{slug}`, `gallery`, `content`, `faq`, `policies`, `social`).
- Panel administrativo dinámico; nunca cachear respuestas privadas como públicas.
- Interfaz: Tailwind CSS v4 (tokens con `@theme`), shadcn/ui, Lucide, React Hook Form + Zod, TanStack Query solo si el panel lo necesita.
- Animación: ver sección 8.
- Imágenes: `next/image` con loader del proveedor o variantes pregeneradas (decidir en 15.4).

### 12.4 Comunicación frontend–backend y sesión (decisión clave)

Para evitar problemas de cookies entre dominios, CORS y CSRF:

- El navegador **solo habla con el origen de Next.js**. Next.js reescribe `/api/*` hacia la API (rewrite) o actúa como BFF.
- Los Server Components consultan la API por la URL interna del servidor y, en el panel, reenvían la cookie de sesión.
- La cookie de sesión es de primera parte (mismo sitio): `HttpOnly`, `Secure`, `SameSite=Lax` (o `Strict` para el panel), `Path=/`, duración definida.
- CSRF: verificación de `Origin`/`Referer` + token (doble envío o sincronizador) en operaciones que modifican datos.
- Alternativa aceptable si se despliegan en subdominios del mismo dominio (`www.` y `api.`): cookie con dominio común y CORS con lista explícita. Registrar la elección en un ADR.

### 12.5 Backend — NestJS + TypeScript + Fastify

Responsable de la API REST, autenticación, validación, reglas de negocio, datos, medios, seguridad, registro de errores y documentación OpenAPI (Swagger habilitado solo fuera de producción o protegido).

Paquetes del ecosistema Fastify (verificar compatibilidad con la versión instalada): `@fastify/helmet`, `@fastify/cookie`, `@fastify/multipart`, `@fastify/csrf-protection` (o mecanismo equivalente), `@nestjs/throttler`.

**Seguridad de versiones:** usar `@nestjs/platform-fastify` **≥ 11.1.11**; versiones anteriores tienen una vulnerabilidad (CVE-2025-69211) que permite saltarse middleware de seguridad. Además, implementar autenticación y autorización con **Guards** de NestJS, no con middleware.

### 12.6 Base de datos — PostgreSQL

Relacional por naturaleza del dominio (hotel–habitaciones–imágenes–servicios). Integridad referencial, restricciones, transacciones, índices y JSONB solo para configuraciones puntuales. No se recomienda MongoDB.

### 12.7 ORM — Prisma

- Ubicación: `apps/api/prisma/` (la API es la dueña de la base de datos).
- Prisma 7 introduce `prisma.config.ts` (URL de conexión, migraciones y comando de seed se configuran allí), el generador `prisma-client` con ruta de salida explícita y **adaptadores de driver** (para PostgreSQL, `@prisma/adapter-pg`). `migrate dev` ya no ejecuta el seed automáticamente: ejecutarlo de forma explícita.
- Verificar al iniciar si hay una versión mayor más reciente y su compatibilidad; registrar la elección en ADR.
- Reglas importantes también como restricciones en la base de datos (únicos, foráneas, `CHECK` cuando aplique, con SQL en migraciones si Prisma no las expresa).

### 12.8 Validación compartida (recomendado)

Para no duplicar reglas: definir esquemas Zod en `packages/shared` y usarlos en el frontend (formularios) y en el backend (pipe de validación Zod o integración tipo `nestjs-zod`). Alternativa válida: DTOs con `class-validator` en backend y Zod en frontend. Elegir una y registrarla en ADR. En backend: rechazar propiedades no esperadas.

### 12.9 Almacenamiento de imágenes y video

Nunca binarios en PostgreSQL. Almacenamiento de objetos compatible con S3 (en desarrollo, MinIO en Docker) o Cloudinary. La base de datos guarda metadatos (sección 14). Definir proveedor, región, costos de transferencia y privacidad antes del despliegue.

### 12.10 API

REST versionada en `/api/v1`. Endpoints públicos de solo lectura; administrativos con autenticación y autorización.

```text
GET    /api/v1/public/site            (hotel, contacto, redes, plantillas de WhatsApp, secciones activas)
GET    /api/v1/public/rooms
GET    /api/v1/public/rooms/:slug
GET    /api/v1/public/amenities
GET    /api/v1/public/gallery
GET    /api/v1/public/faq
GET    /api/v1/public/policies
POST   /api/v1/public/events          (métricas agregadas; rate limited)
POST   /api/v1/public/consents        (evidencia de consentimiento; ver 17.5)

POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
POST   /api/v1/auth/change-password

GET|PATCH            /api/v1/admin/hotel
GET|POST             /api/v1/admin/rooms
GET|PATCH|DELETE     /api/v1/admin/rooms/:id
PATCH                /api/v1/admin/rooms/:id/status
PUT                  /api/v1/admin/rooms/order
PUT                  /api/v1/admin/rooms/:id/images        (orden y portada)
GET|POST             /api/v1/admin/promotions
PATCH|DELETE         /api/v1/admin/promotions/:id
GET|POST             /api/v1/admin/amenities
PATCH|DELETE         /api/v1/admin/amenities/:id
GET|POST             /api/v1/admin/media
PATCH|DELETE         /api/v1/admin/media/:id
GET|PUT              /api/v1/admin/content/:sectionKey
GET|POST             /api/v1/admin/faq           PATCH|DELETE /api/v1/admin/faq/:id
GET|POST             /api/v1/admin/policies      PATCH|DELETE /api/v1/admin/policies/:id
GET|POST             /api/v1/admin/social-links  PATCH|DELETE /api/v1/admin/social-links/:id
GET                  /api/v1/admin/analytics/summary
GET                  /api/v1/health
```

Propuesta inicial; ajustar al modelo final. Respuestas de error con formato uniforme (código, mensaje, detalles de validación) sin filtrar información interna.

---

## 13. Organización del código

### 13.1 Monorepo (pnpm workspaces + Turborepo)

```text
hotel-platform/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   │   ├── (public)/            # home, habitaciones, ubicación, legal...
│   │   │   ├── admin/               # panel (protegido)
│   │   │   └── api/revalidate/      # endpoint de revalidación protegido
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn/ui
│   │   │   ├── motion/              # primitivas de animación reutilizables
│   │   │   └── sections/            # secciones de la landing
│   │   ├── features/                # rooms, gallery, content, consent, analytics...
│   │   ├── lib/                     # api client, whatsapp, formatters, seo
│   │   ├── styles/                  # tokens y estilos globales
│   │   └── public/brand/            # logo, favicon, OG por defecto
│   └── api/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seed/                # base.ts, demo.ts
│       ├── prisma.config.ts
│       ├── scripts/                 # admin-create.ts, media-import.ts
│       └── src/
│           ├── modules/
│           │   ├── auth/  admin-users/  hotel/  rooms/  promotions/
│           │   ├── amenities/  media/  gallery/  content/  faq/  policies/
│           │   ├── social-links/  consent/  analytics/  audit/  health/
│           ├── common/  config/  main.ts
├── packages/
│   ├── shared/                      # esquemas Zod, tipos, constantes (enums)
│   ├── eslint-config/
│   └── tsconfig/
├── assets-source/                   # IGNORADO por git: fotos originales del hotel
├── docs/
│   ├── adr/  brand/  research/
│   ├── assets/photo-inventory.md
│   └── pendientes-hotel.md
├── docker-compose.yml               # postgres, minio
├── .env.example
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

No crear paquetes compartidos artificiales ni abstracciones por anticipación.

### 13.2 Responsabilidad de los módulos backend

| Módulo | Responsabilidad |
|---|---|
| `auth` | Login, logout, sesiones, cambio de contraseña |
| `admin-users` | Datos y estado de administradores |
| `hotel` | Perfil del hotel: datos, contacto, ubicación, horarios, RNT, WhatsApp |
| `rooms` | Habitaciones, tarifas informativas, imágenes de habitación y publicación |
| `promotions` | Promociones con vigencia |
| `amenities` | Servicios y comodidades |
| `media` | Subida, validación, procesamiento, variantes y eliminación de archivos |
| `gallery` | Organización de imágenes públicas por categoría |
| `content` | Secciones editables de la landing |
| `faq` / `policies` | Preguntas frecuentes y políticas del hotel |
| `social-links` | Redes sociales |
| `consent` | Evidencia de consentimiento de cookies |
| `analytics` | Conteos agregados de interacción |
| `audit` | Registro de acciones administrativas |
| `health` | Estado del servicio y dependencias |

Cada módulo controla su lógica y expone servicios; ningún módulo accede directamente a tablas de otro. Capas (controller, service, repository, dto) proporcionales a la complejidad real.

---

## 14. Modelo de datos inicial

| Entidad | Propósito / campos clave |
|---|---|
| `AdminUser` | email (único), passwordHash, nombre, activo, último acceso |
| `Session` | hash del token, adminUserId, expiresAt, createdAt, lastSeenAt |
| `HotelProfile` | registro único: nombre, razón social, rntNumber, descripciones, logo/hero (FK MediaAsset), video hero opcional, dirección, municipio, departamento, lat/lng, mapsUrl, indicaciones, teléfono, whatsappNumber, correo, horarios (JSONB), checkInTime, checkOutTime |
| `WhatsAppTemplate` | key (general, room, promotion), texto con variables permitidas |
| `Room` | slug (único), nombre, tipo, descripciones, capacidad, camas (JSONB), areaM2 (Decimal), basePrice (Decimal 12,2, nullable), currency (`COP`), priceUnit (enum), taxesIncluded (bool), priceNotes, status (enum), sortOrder, seoTitle, seoDescription |
| `RoomSlugRedirect` | slug anterior → roomId (para 301) |
| `RoomImage` | roomId, mediaAssetId, sortOrder, isCover (una sola portada por habitación) |
| `Amenity` | nombre, descripción, icono/imagen, activo, sortOrder, showOnHome |
| `RoomAmenity` | relación habitación–servicio |
| `Promotion` | título, descripción, condiciones, startsAt, endsAt, roomId opcional, status |
| `MediaAsset` | storageKey, kind (IMAGE/VIDEO), mimeType validado, tamaño, ancho, alto, variants (JSONB), placeholder (blur/color dominante), altText, caption, status (UPLOADING/PROCESSING/READY/FAILED) |
| `GalleryItem` | mediaAssetId, categoría, sortOrder, publicado |
| `LandingSection` | key (enum único), título, subtítulo, cuerpo, etiqueta CTA, mediaAssetId, enabled |
| `Faq` | pregunta, respuesta, sortOrder, publicado, showOnHome |
| `HotelPolicy` | título, contenido, sortOrder, publicado |
| `SocialLink` | plataforma (enum), URL, sortOrder, activo |
| `ConsentRecord` | consentId aleatorio, categorías (JSONB), versión de política, fecha/hora (sin IP) |
| `AnalyticsDailyCount` | fecha, tipo, origen, entidad opcional, conteo (único compuesto) |
| `AuditLog` | adminUserId, acción, entidad, entityId, fecha, resumen sin datos sensibles |
| `PendingStorageDeletion` | storageKey, intentos, último error |

Consideraciones:

- Identificadores estables (UUID/CUID) y `slug` único para habitaciones.
- Estados como enums controlados.
- Fechas en UTC; mostrar en `America/Bogota`.
- `Decimal` para dinero; nunca `float`. Moneda explícita.
- Índices en campos de filtro/orden (`status`, `sortOrder`, `slug`, fechas de promociones).
- No guardar datos personales de visitantes sin finalidad y necesidad justificadas.
- Contraseñas solo como hash (Argon2id).

---

## 15. Imágenes del hotel, medios y seeds

El hotel entregará ~40 fotografías reales. Se usarán como **referencia de diseño** y como **contenido inicial**, siguiendo buenas prácticas.

### 15.1 Dónde viven las fotos originales

- **No se versionan en git.** Copiarlas en `assets-source/photos/` (carpeta incluida en `.gitignore`) o en un almacenamiento compartido del equipo.
- Solo se versionan en el repositorio los recursos de marca (logo, favicon, imagen OG por defecto) en `apps/web/public/brand/`.
- Confirmar con el hotel que las fotos están **autorizadas para publicación** y, si aparecen personas identificables, que exista su autorización.

### 15.2 Inventario de fotos (primer paso del agente)

Crear `docs/assets/photo-inventory.md` (o `assets-manifest.json` versionado, que no contiene las imágenes, solo metadatos):

| Campo | Ejemplo |
|---|---|
| Archivo | `IMG_0231.jpg` |
| Categoría | habitación / zonas comunes / exterior / gastronomía / entorno / detalle |
| Habitación asociada | "Habitación doble estándar" o vacío |
| Uso sugerido | hero, sobre nosotros, tarjeta, galería, OG |
| Orientación y resolución | horizontal 4032×3024 |
| Calidad | apta / requiere edición / descartar |
| Personas | sí/no (requiere autorización) |
| Texto alternativo propuesto | "Habitación doble con cama de madera y ventana hacia el jardín de bambú" |

Al final del inventario: **lista de fotos faltantes** (por ejemplo, fachada de día, baño de cada habitación, detalle de bambú, video corto para el hero) para pedirlas al hotel.

### 15.3 Procesamiento obligatorio

- **Eliminar metadatos EXIF**, en especial la geolocalización GPS de las fotos de celular.
- Corregir orientación, generar variantes responsive (por ejemplo 640, 960, 1280, 1920 px) en WebP/AVIF, más un placeholder (blur o color dominante).
- Validar tipo real del archivo (no solo extensión).
- Nombres internos aleatorios en el almacenamiento.

### 15.4 Estrategia de optimización

Elegir una (ADR):
- **A.** Variantes generadas en la subida con `sharp` en la API y servidas desde S3/CDN (control total, costo predecible).
- **B.** Proveedor con transformaciones al vuelo (Cloudinary/imgix) y `next/image` con su loader.
Evitar depender de la optimización de imágenes del hosting de Next.js sin revisar su costo y límites.

### 15.5 Seeds: qué se precarga y dónde

| Script | Entornos | Contenido |
|---|---|---|
| `db:seed:base` | Todos (idempotente) | `HotelProfile` vacío con marcadores, claves de `LandingSection`, plantillas de WhatsApp por defecto, catálogo de iconos permitidos. **Sin** contraseñas ni datos inventados. |
| `db:seed:demo` | Solo local y staging (bloqueado si `NODE_ENV=production` o si `APP_ENV=production`) | Habitaciones, servicios, galería, FAQ y políticas de ejemplo usando las **fotos reales** importadas desde `assets-source/` y textos marcados como `[DEMO]`. Si el hotel ya entregó la lista real de habitaciones, usar sus nombres y datos reales. |
| `admin:create` | Todos | Crea el administrador de forma interactiva o desde variables de entorno de un solo uso. Nunca credenciales por defecto. |
| `media:import` | Local/staging (y una vez en producción si se aprueba) | Lee `assets-source/photos` + manifiesto, procesa (15.3), sube al almacenamiento y crea `MediaAsset`. |

**Producción:** el contenido real se carga desde el panel (o con una importación única aprobada por el hotel usando el manifiesto). Nunca ejecutar `seed:demo` en producción. Esto permite diseñar y probar con contenido real desde el principio sin dejar archivos binarios ni datos falsos en el repositorio.

---

## 16. Seguridad: requisitos obligatorios

La seguridad se diseña desde el inicio. Referencia: OWASP ASVS (nivel 1 como mínimo; nivel 2 en autenticación y sesión).

### 16.1 Autenticación administrativa

- Sin registro público de administradores; primer administrador con `admin:create`.
- Hash con **Argon2id** (parámetros actuales recomendados por OWASP).
- Sesiones del lado del servidor con token opaco; guardar solo el hash del token.
- Mensajes de login genéricos (sin enumeración de usuarios); tiempos de respuesta similares.
- Bloqueo progresivo/rate limiting por IP y por cuenta.
- Cierre de sesión que invalida en servidor; rotación del identificador tras login y cambio de contraseña.
- Restablecimiento de contraseña solo con flujo seguro (token de un solo uso, expiración corta) si se implementa; en la primera versión puede hacerse con `admin:create`/script.
- Considerar 2FA (TOTP) como mejora posterior.

### 16.2 Sesiones y cookies

`HttpOnly`, `Secure`, `SameSite=Lax/Strict`, `Path` limitado, expiración absoluta e inactividad, invalidación al cerrar sesión, protección CSRF en escrituras. Nunca tokens de sesión en `localStorage`.

### 16.3 Rate limiting

En login, subida de archivos, endpoints de escritura, eventos de analítica, consentimientos y endpoints públicos abusables. Límites configurables por IP, usuario y operación; configurar correctamente `trustProxy` detrás del proxy; responder `429`.

### 16.4 Validación de entradas

Validar todo en backend; esquemas estrictos; longitudes máximas; URLs (solo `https`, dominios esperados para redes); números, fechas y moneda; rechazar campos inesperados; nunca SQL concatenado; texto enriquecido sanitizado; no renderizar HTML arbitrario (`dangerouslySetInnerHTML` prohibido salvo contenido sanitizado y justificado).

### 16.5 Seguridad de archivos

Solo JPEG, PNG, WebP (y MP4/WebM para video si se habilita); comprobar firma real; límites de tamaño y dimensiones; nombres aleatorios; almacenamiento fuera de la aplicación; sin ejecución; sin SVG subidos por usuarios (los SVG de marca se versionan en código); subida y borrado solo para administradores.

### 16.6 API e infraestructura

HTTPS obligatorio (HSTS), CORS con lista explícita (o innecesario con el proxy de 12.4), encabezados de seguridad (CSP con nonces cuando sea viable, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors`/anti-clickjacking, `Permissions-Policy`), sin stack traces en producción, secretos en variables de entorno o gestor de secretos, `.env` fuera del repositorio, permisos mínimos en base de datos y bucket, dependencias actualizadas (Dependabot/Renovate + `pnpm audit`), backups probados, entornos separados, Swagger deshabilitado o protegido en producción.

### 16.7 Ataques a contemplar

SQL injection, XSS, CSRF, clickjacking, fuerza bruta, abuso de endpoints, archivos maliciosos, exposición de secretos, acceso no autorizado, enumeración de usuarios, CORS inseguro, SSRF (no descargar URLs arbitrarias desde el servidor).

No existe seguridad absoluta: pruebas y revisiones periódicas.

---

## 17. Privacidad y cumplimiento legal en Colombia

> Guía de requisitos de producto, no concepto jurídico ni garantía de cumplimiento. El hotel debe revisar y aprobar los documentos legales y sus prácticas reales. Ante tratamientos complejos, publicidad o dudas, consultar a un profesional.

### 17.1 ¿El sitio trata datos personales?

Puede tratarlos aunque no haya formularios: IPs en registros técnicos, identificadores de cookies, datos de navegación, servicios de terceros (mapas, videos embebidos, fuentes externas). No afirmar que el sitio "no recopila ningún dato" sin revisar infraestructura y proveedores.

### 17.2 Marco normativo de referencia

- Ley 1581 de 2012 (régimen general de protección de datos).
- Decreto 1074 de 2015 (reglamentación compilada, incluido RNBD).
- Instrucciones y conceptos vigentes de la SIC.
- **Estado a noviembre de 2026:** hay proyectos de ley en el Congreso para reformar la Ley 1581 (radicados en 2025 y 2026). Antes de publicar, verificar si alguno fue aprobado y si cambia obligaciones.

### 17.3 Documentos y mecanismos

1. **Política de tratamiento de datos personales** (responsable, finalidades, categorías, derechos, procedimiento de consultas y reclamos, canales, vigencia).
2. **Aviso de privacidad** (breve, con enlace a la política).
3. **Autorización de tratamiento** cuando se recolecten datos y la ley lo exija: previa, informada, demostrable, sin casillas premarcadas, separando finalidades opcionales (publicidad).
4. **Canal de consultas y reclamos** definido por el hotel.
5. **Política de cookies** con inventario de tecnologías.

### 17.4 Abogado y RNBD

No hay obligación general de contratar abogado para redactar la política, pero debe corresponder a la operación real. El registro en el RNBD aplica a quienes cumplan los supuestos legales (entre ellos sociedades y entidades sin ánimo de lucro con activos totales superiores a 100.000 UVT y personas jurídicas de naturaleza pública). **No estar obligado al RNBD no exime de la Ley 1581.** El hotel normalmente es el responsable del tratamiento; los proveedores que procesen datos por su cuenta pueden ser encargados y deben revisarse contractualmente.

### 17.5 Cookies y gestor de consentimiento

**Categorías:** esenciales (siempre activas, explicadas), funcionales, analíticas y marketing (desactivadas hasta consentimiento).

**Comportamiento obligatorio:**

1. Banner en la primera visita con información breve y enlaces a política de cookies y de datos.
2. Botones equivalentes en jerarquía visual: **"Aceptar todas"**, **"Rechazar no esenciales"**, **"Configurar preferencias"**.
3. Preferencias por categoría (funcionales, analíticas, marketing).
4. No esenciales desactivadas por defecto.
5. Ningún script, píxel, SDK o llamada de seguimiento antes del consentimiento aplicable.
6. Rechazar no impide usar el sitio ni contactar.
7. Enlace persistente "Configurar cookies" en el footer.
8. Retirar/modificar el consentimiento detiene el seguimiento y elimina cookies propias no esenciales cuando corresponda.
9. Evidencia mínima (`ConsentRecord`): categorías, fecha/hora, versión de política e identificador aleatorio; sin IP ni perfilado.
10. Volver a preguntar ante cambios materiales (versión de la política).
11. Inventario documentado de cada cookie/tecnología (nombre, proveedor, categoría, finalidad, duración, propia/tercero, momento de activación).
12. No usar "anónimo" si los datos permiten singularizar.

**Terceros que pueden instalar cookies:** el **iframe de Google Maps** y videos embebidos (YouTube/Vimeo). Por defecto, mostrar una imagen estática del mapa con botón "Cargar mapa" (o cargarlo solo con consentimiento funcional) y siempre un enlace "Abrir en Google Maps". Videos propios servidos desde el almacenamiento del proyecto, no embebidos de terceros. Fuentes autoalojadas con `next/font`.

**Recomendación:** analítica proporcionada y solo con consentimiento; categoría de marketing preparada pero sin píxeles hasta que el hotel apruebe campañas, proveedores y finalidades. No enviar datos de WhatsApp a plataformas publicitarias. La Resolución 2893 de 2020 de la SIC contiene lineamientos de cookies para sus sujetos obligados; no asumir que todas sus reglas aplican idénticamente a un hotel privado, pero sí considerar la Ley 1581 y las instrucciones de la SIC.

### 17.6 Normativa turística y de consumo (nuevo)

- **Registro Nacional de Turismo (RNT) — campo opcional en el sistema:** el campo puede quedar vacío; si está vacío, el sitio no muestra nada ni deja espacios vacíos. Contexto para el hotel: la ley exige que los prestadores de servicios turísticos estén inscritos y que el número de RNT aparezca en toda su publicidad (Ley 1558 de 2012, art. 30). Un sitio web público cuenta como publicidad. Por eso, publicarlo o no es decisión y responsabilidad del hotel, no un requisito de desarrollo. Recomendación: configurarlo antes de publicar si el hotel está inscrito. Hay un proyecto de decreto de 2026 que refuerza su exhibición en sitios web; verificar su estado.
- **Código de conducta contra la explotación sexual de menores (Ley 1336 de 2009, Resolución 3840 de 2009):** el hotel lo exhibe físicamente en la recepción. Decisión del propietario (2026-11-09): no se muestra en el sitio ni se configura en el panel.
- **Precios (Estatuto del Consumidor, Ley 1480 de 2011):** el precio debe informarse en pesos colombianos incluyendo impuestos y costos adicionales. Publicar tarifas como precio total con impuestos ("desde $ X por noche, impuestos incluidos") o, si el hotel decide otra cosa, revisarlo con su asesor. Si aplican condiciones especiales (por ejemplo, tratamiento tributario para extranjeros no residentes), explicarlas en las notas de tarifa con el texto aprobado por el hotel.
- **Publicidad veraz:** fotos reales y actuales, servicios confirmados, promociones con condiciones y vigencia visibles.

### 17.7 WhatsApp y terceros

Informar que el contacto ocurre en WhatsApp (servicio externo con sus propias políticas); no afirmar control sobre esos datos; no almacenar conversaciones. Si luego se integra WhatsApp Business API o un CRM, revisar de nuevo finalidades, autorizaciones y contratos.

### 17.8 Lista de verificación legal antes de publicar

- [ ] Hotel identificado como responsable del tratamiento.
- [ ] Datos realmente tratados definidos; proveedores y encargados identificados.
- [ ] Política de tratamiento coherente con el funcionamiento real.
- [ ] Aviso de privacidad accesible y canal de consultas/reclamos.
- [ ] Autorización solicitada cuando corresponda.
- [ ] Finalidades y tiempos de conservación definidos.
- [ ] Revisado si aplica inscripción en RNBD.
- [ ] Cookies, mapas y herramientas de terceros revisados e inventariados.
- [ ] Contratos y condiciones de proveedores revisados.
- [ ] El hotel decidió si publica el número RNT (recomendado si aplica).
- [ ] Tarifas con impuestos incluidos o condiciones aprobadas.
- [ ] Estado de reformas a la Ley 1581 verificado.
- [ ] Documentos aprobados por el hotel.

---

## 18. UX/UI y accesibilidad

### 18.1 Experiencia de usuario

- Móvil primero en el sitio público.
- WhatsApp como acción principal, visible sin saturar (botón en header y CTA contextual; botón flotante solo si no tapa contenido).
- Encontrar habitaciones, precio orientativo, ubicación y políticas en pocos pasos.
- Estados de carga, error, vacío y éxito.
- Consistencia entre páginas; animaciones al servicio del contenido (sección 8).
- Navegación completa con teclado.

### 18.2 Panel administrativo

Navegación lateral clara; formularios agrupados; validación junto al campo; mensajes comprensibles; confirmación antes de eliminar; indicadores de estado (borrador, publicado, inactivo); previsualización de imágenes y del enlace de WhatsApp; aviso de cambios sin guardar; enlace "Ver en el sitio" tras publicar; diseño pensado para personal no técnico (textos de ayuda breves en cada campo).

### 18.3 Accesibilidad

Objetivo WCAG 2.2 AA: contraste suficiente, texto alternativo en imágenes relevantes, etiquetas en formularios, foco visible, navegación por teclado, jerarquía de encabezados, no depender solo del color, `prefers-reduced-motion`, pausa de contenido en movimiento, objetivos táctiles de al menos 24×24 px (idealmente 44×44), errores asociados a campos, idioma del documento (`lang="es-CO"`).

### 18.4 Responsive

Probar en móviles pequeños (360 px), estándar, tablets, portátiles y escritorio amplio. Sin desplazamiento horizontal; textos, imágenes, botones y navegación legibles.

---

## 19. SEO y visibilidad

La visibilidad en buscadores es parte central del objetivo.

### 19.1 SEO técnico

- `title` y `description` únicos por página (con valores por defecto generados y editables en habitaciones).
- URLs legibles en español (4.1); redirecciones 301 cuando cambian.
- Open Graph y Twitter Cards con imagen por página (habitaciones con su portada).
- `sitemap.xml` dinámico (incluye habitaciones publicadas con `lastModified`) y `robots.txt` (excluir `/admin` y `/api`).
- Canonical en todas las páginas; `noindex` en el panel y entornos de staging.
- Página 404 útil (enlaces a habitaciones y WhatsApp).
- Contenido renderizado en servidor e indexable aunque falle el JavaScript.
- Dominio propio y HTTPS.

### 19.2 Datos estructurados (JSON-LD)

- `Hotel` (subtipo de `LodgingBusiness`) en la home y ubicación: nombre, descripción, dirección (`PostalAddress`), `geo`, teléfono, URL, imágenes, `checkinTime`, `checkoutTime`, `amenityFeature` (`LocationFeatureSpecification`), `petsAllowed` si aplica, `priceRange` orientativo, `sameAs` (redes).
- `HotelRoom` en cada detalle de habitación (ocupación, camas, servicios).
- `BreadcrumbList` en páginas internas.
- `FAQPage` en preguntas frecuentes (útil para comprensión del contenido y asistentes de IA, aunque Google limita sus resultados enriquecidos a ciertos sitios).
- Solo información real y verificable; validar con la prueba de resultados enriquecidos y el validador de schema.org.
- Nota: el marcado no muestra por sí solo precios en Google Hoteles; eso requiere conexión con Google Hotel Center (fuera de alcance).

### 19.3 SEO local y contenido

- Nombre, dirección y teléfono idénticos en sitio, Google Business Profile y redes.
- Recomendar al hotel crear o actualizar su **Perfil de Empresa en Google** (fotos, horarios, categoría, enlace al sitio y a WhatsApp) y responder reseñas reales.
- Contenido útil con intención de búsqueda: página "Cómo llegar" (desde terminal, aeropuerto o vías principales), "Qué hacer cerca", preguntas frecuentes reales (parqueadero, mascotas, desayuno, Wi-Fi, check-in).
- Textos claros y factuales, fáciles de citar por buscadores y asistentes de IA.
- Prohibido: reseñas falsas, contenido engañoso, relleno de palabras clave.

### 19.4 Preparación para varios idiomas

Primera versión solo en español, pero: textos de interfaz en un diccionario (no incrustados en componentes), formateadores con locale, estructura de rutas que permita añadir `/en` después, y modelo de datos que pueda extenderse con tablas de traducción. Cuando se agregue inglés: `hreflang`, sitemap por idioma y contenido traducido por personas o revisado.

### 19.5 Expectativas

No garantizar posiciones en Google. El SEO mejora la indexación y comprensión del sitio; los resultados dependen de factores externos (competencia, reseñas, perfil de Google, enlaces).

---

## 20. Rendimiento y presupuestos

### 20.1 Objetivos (percentil 75, móvil)

- LCP ≤ 2,5 s · INP ≤ 200 ms · CLS ≤ 0,1.
- Lighthouse móvil en páginas públicas: Rendimiento ≥ 90, Accesibilidad ≥ 95, SEO ≥ 95 (referencia, no garantía).

### 20.2 Presupuestos (verificar en CI)

| Recurso | Presupuesto orientativo |
|---|---|
| JavaScript inicial por página pública | ≤ 170 KB comprimido (gzip/brotli) |
| Imagen LCP (poster/hero) | ≤ 200 KB en móvil (AVIF/WebP) |
| Video hero | ≤ 1,5 MB móvil / ≤ 4 MB escritorio, cargado después del LCP |
| Fuentes | ≤ 2 familias, subconjunto latino, `font-display: swap` |
| Librerías de animación | Cargadas solo en las secciones que las usan (import dinámico) |
| 3D (si existe) | Fuera de la carga inicial; solo cliente; con alternativa estática |

### 20.3 Prácticas

Formatos modernos y tamaños responsive; `priority`/`fetchpriority` solo en la imagen LCP; lazy loading del resto; placeholders para evitar CLS; dimensiones explícitas; código diferido para componentes pesados; caché pública; medición real (Vercel Analytics/Web Vitals propio o CrUX cuando haya tráfico, respetando consentimiento si aplica).

---

## 21. Caché y actualización de contenido

- Contenido público cacheado y etiquetado por tipo (`hotel`, `rooms`, `room:{slug}`, `gallery`, `content`, `faq`, `policies`, `social`, `promotions`).
- Tras cada mutación, la API llama a `POST /api/revalidate` de Next.js con un **secreto compartido** y las etiquetas afectadas; Next.js invalida con el mecanismo vigente en la versión instalada (por ejemplo, `revalidateTag`/`cacheTag`). Si la llamada falla, se reintenta y se registra el error.
- Las promociones con fecha de fin requieren revalidación programada o tiempo de vida acorde para que desaparezcan a tiempo.
- No cachear respuestas privadas del panel ni exponer información administrativa en cachés compartidas.
- Pruebas: publicar, despublicar, editar y eliminar una habitación debe reflejarse en el sitio en segundos.

---

## 22. Registro, monitoreo y mantenimiento

- Registro estructurado (JSON) de errores del backend con identificador de solicitud; sin contraseñas, tokens ni datos sensibles.
- Eventos de seguridad (logins fallidos, bloqueos, cambios de contraseña) y `AuditLog` de acciones administrativas.
- Endpoint `/api/v1/health` (aplicación, base de datos, almacenamiento).
- Monitoreo de disponibilidad y alertas para errores críticos (por ejemplo, Sentry o equivalente; revisar datos que envía).
- Backups automáticos de PostgreSQL y del bucket; **restauración probada** periódicamente; acceso restringido; retención definida.
- Procedimiento de incidentes y documentación de variables de entorno en `.env.example`.
- Tarea programada para limpiar archivos huérfanos (`PendingStorageDeletion`).

---

## 23. Pruebas y calidad

### 23.1 Funcionales

Información del hotel; solo contenido publicado; formato de tarifas e impuestos; promociones que expiran; enlace de WhatsApp (número y mensaje correctos, función unitaria probada); mapa bajo demanda; redes; CRUD de habitaciones, servicios, FAQ, políticas y medios; reflejo en el sitio tras publicar; acceso no autenticado bloqueado; estados vacíos y errores; redirección de slug.

### 23.2 Seguridad

Endpoints administrativos sin sesión; CSRF; límites de login; entradas inválidas; archivos no permitidos o con extensión falsa; cookies y encabezados; CORS; secretos expuestos; dependencias vulnerables; EXIF eliminado en imágenes publicadas.

### 23.3 Compatibilidad

Chrome, Firefox, Edge, Safari (macOS/iOS), Android (Chrome) en dispositivos de gama media.

### 23.4 Accesibilidad, rendimiento y movimiento

Lighthouse CI con presupuestos; axe en Playwright; navegación por teclado; contraste; pruebas E2E con `prefers-reduced-motion: reduce` (todo el contenido visible y usable); red lenta y CPU limitada; pruebas visuales de las secciones principales.

### 23.5 Herramientas

Vitest/Jest (unitarias e integración), Playwright (E2E y accesibilidad), base de datos de pruebas en Docker, CI con lint, typecheck, tests y build en cada PR.

---

## 24. Despliegue y ambientes

- **Local:** Docker Compose con PostgreSQL y MinIO; `seed:base` + `seed:demo` + `media:import`.
- **Staging:** igual a producción, `noindex`, datos demo o reales aprobados, acceso restringido.
- **Producción:** sitio real.

Definir: hosting de Next.js, hosting de NestJS (contenedor), PostgreSQL administrado con backups, almacenamiento de objetos + CDN, dominio y DNS, HTTPS, correo de contacto, monitoreo. Preferir regiones cercanas a Colombia cuando el proveedor lo permita (latencia) y revisar costos de transferencia de imágenes y video. No elegir proveedor solo por ser gratuito; revisar límites, backups, disponibilidad y condiciones.

---

## 25. Stack tecnológico consolidado

Versiones de referencia a noviembre de 2026; **verificar la última estable al instalar**.

| Capa | Tecnología | Referencia | Motivo |
|---|---|---|---|
| Lenguaje | TypeScript (estricto) | 5.x | Tipado en frontend y backend |
| Runtime | Node.js LTS | ≥ 20.9 (preferir LTS activa) | Requisito de Next.js y NestJS |
| Frontend | Next.js + App Router | 16.x | Landing, SEO y panel |
| UI | Tailwind CSS + shadcn/ui | Tailwind 4.x, CLI shadcn v4 | Tokens con `@theme`, componentes accesibles |
| Iconos | Lucide | — | Consistencia |
| Animación | GSAP + ScrollTrigger (+ SplitText), Lenis opcional, Motion solo si se necesita | GSAP 3.x, Lenis 1.3.x, Motion 12.x | Narrativa por scroll y microinteracciones |
| 3D (opcional) | Three.js / React Three Fiber | — | Solo si la Fase 0 lo justifica |
| Backend | NestJS + Fastify | Nest 11.x, `@nestjs/platform-fastify` ≥ 11.1.11, Fastify 5.x | Modularidad y rendimiento |
| API | REST + OpenAPI | — | Simple y documentable |
| Base de datos | PostgreSQL | 16+ | Relacional e integridad |
| ORM | Prisma | 7.x (evaluar mayor más reciente) | Tipado y migraciones |
| Validación | Zod compartido (recomendado) o class-validator en backend | — | Una sola fuente de reglas |
| Formularios | React Hook Form | — | Formularios del panel |
| Estado remoto | TanStack Query (si hace falta) | — | Mutaciones del panel |
| Imágenes | S3 compatible (+ sharp) o Cloudinary | — | Archivos fuera de la BD |
| Autenticación | Sesión de servidor en cookie HttpOnly + Argon2id | — | Protección del panel |
| Monorepo | pnpm workspaces + Turborepo | — | Organización |
| Contenedores | Docker | — | Entornos reproducibles |
| Pruebas | Vitest/Jest, Playwright, axe, Lighthouse CI | — | Calidad |

**¿Por qué no Astro?** Sería buena opción para una landing estática, pero sumar Astro (landing) y Next.js (panel) agrega otra aplicación y tecnología. Next.js cubre ambos.

**¿Por qué no microservicios?** Dominio acotado, equipo pequeño y volumen inicial bajo. Un monolito modular es más simple de desarrollar, probar, desplegar y mantener.

---

## 26. Priorización por fases

### Fase 0 — Investigación, identidad y dirección de arte

- Inventario de las fotos del hotel y lista de faltantes (15.2).
- Investigación de competencia, referentes y componentes (sección 7).
- Propuesta de logo, paleta y tipografía (sección 6).
- Dos direcciones de arte + especificación de movimiento.
- Decisión sobre los elementos opcionales de 2.3 (uso del video existente, scroll suave, 3D).
- **Salida:** dirección elegida y aprobada, tokens definidos, ADR de diseño.

### Fase 1 — Base del proyecto

Monorepo, Next.js, NestJS (Fastify), PostgreSQL + Prisma, Docker (Postgres + MinIO), variables de entorno, estructura modular, tokens de diseño en Tailwind, CI con lint/typecheck/tests/build.

### Fase 2 — Backend y administración

Modelo de datos y migraciones, seeds (`base`, `demo`), `admin:create`, autenticación y sesiones, módulos de hotel, habitaciones, promociones, servicios, medios (con procesamiento y EXIF), galería, contenido, FAQ, políticas, redes, auditoría, revalidación, panel administrativo.

### Fase 3 — Sitio público

Layout, header, hero (imagen/video), sobre nosotros, habitaciones y detalle, servicios, galería, ubicación y cómo llegar, FAQ, políticas, contacto, WhatsApp, footer (RNT, legal). Animaciones según la especificación aprobada, con movimiento reducido.

### Fase 4 — Calidad y cumplimiento

Seguridad, gestor de consentimiento, documentos legales, SEO técnico y datos estructurados, accesibilidad, presupuestos de rendimiento, pruebas funcionales, de seguridad y de movimiento, revisión de contenido real con el hotel.

### Fase 5 — Publicación

Dominio, HTTPS, hosting, base de datos y almacenamiento de producción, carga de contenido real, backups y restauración probada, monitoreo, Google Search Console, sitemap enviado, Perfil de Empresa en Google enlazado, entrega de credenciales, capacitación breve y guía de uso del panel (`docs/manual-panel.md`).

### Fase 6 — Mejoras opcionales

Estadísticas ampliadas, versión en inglés, 2FA, más secciones administrables, integraciones (WhatsApp Business API, motor de reservas/PMS), campañas con consentimiento.

---

## 27. Criterios de aceptación

**Diseño y experiencia**
- [ ] Identidad aprobada (logo, paleta, tipografía) aplicada mediante tokens.
- [ ] El sitio se ve y funciona bien en móvil, tablet y escritorio.
- [ ] Animaciones según la especificación, fluidas en móvil de gama media y desactivadas con movimiento reducido.
- [ ] El contenido es visible y usable sin JavaScript de animación.

**Contenido y panel**
- [ ] Información del hotel, habitaciones, promociones, servicios, galería, FAQ, políticas y redes editables desde el panel.
- [ ] Habitaciones se crean, editan, publican, ordenan y despublican; cambios visibles en el sitio en segundos.
- [ ] Imágenes se cargan, procesan (sin EXIF), ordenan y tienen texto alternativo.
- [ ] Tarifas en COP, informativas, con indicación de impuestos.
- [ ] WhatsApp abre con el número correcto y mensaje contextual.
- [ ] Mapa y enlace "Cómo llegar" funcionan.

**Seguridad**
- [ ] Login/logout funcionan; rutas y endpoints administrativos protegidos en backend.
- [ ] Validaciones críticas en backend; CSRF y rate limiting activos.
- [ ] Sin secretos en el repositorio; HTTPS en producción; encabezados de seguridad configurados.
- [ ] Backups con restauración probada.

**Legal y cumplimiento**
- [ ] Políticas y avisos corresponden al tratamiento real y están aprobados por el hotel.
- [ ] Gestor de cookies con aceptar, rechazar y configurar; no esenciales bloqueadas hasta consentimiento; modificable desde el footer; evidencia guardada.
- [ ] Si se configura el RNT, aparece en el footer; si no, no quedan bloques vacíos.

**SEO y rendimiento**
- [ ] Metadatos, sitemap, robots, canonical y datos estructurados válidos.
- [ ] Presupuestos de rendimiento cumplidos en CI; Core Web Vitals dentro de objetivos en pruebas de laboratorio.
- [ ] Flujos principales probados; sin errores críticos conocidos.

---

## 28. Decisiones pendientes

Confirmar con el hotel y el equipo antes o durante la Fase 0:

1. Nombre comercial, razón social y si se publicará el número RNT (opcional).
2. Fotografía del letrero (para muestrear el verde) y aprobación de logo, paleta y tipografía.
3. Dominio.
4. Cantidad, tipos y datos reales de habitaciones.
5. Tarifas a publicar, unidad, si incluyen impuestos y condiciones.
6. Servicios reales del establecimiento.
7. Número de WhatsApp y mensajes iniciales.
8. Dirección exacta, coordenadas, enlace de mapa e indicaciones de cómo llegar.
9. Políticas del hotel (check-in/out, mascotas, menores, cancelación, pagos).
10. Preguntas frecuentes reales.
11. Redes sociales oficiales.
12. Fotografías autorizadas, personas que aparecen y **fotos faltantes** (incluido video corto para el hero, si se quiere).
13. (Retirado 2026-11-09: el código de conducta contra la explotación sexual de menores se exhibe en la recepción, no en el sitio.)
14. Responsable del tratamiento de datos y correo para consultas de privacidad.
15. Proveedores de hosting, base de datos y almacenamiento.
16. Si se necesitan métricas, cuáles y si se miden solo con consentimiento.
17. Cookies o servicios de terceros a incorporar.
18. Quién administrará el panel y cómo se entregarán las credenciales.
19. Si se usa el video existente (habitación y entrada) y dónde: hero, detalle de habitación, galería o ninguno.
20. Municipio de referencia y lista de competidores locales para la investigación.

---

## 29. Referencias oficiales y documentación

### Protección de datos y turismo en Colombia

- [Ley 1581 de 2012 — Función Pública](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981)
- [Decreto 1074 de 2015 — disposiciones sobre RNBD](https://www.cancilleria.gov.co/sites/default/files/Normograma/docs/decreto_1074_2015_pr026.htm)
- [SIC — Obligación de registro en el RNBD](https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/concepto/cuales-personas-estan-obligadas-realizar-el-registro-de-bases-de-datos-personales-en-el-rnbd)
- [SIC — Documentación de cookies](https://sedeelectronica.sic.gov.co/transparencia/normativa/politicas-lineamientos-y-manuales/documentacion-de-cookies)
- [Ley 1336 de 2009 — Función Pública](https://www1.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=36877)
- [Resolución 3840 de 2009 — Código de conducta contra la explotación sexual de menores](https://www1.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=38492)
- [Registro Nacional de Turismo — Confecámaras](https://rnt.confecamaras.co/home)
- MinCIT — proyectos de decreto 2026 sobre el RNT (verificar estado en mincit.gov.co)

### Tecnologías

- [Next.js](https://nextjs.org/docs) · [NestJS](https://docs.nestjs.com/) · [Fastify](https://fastify.dev/docs/latest/)
- [PostgreSQL](https://www.postgresql.org/docs/) · [Prisma](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs) · [shadcn/ui](https://ui.shadcn.com/)
- [GSAP](https://gsap.com/docs/v3/) · [Lenis](https://github.com/darkroomengineering/lenis) · [Motion](https://motion.dev/)
- [React Bits](https://reactbits.dev/) · [Magic UI](https://magicui.design/) · [Aceternity UI](https://ui.aceternity.com/)
- [Schema.org Hotel](https://schema.org/Hotel) · [Google Search Central — datos estructurados](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) · [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) · [web.dev — Core Web Vitals](https://web.dev/articles/vitals)

### Inspiración

- [Awwwards](https://www.awwwards.com/) · [Godly](https://godly.website/) · [Land-book](https://land-book.com/) · [Lapa Ninja](https://www.lapa.ninja/) · [SiteInspire](https://www.siteinspire.com/) · [Codrops](https://tympanus.net/codrops/)

---

## 30. Principio rector del proyecto

La plataforma debe resolver una necesidad concreta: **hacer que el hotel sea visible, memorable, confiable y fácil de contactar en Internet, permitiendo que su propio personal mantenga la información actualizada sin depender del equipo de desarrollo.**

La experiencia visual debe estar a la altura del lugar —natural, cuidada, con movimiento que cuente su historia— sin sacrificar velocidad, accesibilidad ni claridad.

La solución debe ser modular, segura, mantenible y proporcional al tamaño real del negocio. No se agregan funcionalidades, efectos ni dependencias solo porque sean técnicamente posibles: cada decisión debe aportar valor al visitante, al administrador o al hotel.
