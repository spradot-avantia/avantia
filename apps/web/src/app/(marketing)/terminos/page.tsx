import type { Metadata } from "next";
import { LegalPage, Todo, type SeccionLegal } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Términos y condiciones | Avantia",
  description: "Términos y condiciones de uso de Avantia y del programa fundador (borrador).",
};

// Borrador V3 (2026-10-13), pendiente de revisión legal.
const SECCIONES: SeccionLegal[] = [
  {
    id: "t1",
    titulo: "1. Quiénes somos",
    cuerpo: (
      <>
        <p>Estos términos regulan el uso de la plataforma Avantia, ofrecida por Avantia Tecnología SpA, RUT 78.494.537-5, con domicilio en Gath y Chaves 2452, depto. 506, comuna de Providencia, Región Metropolitana de Santiago, Chile (en adelante, “Avantia”, “nosotros”).</p>
        <p>Al crear una cuenta o postular al programa fundador, aceptas estos términos y nuestra <a href="/privacidad">política de privacidad</a>.</p>
      </>
    ),
  },
  {
    id: "t2",
    titulo: "2. Qué es Avantia",
    cuerpo: (
      <>
        <p>Avantia es un software que permite a creadores de contenido, expertos y organizaciones (“Creadores”) publicar cursos online bajo su propia marca y dominio, y venderlos o entregarlos a sus alumnos.</p>
        <p>Avantia entrega la herramienta. El Creador decide qué enseña, a quién y en qué condiciones.</p>
      </>
    ),
  },
  {
    id: "t3",
    titulo: "3. Programa fundador",
    cuerpo: (
      <>
        <ul>
          <li>El programa fundador tiene cupos limitados (<Todo>[5]</Todo> en el primer grupo) y una duración de <Todo>[30]</Todo> días desde que tu academia queda activa.</li>
          <li>Es gratis. No pedimos tarjeta ni hacemos cobros automáticos al terminar.</li>
          <li>A cambio, te pedimos usar la plataforma y darnos tu opinión en las conversaciones que acordemos.</li>
          <li>Al terminar, puedes contratar un plan con el precio preferente para fundadores <Todo>[condiciones por definir]</Todo> o dejar de usar Avantia.</li>
          <li>Como el producto está en etapa temprana, algunas funciones pueden cambiar, fallar o retirarse durante el programa.</li>
          <li>Elegimos a los participantes según el ajuste con el programa. Postular no garantiza un cupo.</li>
        </ul>
      </>
    ),
  },
  {
    id: "t4",
    titulo: "4. Tu cuenta",
    cuerpo: (
      <>
        <ul>
          <li>Debes ser mayor de 18 años y entregar datos verdaderos.</li>
          <li>Eres responsable de cuidar tu contraseña y de lo que se haga desde tu cuenta.</li>
          <li>Si detectas un uso no autorizado, avísanos a <Todo>[correo de soporte]</Todo>.</li>
        </ul>
      </>
    ),
  },
  {
    id: "t5",
    titulo: "5. Tu contenido",
    cuerpo: (
      <>
        <p>Los cursos, videos, textos, marcas y demás material que subas siguen siendo tuyos. Nos otorgas una licencia limitada, no exclusiva y gratuita para alojarlos, procesarlos y mostrarlos a tus alumnos, solo para prestar el servicio y mientras tengas tu cuenta activa.</p>
        <p>Declaras que tienes los derechos sobre lo que publicas y que no infringe derechos de terceros. Podemos retirar contenido que infrinja la ley o estos términos, y te avisaremos cuando sea posible.</p>
        <p><Todo>[Pendiente: confirmar si el Creador podrá exportar sus cursos y los datos de sus alumnos al cerrar su cuenta.]</Todo></p>
      </>
    ),
  },
  {
    id: "t6",
    titulo: "6. Tu relación con tus alumnos",
    cuerpo: (
      <>
        <p>Cuando vendes o entregas un curso, la relación es entre tú y tu alumno. Tú defines precios, contenidos, condiciones de acceso y políticas de devolución, y respondes por ellas ante tus alumnos, incluida la Ley 19.496 de protección de los derechos de los consumidores cuando aplique.</p>
        <p>Respecto de los datos personales de tus alumnos, tú eres el responsable y Avantia actúa como encargado del tratamiento, según se detalla en la <a href="/privacidad#p7">política de privacidad</a>.</p>
        <p>Avantia no cobra comisión por las ventas de tus cursos. Tu academia emite la boleta o factura directamente a sus alumnos y es responsable de sus obligaciones tributarias.</p>
      </>
    ),
  },
  {
    id: "t7",
    titulo: "7. Uso permitido",
    cuerpo: (
      <>
        <p>No puedes usar Avantia para:</p>
        <ul>
          <li>Publicar contenido ilegal, engañoso, discriminatorio o que infrinja derechos de autor o marcas.</li>
          <li>Enviar spam o comunicaciones no solicitadas a tus alumnos o a terceros.</li>
          <li>Intentar acceder a cuentas o sistemas que no te pertenecen, o afectar el funcionamiento de la plataforma.</li>
          <li>Revender o copiar la plataforma sin nuestra autorización.</li>
        </ul>
      </>
    ),
  },
  {
    id: "t8",
    titulo: "8. Planes y pagos",
    cuerpo: (
      <>
        <p>Los planes pagados, sus precios y formas de pago se informarán antes de que decidas contratar. Nunca te cobraremos sin tu aceptación expresa.</p>
        <p><Todo>[Pendiente: planes, precios, medios de pago, periodicidad de cobro y política de reembolso.]</Todo></p>
      </>
    ),
  },
  {
    id: "t9",
    titulo: "9. Disponibilidad del servicio",
    cuerpo: (
      <>
        <p>Hacemos lo razonable para que Avantia funcione de forma continua y segura, pero no podemos garantizar que esté libre de interrupciones o errores, en especial durante el programa fundador. Te avisaremos con anticipación de mantenciones programadas cuando sea posible.</p>
      </>
    ),
  },
  {
    id: "t10",
    titulo: "10. Responsabilidad",
    cuerpo: (
      <>
        <p>Avantia no responde por el contenido que publican los Creadores ni por los acuerdos entre Creadores y alumnos. En la medida que la ley lo permita, nuestra responsabilidad total frente a ti se limita a <Todo>[monto o criterio a definir con asesoría legal]</Todo>.</p>
      </>
    ),
  },
  {
    id: "t11",
    titulo: "11. Término",
    cuerpo: (
      <>
        <ul>
          <li>Puedes cerrar tu cuenta en cualquier momento escribiéndonos o desde la configuración de tu academia.</li>
          <li>Podemos suspender o cerrar una cuenta que incumpla estos términos, avisándote el motivo cuando sea posible.</li>
          <li>Al cerrar la cuenta, eliminaremos tu contenido en un plazo de <Todo>[30]</Todo> días, salvo lo que debamos conservar por ley.</li>
        </ul>
      </>
    ),
  },
  {
    id: "t12",
    titulo: "12. Cambios a estos términos",
    cuerpo: (
      <>
        <p>Si cambiamos estos términos de forma importante, te avisaremos por correo al menos <Todo>[15]</Todo> días antes de que el cambio entre en vigencia. Si no estás de acuerdo, puedes cerrar tu cuenta antes de esa fecha.</p>
      </>
    ),
  },
  {
    id: "t13",
    titulo: "13. Ley aplicable y contacto",
    cuerpo: (
      <>
        <p>Estos términos se rigen por las leyes de la República de Chile. Cualquier controversia se someterá a los tribunales ordinarios de <Todo>[ciudad]</Todo>, sin perjuicio de los derechos que la ley de protección al consumidor te otorgue.</p>
        <p>Para cualquier consulta: <a href="mailto:contacto@goavantia.com">contacto@goavantia.com</a></p>
      </>
    ),
  },
];

const RESUMEN = [
  "Avantia te da las herramientas para tener tu propia academia online, con tu marca y tu dominio.",
  "Tus cursos son tuyos. Nos das solo el permiso necesario para mostrarlos a tus alumnos.",
  "Durante el programa fundador no cobramos ni pedimos tarjeta.",
  "Puedes dejar de usar Avantia cuando quieras.",
];

export default function TerminosPage() {
  return <LegalPage titulo="Términos y condiciones" actual="terminos" resumen={RESUMEN} secciones={SECCIONES} />;
}
