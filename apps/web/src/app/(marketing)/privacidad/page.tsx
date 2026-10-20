import type { Metadata } from "next";
import { LegalPage, Todo, type SeccionLegal } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Política de privacidad | Avantia",
  description: "Cómo Avantia trata los datos de creadores, postulantes y alumnos (borrador).",
};

// Borrador V3 (2026-10-13), pendiente de revisión legal.
const SECCIONES: SeccionLegal[] = [
  {
    id: "p1",
    titulo: "1. Quién es responsable",
    cuerpo: (
      <>
        <p>El responsable de los datos que nos entregas como Creador o postulante es Avantia Tecnología SpA, RUT 78.494.537-5, con domicilio en Gath y Chaves 2452, depto. 506, comuna de Providencia, Región Metropolitana de Santiago, Chile.</p>
        <p>Tratamos los datos según la Ley 19.628 sobre protección de la vida privada y nos estamos preparando para la Ley 21.719, que la reemplaza al entrar en vigencia. <Todo>[Verificar con asesoría legal la fecha de vigencia y los ajustes necesarios.]</Todo></p>
      </>
    ),
  },
  {
    id: "p2",
    titulo: "2. Qué datos recopilamos",
    cuerpo: (
      <>
        <ul>
          <li><b>Cuando postulas o creas tu cuenta:</b> nombre, correo, teléfono si lo entregas, el tema de tus cursos y lo que nos cuentes en el formulario.</li>
          <li><b>Cuando configuras tu academia:</b> nombre de la academia, logo, colores, dominio y datos de facturación <Todo>[cuando existan planes pagados]</Todo>.</li>
          <li><b>Cuando usas la plataforma:</b> datos técnicos como dirección IP, navegador, dispositivo y páginas visitadas, para que el servicio funcione y para mejorarlo.</li>
          <li><b>Cuando conversamos contigo:</b> notas de las sesiones del programa fundador y tus comentarios sobre el producto.</li>
        </ul>
      </>
    ),
  },
  {
    id: "p3",
    titulo: "3. Para qué los usamos",
    cuerpo: (
      <>
        <ul>
          <li>Revisar tu postulación y contactarte.</li>
          <li>Crear y mantener tu cuenta y tu academia.</li>
          <li>Darte soporte y acompañamiento durante el programa fundador.</li>
          <li>Mejorar Avantia a partir de cómo se usa y de tus comentarios.</li>
          <li>Enviarte información sobre Avantia. Puedes darte de baja en cualquier momento desde el enlace en cada correo.</li>
          <li>Cumplir obligaciones legales y tributarias.</li>
        </ul>
      </>
    ),
  },
  {
    id: "p4",
    titulo: "4. Base legal",
    cuerpo: (
      <>
        <p>Tratamos tus datos porque nos diste tu consentimiento al postular o crear tu cuenta, porque son necesarios para prestarte el servicio que pediste, o porque la ley nos obliga. Puedes retirar tu consentimiento cuando quieras, sin efecto retroactivo.</p>
      </>
    ),
  },
  {
    id: "p5",
    titulo: "5. Con quién los compartimos",
    cuerpo: (
      <>
        <p>No vendemos ni arrendamos datos personales. Solo los compartimos con proveedores que nos ayudan a operar la plataforma y que están obligados a protegerlos:</p>
        <ul>
          <li>Alojamiento y base de datos: <Todo>[p. ej. Supabase, Vercel, Cloudflare: confirmar]</Todo></li>
          <li>Envío de correos: <Todo>[proveedor]</Todo></li>
          <li>Pagos: <Todo>[proveedor, cuando existan planes pagados]</Todo></li>
          <li>Analítica: <Todo>[proveedor o ninguno]</Todo></li>
        </ul>
        <p>También podemos entregar datos cuando una autoridad competente lo exija conforme a la ley.</p>
      </>
    ),
  },
  {
    id: "p6",
    titulo: "6. Transferencias fuera de Chile",
    cuerpo: (
      <>
        <p>Algunos de nuestros proveedores guardan datos en servidores fuera de Chile <Todo>[indicar países]</Todo>. En esos casos exigimos medidas de seguridad y confidencialidad equivalentes a las de esta política.</p>
      </>
    ),
  },
  {
    id: "p7",
    titulo: "7. Datos de los alumnos de tu academia",
    cuerpo: (
      <>
        <p>Cuando tus alumnos se inscriben en tu academia, tú eres el responsable de sus datos y Avantia actúa como encargado: los tratamos solo según tus instrucciones y para que tu academia funcione.</p>
        <ul>
          <li>No usamos los datos de tus alumnos para nuestro propio marketing ni los compartimos con otros Creadores.</li>
          <li>Tú debes informar a tus alumnos cómo usas sus datos. <Todo>[Pendiente: ofrecer una plantilla de política de privacidad para las academias.]</Todo></li>
          <li><Todo>[Pendiente: confirmar si el Creador podrá exportar los datos de sus alumnos.]</Todo></li>
        </ul>
      </>
    ),
  },
  {
    id: "p8",
    titulo: "8. Cuánto tiempo los guardamos",
    cuerpo: (
      <>
        <ul>
          <li>Postulaciones no seleccionadas: hasta <Todo>[12 meses]</Todo>, para avisarte cuando se abra un nuevo grupo, salvo que nos pidas borrarlas antes.</li>
          <li>Datos de tu cuenta: mientras esté activa y hasta <Todo>[30 días]</Todo> después de cerrarla.</li>
          <li>Datos de facturación: el plazo que exija la ley tributaria.</li>
        </ul>
      </>
    ),
  },
  {
    id: "p9",
    titulo: "9. Tus derechos",
    cuerpo: (
      <>
        <p>Puedes pedirnos en cualquier momento:</p>
        <ul>
          <li>Acceder a los datos que tenemos sobre ti.</li>
          <li>Corregir datos inexactos o incompletos.</li>
          <li>Eliminar tus datos.</li>
          <li>Oponerte a que los usemos para ciertos fines, como el envío de información comercial.</li>
          <li>Recibir tus datos en un formato que puedas llevar a otro servicio (portabilidad).</li>
        </ul>
        <p>Escríbenos a <Todo>[correo de privacidad]</Todo>. Te responderemos en un plazo máximo de <Todo>[días hábiles según la ley]</Todo>. Si no quedas conforme, puedes recurrir a la autoridad de protección de datos que corresponda.</p>
      </>
    ),
  },
  {
    id: "p10",
    titulo: "10. Seguridad",
    cuerpo: (
      <>
        <p>Usamos medidas técnicas y organizativas razonables para proteger tus datos, como conexiones cifradas, control de acceso y respaldos. Ningún sistema es completamente seguro; si ocurre un incidente que afecte tus datos, te avisaremos sin demora indebida.</p>
      </>
    ),
  },
  {
    id: "p11",
    titulo: "11. Cookies",
    cuerpo: (
      <>
        <p>Usamos cookies necesarias para que el sitio funcione y <Todo>[cookies de analítica, si se usan]</Todo>. Puedes bloquearlas desde tu navegador, aunque algunas funciones podrían dejar de operar.</p>
      </>
    ),
  },
  {
    id: "p12",
    titulo: "12. Menores de edad",
    cuerpo: (
      <>
        <p>Las cuentas de Creador son solo para mayores de 18 años. Si una academia está dirigida a menores, el Creador debe obtener la autorización de sus padres o tutores antes de inscribirlos.</p>
      </>
    ),
  },
  {
    id: "p13",
    titulo: "13. Cambios y contacto",
    cuerpo: (
      <>
        <p>Si cambiamos esta política de forma importante, te avisaremos por correo antes de que el cambio entre en vigencia.</p>
        <p>Para cualquier consulta sobre privacidad: <Todo>[correo de privacidad]</Todo> o <a href="mailto:contacto@goavantia.com">contacto@goavantia.com</a>. También puedes revisar nuestros <a href="/terminos">términos y condiciones</a>.</p>
      </>
    ),
  },
];

const RESUMEN = [
  "Pedimos solo los datos que necesitamos para darte el servicio y contactarte.",
  "No vendemos tus datos ni los de tus alumnos.",
  "Los datos de tus alumnos son tuyos: nosotros solo los procesamos para que tu academia funcione.",
  "Puedes pedirnos ver, corregir o borrar tus datos cuando quieras.",
];

export default function PrivacidadPage() {
  return <LegalPage titulo="Política de privacidad" actual="privacidad" resumen={RESUMEN} secciones={SECCIONES} />;
}
