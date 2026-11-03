// Términos y privacidad que ve el alumno EN el sitio de su academia (ADR 019).
// La academia es la responsable de los datos del alumno; Avantia solo provee la
// plataforma (encargado de tratamiento). Texto base común a todas las academias,
// con el nombre de la academia: pendiente de revisión legal (backlog B-12).
import type { ReactNode } from "react";
import "./alumno.css";

const CONTACTO_PLATAFORMA = "contacto@goavantia.com";

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="al-stack" style={{ gap: "var(--av-space-2)" }}>
      <h2>{titulo}</h2>
      {children}
    </section>
  );
}

export function TerminosAcademia({ academia }: { academia: string }) {
  return (
    <article className="al-stack" style={{ maxWidth: "68ch" }}>
      <h1>Términos de uso de {academia}</h1>
      <p className="al-muted">Estos términos regulan tu cuenta y tu acceso a los cursos de {academia}.</p>
      <Seccion titulo="1. Quién te ofrece los cursos">
        <p>
          Los cursos, su contenido, su precio y la atención a los alumnos son responsabilidad de <strong>{academia}</strong> (en adelante, «la academia»). La
          academia usa la plataforma tecnológica de Avantia Tecnología SpA para operar su sitio; Avantia no vende ni dicta los cursos.
        </p>
      </Seccion>
      <Seccion titulo="2. Tu cuenta">
        <ul>
          <li>Tu cuenta es personal y es solo de {academia}: no se comparte con otras academias.</li>
          <li>Debes entregar datos verdaderos y mantener tu contraseña en reserva. Eres responsable de lo que ocurra con tu cuenta.</li>
          <li>La academia puede rechazar o cancelar una inscripción si no se cumplen las condiciones del curso.</li>
        </ul>
      </Seccion>
      <Seccion titulo="3. Inscripción y pago">
        <p>
          Algunas inscripciones quedan «pendientes» hasta que la academia las activa, por ejemplo al confirmar un pago. Las condiciones de precio, forma de
          pago, facturación y devoluciones las define y ejecuta la academia; consúltalas con ella antes de pagar.
        </p>
      </Seccion>
      <Seccion titulo="4. Uso del contenido">
        <p>
          El contenido de los cursos pertenece a la academia o a quienes lo crearon. Puedes usarlo para tu aprendizaje personal. No puedes copiarlo,
          revenderlo ni compartir tu acceso sin autorización escrita de la academia.
        </p>
      </Seccion>
      <Seccion titulo="5. Conducta">
        <p>No debes intentar acceder a cuentas ajenas, afectar el funcionamiento del sitio ni usarlo para fines ilícitos. Podemos suspender cuentas que lo hagan.</p>
      </Seccion>
      <Seccion titulo="6. Responsabilidad">
        <p>
          La academia es responsable del contenido y de los resultados de sus cursos. Avantia es responsable del funcionamiento técnico de la plataforma en los
          términos de su propio contrato con la academia.
        </p>
      </Seccion>
      <Seccion titulo="7. Cambios y contacto">
        <p>
          Podemos actualizar estos términos; si el cambio es relevante, te avisaremos. Para consultas sobre el curso, escríbele a la academia. Para temas
          técnicos de la plataforma: {CONTACTO_PLATAFORMA}.
        </p>
      </Seccion>
    </article>
  );
}

export function PrivacidadAcademia({ academia }: { academia: string }) {
  return (
    <article className="al-stack" style={{ maxWidth: "68ch" }}>
      <h1>Privacidad en {academia}</h1>
      <p className="al-muted">Cómo se tratan tus datos personales cuando creas una cuenta y tomas cursos aquí.</p>
      <Seccion titulo="1. Quién es responsable de tus datos">
        <p>
          <strong>{academia}</strong> es la responsable de los datos que entregas al crear tu cuenta y al tomar sus cursos: decide para qué se usan. Avantia
          Tecnología SpA actúa como <strong>encargada</strong>: los trata solo siguiendo las instrucciones de la academia y para que el sitio funcione.
        </p>
      </Seccion>
      <Seccion titulo="2. Qué datos tratamos">
        <ul>
          <li>Nombre y correo, y tu contraseña (guardada cifrada; nadie puede leerla).</li>
          <li>La fecha en que aceptaste los términos y la privacidad.</li>
          <li>Tus inscripciones, el medio y el monto de pago que la academia registre, y tu avance (lecciones completadas, XP, nivel).</li>
          <li>Datos técnicos mínimos para mantener tu sesión y la seguridad del sitio.</li>
        </ul>
      </Seccion>
      <Seccion titulo="3. Para qué se usan">
        <ul>
          <li>Crear y proteger tu cuenta, y enviarte los correos del servicio (confirmar tu correo, recuperar tu contraseña).</li>
          <li>Darte acceso a tus cursos y mostrarte tu avance.</li>
          <li>Que la academia gestione inscripciones y pagos, y vea el avance de sus alumnos para apoyarte.</li>
        </ul>
        <p>No vendemos tus datos ni los compartimos con otras academias.</p>
      </Seccion>
      <Seccion titulo="4. Con quién se comparten">
        <p>
          Con la academia (responsable) y con los proveedores que hacen posible el sitio: alojamiento, base de datos y envío de correo, que actúan por encargo y
          bajo confidencialidad. Si el pago se hace por una pasarela, esta tratará los datos de pago bajo sus propias condiciones.
        </p>
      </Seccion>
      <Seccion titulo="5. Cuánto tiempo">
        <p>Mientras tu cuenta exista o sea necesario para cumplir obligaciones legales. Puedes pedir que la eliminen.</p>
      </Seccion>
      <Seccion titulo="6. Tus derechos">
        <p>
          Puedes pedir acceso, rectificación, eliminación u oposición al tratamiento de tus datos. Escríbele a la academia por el medio que usó para atenderte. Si no
          recibes respuesta, escribe a {CONTACTO_PLATAFORMA} y la derivaremos a la academia.
        </p>
      </Seccion>
    </article>
  );
}
