import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantPublico } from "../../../../../../lib/alumno/contexto";
import { cargarCurso } from "../../../../../../lib/alumno/catalogo";
import { inscripcionesDe } from "../../../../../../lib/alumno/inscripciones";
import { getAlumnoActual } from "../../../../../../lib/alumno/sesion";
import { acreditarPago } from "../../../../../../lib/pagos/acreditar";
import { pagosHabilitados } from "../../../../../../lib/pagos/habilitados";
import { esUuid, mensajeRechazo } from "../../../../../../lib/pagos/reglas";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Estado del pago", robots: { index: false } };

type Busqueda = { payment_id?: string; collection_id?: string; external_reference?: string };

/**
 * Vuelta desde el checkout de Mercado Pago (ADR 046). No confía en el "status" del
 * query: consulta el pago a Mercado Pago y acredita (idempotente, igual que el webhook).
 * Solo muestra el resultado si el pago es de esta academia y de este alumno.
 */
export default async function RetornoPagoPage({ searchParams }: { searchParams: Busqueda }) {
  // Sin pasarela (producción hoy: el pago se coordina por fuera) esta página no existe.
  if (!pagosHabilitados()) notFound();
  const tenant = await getTenantPublico();
  if (!tenant) notFound();
  const alumno = await getAlumnoActual();
  if (!alumno) {
    return (
      <Marco titulo="Ingresa para ver tu pago">
        <p className="al-muted">Tu sesión se cerró. Ingresa con tu cuenta y encontrarás el curso en «Mis cursos».</p>
        <Link className="al-btn" href="/ingresar?next=/mis-cursos">
          Ingresar
        </Link>
      </Marco>
    );
  }

  const paymentId = String(searchParams.payment_id ?? searchParams.collection_id ?? "").slice(0, 32);
  const r = paymentId && paymentId !== "null" ? await acreditarPago(paymentId) : null;
  const propio = r && r.estado !== "invalido" && r.tenantId === tenant.id && r.alumnoId === alumno.id;

  if (propio && r.estado === "aprobado") {
    return (
      <Marco titulo="¡Pago aprobado!">
        <p className="al-alert al-alert--ok" role="status">
          Tu inscripción quedó activa. Ya puedes empezar.
        </p>
        <Link className="al-btn al-btn--block" href={`/aprender/${r.cursoId}`}>
          Ir al curso
        </Link>
      </Marco>
    );
  }
  if (propio && r.estado === "pendiente") {
    return (
      <Marco titulo="Tu pago está en proceso">
        <p className="al-muted">Mercado Pago aún no lo confirma. Cuando se apruebe, el curso se abrirá solo en «Mis cursos».</p>
        <Link className="al-btn al-btn--sec" href="/mis-cursos">
          Ir a mis cursos
        </Link>
      </Marco>
    );
  }
  // Rechazado o sin pago (volvió sin pagar): ofrecer reintentar desde la ficha del curso.
  // El curso sale del pago consultado o de una inscripción PROPIA del alumno, nunca del query a ciegas.
  let cursoId: string | null = propio ? r.cursoId : null;
  if (!cursoId && esUuid(searchParams.external_reference)) {
    const insc = (await inscripcionesDe(tenant.id, alumno.id)).find((i) => i.id === searchParams.external_reference);
    cursoId = insc?.cursoId ?? null;
  }
  const curso = cursoId ? await cargarCurso(tenant.id, { id: cursoId }) : null;
  const rechazado = propio && r.estado === "rechazado";

  return (
    <Marco titulo={rechazado ? "Tu pago fue rechazado" : "No se completó el pago"}>
      {rechazado && (
        <p className="al-alert al-alert--error" role="alert">
          {mensajeRechazo(r.detalle)}
        </p>
      )}
      <p className="al-muted">No se hizo ningún cobro. Puedes intentarlo de nuevo{rechazado ? " con otra tarjeta o medio de pago" : ""}; si ves un cobro, escríbele a la academia.</p>
      {curso && (
        <Link className="al-btn al-btn--block" href={`/curso/${curso.slug}`}>
          Intentar de nuevo
        </Link>
      )}
      <Link className={curso ? "al-btn al-btn--sec al-btn--block" : "al-btn al-btn--sec"} href="/mis-cursos">
        Ir a mis cursos
      </Link>
    </Marco>
  );
}

function Marco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="al-main--estrecho al-stack" style={{ width: "100%", margin: "0 auto" }}>
      <h1>{titulo}</h1>
      {children}
    </div>
  );
}
