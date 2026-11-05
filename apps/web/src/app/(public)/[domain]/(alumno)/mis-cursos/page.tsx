import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Barra, EstadoBadge, Sello } from "../../../../../components/alumno/Piezas";
import { getTenantPublico } from "../../../../../lib/alumno/contexto";
import { aplicarInvitaciones, inscripcionesDe } from "../../../../../lib/alumno/inscripciones";
import { repasoDeHoy } from "../../../../../lib/alumno/repaso";
import { resumenDelAlumno } from "../../../../../lib/alumno/progreso";
import { getAlumnoActual } from "../../../../../lib/alumno/sesion";

export const metadata: Metadata = { title: "Mis cursos" };
export const dynamic = "force-dynamic";

export default async function MisCursosPage() {
  const [tenant, alumno] = await Promise.all([getTenantPublico(), getAlumnoActual()]);
  if (!tenant) notFound();
  if (!alumno) redirect("/ingresar?next=%2Fmis-cursos");

  // Invitaciones que el creador cargó después de que esta persona se registró.
  if (alumno.verificado) await aplicarInvitaciones(tenant.id, alumno.id, alumno.correo);
  const inscripciones = await inscripcionesDe(tenant.id, alumno.id);
  const resumen = await resumenDelAlumno(
    tenant.id,
    alumno.id,
    inscripciones.map((i) => ({ cursoId: i.cursoId, estado: i.estado })),
  );

  const repaso = await repasoDeHoy(
    tenant.id,
    alumno.id,
    inscripciones.filter((i) => i.estado === "activa").map((i) => i.cursoId),
  ).catch(() => []);

  return (
    <>
      <section className="al-stack">
        <p className="al-muted">Hola, {alumno.nombre.split(" ")[0]}</p>
        <h1>Mis cursos</h1>
      </section>

      {repaso.length > 0 && (
        <section className="al-card" aria-labelledby="al-repaso-t">
          <h2 id="al-repaso-t">Repaso de hoy</h2>
          <p className="al-muted">
            {repaso.length === 1 ? "1 pregunta que fallaste vuelve" : `${repaso.length} preguntas que fallaste vuelven`} hoy. Son un par de minutos y ayudan a
            recordarlo.
          </p>
          <Link href="/repaso" className="al-btn" style={{ alignSelf: "flex-start" }}>
            Repasar ahora
          </Link>
        </section>
      )}

      {resumen.length === 0 ? (
        <section className="al-card">
          <h2>Aún no tienes cursos</h2>
          <p className="al-muted">Cuando te inscribas o la academia te invite a uno, aparecerá aquí.</p>
          <Link href="/" className="al-btn" style={{ alignSelf: "flex-start" }}>
            Ver los cursos de {tenant.nombre}
          </Link>
        </section>
      ) : (
        <div className="al-grid">
          {resumen.map((c) => {
            const completo = c.estadoInscripcion === "activa" && c.totalLecciones > 0 && c.completadas === c.totalLecciones;
            return (
              <article key={c.cursoId} className={`al-card${completo ? " al-card--hecho" : ""}`}>
                {completo ? (
                  <p className="al-hecho">
                    <Sello />
                    Curso completado
                  </p>
                ) : (
                  <EstadoBadge estado={c.estadoInscripcion} />
                )}
                <h2>{c.titulo}</h2>
                {c.estadoInscripcion === "activa" && (
                  <>
                    {!completo && <Barra etiqueta="Avance" pct={c.avance} detalle={`${c.completadas} de ${c.totalLecciones} lecciones`} />}
                    {c.dominio && (
                      <Barra etiqueta="Lo que dominas" pct={c.dominio.pct} detalle={`${c.dominio.dominadas} de ${c.dominio.total} preguntas`} />
                    )}
                    {completo && (
                      <p className="al-muted">
                        Terminaste las {c.totalLecciones} lecciones. Mira lo que lograste o repasa lo que quieras reforzar.
                      </p>
                    )}
                    {c.continuarId ? (
                      <div className="al-acciones">
                        <Link href={completo ? `/aprender/${c.cursoId}/completado` : `/aprender/${c.cursoId}/${c.continuarId}`} className="al-btn">
                          {completo ? "Ver mi cierre" : c.completadas === 0 ? "Empezar el curso" : "Continuar donde quedé"}
                        </Link>
                        {completo && (
                          <Link href={`/aprender/${c.cursoId}/${c.continuarId}`} className="al-btn al-btn--sec">
                            Repasar el curso
                          </Link>
                        )}
                      </div>
                    ) : (
                      <p className="al-muted">Este curso aún no tiene lecciones.</p>
                    )}
                  </>
                )}
                {c.estadoInscripcion === "pendiente" && (
                  <>
                    <p>
                      Tu cuenta ya está lista. <strong>{tenant.nombre}</strong> debe activar tu inscripción para que puedas empezar.
                    </p>
                    <p className="al-muted">
                      La academia revisa cada solicitud (y, si el curso tiene costo, confirma el pago a mano). Cuando la active, este curso se abrirá
                      aquí mismo; no necesitas hacer nada más.
                    </p>
                  </>
                )}
                {(c.estadoInscripcion === "rechazada" || c.estadoInscripcion === "vencida" || c.estadoInscripcion === "cancelada") && (
                  <p className="al-muted">Tu inscripción no está vigente. Escríbele a la academia si crees que es un error.</p>
                )}
                <Link href={`/curso/${c.slug}`} className="al-link">
                  Ver la ficha del curso
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
