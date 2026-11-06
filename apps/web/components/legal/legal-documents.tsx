import Link from 'next/link';
import { CookieSettingsButton } from '@/components/consent/consent-manager';
import { button } from '@/components/site/styles';
import { CONSENT_MAX_AGE_SECONDS, CONSENT_POLICY_VERSION } from '@/lib/consent/consent';
import { routes } from '@/lib/public/navigation';
import { fullAddress } from '@/lib/public/site';
import type { PublicHotel } from '@/lib/public/types';
import { Fill, LegalSection, type LegalTodo } from './legal-parts';

/**
 * Spanish templates for the legal documents (requirement 17.3), filled with the hotel profile.
 * Framework: Ley 1581 de 2012 and Decreto 1377 de 2013, compiled in Decreto Único 1074 de 2015
 * (Libro 2, Parte 2, Título 2, Capítulo 25). They are templates, not legal advice: the hotel and
 * a lawyer must review them (docs/legal-checklist.md). Never invent the controller's identity:
 * missing facts render as visible markers.
 */

export type LegalDocKey = 'tratamiento-de-datos' | 'aviso-de-privacidad' | 'cookies';

export interface LegalContext {
  hotel: PublicHotel;
  /** `LEGAL_EFFECTIVE_DATE` (YYYY-MM-DD), set when the hotel approves the texts. */
  effectiveDate: string | null;
}

const consentDays = Math.round(CONSENT_MAX_AGE_SECONDS / 86_400);

function controller(hotel: PublicHotel) {
  return {
    name: hotel.legalName,
    address: fullAddress(hotel),
    email: hotel.email,
    phone: hotel.phone ?? hotel.whatsappNumber,
  };
}

function formatDate(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

/** Missing facts, shown in the draft banner as TODO(hotel). */
export function legalTodos(doc: LegalDocKey, { hotel, effectiveDate }: LegalContext): LegalTodo[] {
  const c = controller(hotel);
  const todos: LegalTodo[] = [];
  const where = 'Panel › Datos del hotel';
  if (!c.name) todos.push({ label: 'razón social y NIT del responsable del tratamiento', where });
  if (!c.address) todos.push({ label: 'domicilio (dirección, municipio, departamento)', where });
  if (!c.email) todos.push({ label: 'correo para consultas y reclamos', where });
  if (!c.phone) todos.push({ label: 'teléfono de contacto', where });
  if (!formatDate(effectiveDate)) {
    todos.push({ label: 'fecha de entrada en vigencia', where: 'variable LEGAL_EFFECTIVE_DATE' });
  }
  if (doc !== 'aviso-de-privacidad') {
    todos.push({
      label: 'confirmar finalidades, plazos de conservación y proveedores (encargados) reales',
      where: 'revisión con el asesor legal',
    });
  }
  if (doc === 'cookies') {
    todos.push({
      label:
        'confirmar las cookies del proveedor de CDN/seguridad en producción (p. ej. Cloudflare)',
      where: 'revisión técnica antes de publicar',
    });
  }
  return todos;
}

function Responsible({ hotel }: { hotel: PublicHotel }) {
  const c = controller(hotel);
  return (
    <ul>
      <li>
        <strong>Responsable:</strong> <Fill value={c.name} label="razón social y NIT" />, que opera
        el establecimiento {hotel.name} (en adelante, «el Hotel»).
      </li>
      <li>
        <strong>Domicilio:</strong> <Fill value={c.address} label="dirección" />, Colombia.
      </li>
      <li>
        <strong>Correo electrónico:</strong> <Fill value={c.email} label="correo de contacto" />
      </li>
      <li>
        <strong>Teléfono:</strong> <Fill value={c.phone} label="teléfono" />
      </li>
    </ul>
  );
}

function Effective({ effectiveDate }: { effectiveDate: string | null }) {
  return (
    <p>
      Este documento rige desde el{' '}
      <Fill value={formatDate(effectiveDate)} label="fecha de vigencia" /> y se mantendrá vigente
      mientras el Hotel trate los datos para las finalidades descritas. Los cambios sustanciales se
      informarán en este sitio antes de aplicarse.
    </p>
  );
}

function DataPolicy({ hotel, effectiveDate }: LegalContext) {
  const c = controller(hotel);
  return (
    <>
      <p>
        Esta política explica cómo el Hotel recolecta, usa, almacena y protege los datos personales,
        en cumplimiento de la Ley Estatutaria 1581 de 2012, el Decreto 1377 de 2013 (hoy compilado
        en el Decreto Único Reglamentario 1074 de 2015) y las instrucciones de la Superintendencia
        de Industria y Comercio (SIC).
      </p>

      <LegalSection id="responsable" title="1. Responsable del tratamiento">
        <Responsible hotel={hotel} />
      </LegalSection>

      <LegalSection id="datos" title="2. Datos que tratamos">
        <ul>
          <li>
            <strong>Visitantes del sitio web:</strong> el sitio no tiene formularios ni cuentas de
            usuario. Los registros técnicos del servidor y del proveedor de infraestructura pueden
            incluir la dirección IP y el navegador por razones de seguridad y operación. Si aceptas
            las cookies analíticas, solo contamos totales diarios de visitas y clics (por ejemplo,
            «3 clics en WhatsApp desde la página de habitaciones»), sin identificarte.
          </li>
          <li>
            <strong>Evidencia de consentimiento de cookies:</strong> un identificador aleatorio, las
            categorías elegidas, la versión de la política y la fecha. No guardamos la IP.
          </li>
          <li>
            <strong>Personas que nos escriben por WhatsApp, teléfono o correo:</strong> nombre,
            número de teléfono, fechas de estadía y demás información que decidas compartir para
            atender tu solicitud.
          </li>
          <li>
            <strong>Huéspedes:</strong> los datos que exige el registro hotelero y la normativa
            migratoria y tributaria aplicable, cuando te alojas en el Hotel.
          </li>
        </ul>
        <p>
          No solicitamos datos sensibles ni datos de niñas, niños y adolescentes a través del sitio.
          Cuando la ley lo exija para el registro de huéspedes menores de edad, se tratarán
          respetando su interés superior y con autorización de su representante legal.
        </p>
      </LegalSection>

      <LegalSection id="finalidades" title="3. Finalidades">
        <ul>
          <li>Responder consultas sobre disponibilidad, tarifas y servicios.</li>
          <li>
            Gestionar reservas, el registro de huéspedes y la prestación del servicio de
            alojamiento.
          </li>
          <li>Cumplir obligaciones legales, contables, tributarias y migratorias.</li>
          <li>Mantener la seguridad y el funcionamiento del sitio web.</li>
          <li>Medir de forma agregada el uso del sitio, solo con tu consentimiento.</li>
        </ul>
        <p>
          El Hotel no vende datos personales ni los usa para publicidad. Si en el futuro quisiera
          enviar comunicaciones comerciales, pedirá una autorización separada y opcional.
        </p>
      </LegalSection>

      <LegalSection id="autorizacion" title="4. Autorización">
        <p>
          Tratamos tus datos con tu autorización previa, expresa e informada, que puede obtenerse
          por escrito, de forma oral o mediante conductas inequívocas (por ejemplo, escribirnos por
          WhatsApp para pedir información), salvo en los casos en que la ley no la exige.
          Conservamos prueba de la autorización cuando corresponde.
        </p>
      </LegalSection>

      <LegalSection id="derechos" title="5. Tus derechos">
        <p>Como titular de los datos puedes, de forma gratuita:</p>
        <ul>
          <li>Conocer, actualizar y rectificar tus datos.</li>
          <li>Solicitar prueba de la autorización otorgada.</li>
          <li>Ser informado sobre el uso que se ha dado a tus datos.</li>
          <li>
            Presentar quejas ante la Superintendencia de Industria y Comercio, después de agotar el
            trámite de consulta o reclamo ante el Hotel.
          </li>
          <li>
            Revocar la autorización y pedir la supresión de tus datos cuando no exista un deber
            legal o contractual de conservarlos.
          </li>
          <li>Acceder a tus datos personales que hayan sido objeto de tratamiento.</li>
        </ul>
      </LegalSection>

      <LegalSection id="procedimiento" title="6. Consultas y reclamos">
        <p>
          Escríbenos a <Fill value={c.email} label="correo de contacto" /> o comunícate al{' '}
          <Fill value={c.phone} label="teléfono" />, indicando tu nombre, tu documento de identidad,
          la descripción de tu solicitud y un medio de respuesta.
        </p>
        <ul>
          <li>
            <strong>Consultas:</strong> respondemos en un máximo de diez (10) días hábiles. Si no es
            posible, te informaremos el motivo y responderemos en los cinco (5) días hábiles
            siguientes.
          </li>
          <li>
            <strong>Reclamos</strong> (corrección, actualización, supresión o incumplimiento):
            respondemos en un máximo de quince (15) días hábiles, prorrogables hasta ocho (8) días
            hábiles más, informándote el motivo. Si el reclamo está incompleto, te pediremos
            completarlo dentro de los cinco (5) días siguientes; si pasan dos (2) meses sin
            respuesta, se entenderá que desististe.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="seguridad" title="7. Seguridad, conservación y encargados">
        <p>
          Aplicamos medidas técnicas y administrativas razonables: conexiones cifradas, acceso
          restringido al panel administrativo, contraseñas protegidas y registros de auditoría.
          Conservamos los datos solo durante el tiempo necesario para las finalidades descritas y
          para cumplir obligaciones legales. Los totales analíticos se conservan agregados hasta 24
          meses.
        </p>
        <p>
          Algunos proveedores tratan datos por cuenta del Hotel (encargados), por ejemplo, el
          alojamiento del sitio, la red de distribución de contenidos y el almacenamiento de
          imágenes. Las conversaciones de WhatsApp ocurren en un servicio de Meta con sus propias
          políticas; el Hotel no controla esa plataforma ni almacena las conversaciones en este
          sitio.
        </p>
      </LegalSection>

      <LegalSection id="vigencia" title="8. Vigencia y cambios">
        <Effective effectiveDate={effectiveDate} />
        <p>
          Consulta también el <Link href={routes.legalPrivacy}>aviso de privacidad</Link> y la{' '}
          <Link href={routes.legalCookies}>política de cookies</Link>.
        </p>
      </LegalSection>
    </>
  );
}

function PrivacyNotice({ hotel, effectiveDate }: LegalContext) {
  const c = controller(hotel);
  return (
    <>
      <LegalSection id="responsable" title="Responsable del tratamiento">
        <Responsible hotel={hotel} />
      </LegalSection>
      <LegalSection id="tratamiento" title="Tratamiento y finalidades">
        <p>
          El Hotel trata los datos personales que le compartes (por ejemplo, por WhatsApp, teléfono
          o correo) para responder tus consultas, gestionar reservas y el registro de huéspedes,
          cumplir obligaciones legales y mantener la seguridad del sitio. Con tu consentimiento,
          mide el uso del sitio solo como totales diarios, sin identificarte.
        </p>
      </LegalSection>
      <LegalSection id="derechos" title="Tus derechos">
        <p>
          Puedes conocer, actualizar, rectificar y suprimir tus datos, solicitar prueba de la
          autorización, revocarla y presentar quejas ante la Superintendencia de Industria y
          Comercio. Escríbenos a <Fill value={c.email} label="correo de contacto" />.
        </p>
      </LegalSection>
      <LegalSection id="politica" title="Política de tratamiento">
        <p>
          Consulta la{' '}
          <Link href={routes.legalData}>política de tratamiento de datos personales</Link>, que
          describe el procedimiento y los plazos para consultas y reclamos.
        </p>
        <Effective effectiveDate={effectiveDate} />
      </LegalSection>
    </>
  );
}

interface CookieRow {
  name: string;
  provider: string;
  category: string;
  purpose: string;
  duration: string;
  party: string;
  when: string;
}

const COOKIE_ROWS: CookieRow[] = [
  {
    name: 'hb_consent',
    provider: 'El Hotel',
    category: 'Necesaria',
    purpose: 'Guarda tu decisión sobre cookies y la versión de esta política.',
    duration: `${consentDays} días`,
    party: 'Propia',
    when: 'Al aceptar, rechazar o guardar preferencias.',
  },
  {
    name: 'hb_session / __Host-hb_session',
    provider: 'El Hotel',
    category: 'Necesaria',
    purpose: 'Sesión del personal del hotel en el panel administrativo. No se usa con visitantes.',
    duration: 'Hasta 12 horas',
    party: 'Propia',
    when: 'Solo al iniciar sesión en /admin.',
  },
  {
    name: 'hb_csrf',
    provider: 'El Hotel',
    category: 'Necesaria',
    purpose: 'Protege los formularios del panel administrativo contra solicitudes falsificadas.',
    duration: 'Hasta 12 horas',
    party: 'Propia',
    when: 'Solo al iniciar sesión en /admin.',
  },
  {
    name: 'Mapa de Google Maps',
    provider: 'Google LLC',
    category: 'Funcional',
    purpose: 'Muestra el mapa interactivo. Google puede instalar sus propias cookies.',
    duration: 'Según la política de Google',
    party: 'Tercero',
    when: 'Solo si aceptas las funcionales o pulsas «Cargar mapa».',
  },
  {
    name: 'Contador de visitas (sin cookie)',
    provider: 'El Hotel',
    category: 'Analítica',
    purpose:
      'Envía el tipo de evento (visita, clic en WhatsApp o en el mapa) y la sección; se guardan totales diarios.',
    duration: 'No instala cookies; totales hasta 24 meses',
    party: 'Propia',
    when: 'Solo si aceptas las analíticas.',
  },
];

function CookiePolicy({ hotel, effectiveDate }: LegalContext) {
  return (
    <>
      <p>
        Las cookies son pequeños archivos que un sitio guarda en tu navegador. Este sitio usa el
        mínimo posible: no usamos publicidad, píxeles de redes sociales ni herramientas de analítica
        de terceros. Las fuentes y las imágenes se sirven desde nuestra propia infraestructura.
      </p>

      <LegalSection id="categorias" title="Categorías">
        <ul>
          <li>
            <strong>Necesarias:</strong> siempre activas; permiten recordar tu decisión y proteger
            el panel administrativo.
          </li>
          <li>
            <strong>Funcionales:</strong> desactivadas por defecto; cargan el mapa de Google.
          </li>
          <li>
            <strong>Analíticas:</strong> desactivadas por defecto; habilitan el contador agregado de
            visitas, que no usa cookies ni identificadores persistentes.
          </li>
          <li>
            <strong>Marketing:</strong> no se usan. Si el hotel las incorporara, se te pediría un
            nuevo consentimiento.
          </li>
        </ul>
        <p>
          Rechazar las cookies no esenciales no te impide usar el sitio ni contactar al Hotel. El
          enlace «Cómo llegar» a Google Maps siempre está disponible.
        </p>
      </LegalSection>

      <LegalSection id="inventario" title="Inventario">
        <div
          className="overflow-x-auto"
          role="region"
          aria-label="Inventario de cookies (desplazable)"
          tabIndex={0}
        >
          <table className="legal-table">
            <caption className="sr-only">Cookies y tecnologías usadas por el sitio</caption>
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Proveedor</th>
                <th scope="col">Categoría</th>
                <th scope="col">Finalidad</th>
                <th scope="col">Duración</th>
                <th scope="col">Propia / tercero</th>
                <th scope="col">Cuándo se activa</th>
              </tr>
            </thead>
            <tbody>
              {COOKIE_ROWS.map((row) => (
                <tr key={row.name}>
                  <th scope="row">{row.name}</th>
                  <td>{row.provider === 'El Hotel' ? hotel.name : row.provider}</td>
                  <td>{row.category}</td>
                  <td>{row.purpose}</td>
                  <td>{row.duration}</td>
                  <td>{row.party}</td>
                  <td>{row.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection id="configurar" title="Cambiar o retirar tu consentimiento">
        <p>
          Puedes cambiar tu decisión en cualquier momento desde «Configurar cookies» (también en el
          pie de página). Si retiras un consentimiento, dejamos de enviar los eventos analíticos y
          el mapa deja de cargarse. Para borrar las cookies que Google haya instalado, usa la
          configuración de tu navegador. Volveremos a preguntarte si esta política cambia de forma
          relevante (versión actual: {CONSENT_POLICY_VERSION}).
        </p>
        <p>
          <CookieSettingsButton className={`${button.outline} mt-2`} />
        </p>
        <Effective effectiveDate={effectiveDate} />
        <p>
          Más información en la{' '}
          <Link href={routes.legalData}>política de tratamiento de datos</Link>.
        </p>
      </LegalSection>
    </>
  );
}

export function LegalDocument({ doc, context }: { doc: LegalDocKey; context: LegalContext }) {
  if (doc === 'tratamiento-de-datos') return <DataPolicy {...context} />;
  if (doc === 'aviso-de-privacidad') return <PrivacyNotice {...context} />;
  return <CookiePolicy {...context} />;
}
