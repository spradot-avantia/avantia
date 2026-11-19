import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantPublico } from "../../../../../../lib/alumno/contexto";
import { getAlumnoActual } from "../../../../../../lib/alumno/sesion";
import { acreditarPago } from "../../../../../../lib/pagos/acreditar";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Estado del pago", robots: { index: false } };

type Busqueda = { payment_id?: string; collection_id?: string };

/**
 * Vuelta desde el checkout de Mercado Pago (ADR 046). No confía en el "status" del
 * query: consulta el pago a Mercado Pago y acredita (idempotente, igual que el webhook).
 * Solo muestra el resultado si el pago es de esta academia y de este alumno.
 */
export default async function RetornoPagoPage({ searchParams }: { searchParams: Busqueda }) {
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
  return (
    <Marco titulo="No se pudo completar el pago">
      <p className="al-muted">Si el pago no se aprobó, no se hizo ningún cobro. Puedes intentarlo de nuevo desde la ficha del curso; si ves un cobro, escríbele a la academia.</p>
      <Link className="al-btn al-btn--sec" href="/mis-cursos">
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
