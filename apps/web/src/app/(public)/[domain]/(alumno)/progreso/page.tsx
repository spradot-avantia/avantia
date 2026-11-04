import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Barra, Insignia } from "../../../../../components/alumno/Piezas";
import { getTenantPublico } from "../../../../../lib/alumno/contexto";
import { inscripcionesDe } from "../../../../../lib/alumno/inscripciones";
import { resumenDelAlumno } from "../../../../../lib/alumno/progreso";
import { getAlumnoActual } from "../../../../../lib/alumno/sesion";
import { nivelDe, porcentaje, XP_CURSO, XP_LECCION, XP_MODULO } from "../../../../../lib/alumno/xp";

export const metadata: Metadata = { title: "Mi progreso" };
export const dynamic = "force-dynamic";

export default async function ProgresoPage() {
  const [tenant, alumno] = await Promise.all([getTenantPublico(), getAlumnoActual()]);
  if (!tenant) notFound();
  if (!alumno) redirect("/ingresar?next=%2Fprogreso");

  const inscripciones = (await inscripcionesDe(tenant.id, alumno.id)).filter((i) => i.estado === "activa");
  const cursos = await resumenDelAlumno(
    tenant.id,
    alumno.id,
    inscripciones.map((i) => ({ cursoId: i.cursoId, estado: i.estado })),
  );

  const xp = cursos.reduce((n, c) => n + c.desglose.xp, 0);
  const nivel = nivelDe(xp);
  const haTerminado = cursos.some((c) => c.desglose.cursoCompleto);

  return (
    <>
      <section className="al-stack">
        <h1>Mi progreso</h1>
      </section>

      <section className="al-card" aria-labelledby="xp-t">
        <h2 id="xp-t">Tu experiencia</h2>
        <div className="al-xp">
          <span className="al-nivel" aria-label={`Nivel ${nivel.nivel}`}>
            {nivel.nivel}
          </span>
          <div style={{ flex: 1 }}>
            <Barra
              etiqueta={`${xp} XP · Nivel ${nivel.nivel}`}
              pct={nivel.pct}
              detalle={nivel.faltan != null ? `Faltan ${nivel.faltan} para el nivel ${nivel.siguiente}` : "Nivel máximo"}
            />
          </div>
        </div>
        <p className="al-muted">La XP se suma sola cada vez que completas una lección, un módulo o un curso. Nunca se descuenta.</p>
      </section>

      {cursos.length === 0 ? (
        <section className="al-card">
          <h2>Aún no tienes cursos activos</h2>
          <p className="al-muted">Tu avance aparecerá aquí cuando empieces un curso.</p>
          <Link href="/mis-cursos" className="al-btn" style={{ alignSelf: "flex-start" }}>
            Ir a mis cursos
          </Link>
        </section>
      ) : (
        <section className="al-stack" aria-labelledby="av-t">
          <h2 id="av-t">Avance por curso</h2>
          {cursos.map((c) => (
            <article key={c.cursoId} className="al-card">
              <h3>{c.titulo}</h3>
              <Barra etiqueta="Avance" pct={c.avance} detalle={`${c.completadas} de ${c.totalLecciones} lecciones`} />
              {c.dominio && (
                <Barra etiqueta="Lo que dominas" pct={c.dominio.pct} detalle={`${c.dominio.dominadas} de ${c.dominio.total} preguntas`} />
              )}
              <p className="al-muted">
                {c.desglose.xp} XP en este curso · {c.desglose.modulosCompletos} de {c.totalModulos}{" "}
                {c.totalModulos === 1 ? "módulo completo" : "módulos completos"}
              </p>
              <Link
                href={c.desglose.cursoCompleto ? `/aprender/${c.cursoId}/completado` : `/aprender/${c.cursoId}`}
                className="al-btn al-btn--sec"
                style={{ alignSelf: "flex-start" }}
              >
                {c.desglose.cursoCompleto ? "Ver mi cierre" : porcentaje(c.completadas, c.totalLecciones) === 0 ? "Empezar" : "Continuar"}
              </Link>
            </article>
          ))}
        </section>
      )}

      <section className="al-stack" aria-labelledby="ins-t">
        <h2 id="ins-t">Insignias</h2>
        <ul className="al-insignias">
          <Insignia activa={haTerminado} icono="🏁" titulo="Curso completado">
            Completa todas las lecciones de un curso.
          </Insignia>
        </ul>
      </section>

      <section className="al-card" aria-labelledby="como-t">
        <h2 id="como-t">Cómo se gana XP</h2>
        <ul className="al-reglas">
          <li>
            <span>Lección completada</span>
            <strong>+{XP_LECCION}</strong>
          </li>
          <li>
            <span>Módulo completado</span>
            <strong>+{XP_MODULO}</strong>
          </li>
          <li>
            <span>Curso completado</span>
            <strong>+{XP_CURSO}</strong>
          </li>
        </ul>
      </section>
    </>
  );
}
