import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DescripcionModulo, ObjetivosModulo } from "../../../../../../../../components/tenant/PresentacionModulo";
import { ShellCurso } from "../../../../../../../../components/alumno/ShellCurso";
import { SyllabusCurso } from "../../../../../../../../components/alumno/SyllabusCurso";
import { Barra } from "../../../../../../../../components/alumno/Piezas";
import "../../../../../../../../components/alumno/modulo-alumno.css";
import { nombreModulo } from "../../../../../../../../lib/alumno/formato";
import { exigirCursoActivo } from "../../../../../../../../lib/alumno/guardia";
import { hoyEnZona } from "../../../../../../../../lib/alumno/liberacion";
import { resumirModulo, type FilaLeccion } from "../../../../../../../../lib/alumno/moduloReglas";
import { estadoQuizzes } from "../../../../../../../../lib/alumno/quiz";

export const metadata: Metadata = { title: "Módulo" };
export const dynamic = "force-dynamic";

const TIPO = { video: "Video", texto: "Texto", documento: "Documento" } as const;

function fechaCorta(f: string) {
  return new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${f}T00:00:00Z`));
}

function detalleFila(f: FilaLeccion): string {
  const partes: string[] = [TIPO[f.tipo]];
  if (f.duracionMin) partes.push(`${f.duracionMin} min`);
  if (f.estado === "bloqueada") partes.push(f.abreEl ? `se abre el ${fechaCorta(f.abreEl)}` : "aún no disponible");
  return partes.join(" · ");
}

/** Pantalla de un módulo para el alumno (ADR 032, F1): presentación, qué aprenderá y sus lecciones. */
export default async function ModuloAlumnoPage({ params }: { params: { cursoId: string; moduloId: string } }) {
  const { tenant, alumno, curso, completadas } = await exigirCursoActivo(
    params.cursoId,
    `/aprender/${params.cursoId}/modulo/${params.moduloId}`,
  );
  const idx = curso.modulos.findIndex((m) => m.id === params.moduloId);
  if (idx < 0) notFound();
  const modulo = curso.modulos[idx];
  const anterior = curso.modulos[idx - 1] ?? null;
  const siguiente = curso.modulos[idx + 1] ?? null;

  const hoy = hoyEnZona();
  const r = resumirModulo(modulo, curso, curso.diaLiberacion, completadas, hoy);
  const quizzes = await estadoQuizzes(tenant.id, alumno.id, curso.id);
  const quiz = quizzes.get(modulo.id);
  const proximaBloqueada = r.filas.find((f) => f.estado === "bloqueada");
  const nombre = nombreModulo(modulo.titulo);

  const resumen = [`${r.total} ${r.total === 1 ? "lección" : "lecciones"}`, r.duracionMin ? `${r.duracionMin} min` : null].filter(Boolean).join(" · ");

  return (
    <ShellCurso
      syllabus={<SyllabusCurso curso={curso} completadas={completadas} hoy={hoy} quizzes={quizzes} actual={{ moduloId: modulo.id }} />}
    >
    <article className="al-mp">
      <nav aria-label="Ruta" className="al-crumbs">
        <Link href="/mis-cursos">Mis cursos</Link> › {curso.titulo}
      </nav>

      <header className="al-mp__head">
        <p className="al-mp__eyebrow">
          Módulo {idx + 1} de {curso.modulos.length}
        </p>
        <h1>{nombre}</h1>
        <p className="al-muted">{resumen}</p>
        <DescripcionModulo texto={modulo.descripcion} className="al-mp__desc" />
      </header>

      <ObjetivosModulo modulo={modulo} variante="alumno" />

      <section className="al-card al-mp__progreso" aria-label="Tu avance en el módulo">
        <Barra etiqueta="Tu avance en este módulo" pct={r.pct} detalle={`${r.hechas} de ${r.total}`} />
        {r.proxima ? (
          <Link href={`/aprender/${curso.id}/${r.proxima}`} className="al-btn">
            {r.estado === "sin_empezar" ? "Empezar el módulo" : "Continuar"}
          </Link>
        ) : r.estado === "completo" ? (
          <p className="al-badge al-badge--ok">✓ Módulo completado</p>
        ) : proximaBloqueada ? (
          <p className="al-alert" role="status">
            La próxima lección se abre el <strong>{proximaBloqueada.abreEl ? fechaCorta(proximaBloqueada.abreEl) : "próximamente"}</strong>.
          </p>
        ) : (
          <p className="al-muted">Este módulo aún no tiene lecciones.</p>
        )}
      </section>

      {r.total > 0 && (
        <section aria-labelledby="al-mp-lecs">
          <h2 id="al-mp-lecs">Lecciones</h2>
          <ol className="al-mp__lista">
            {r.filas.map((f) => {
              const interior = (
                <>
                  <span className={`al-dot${f.estado === "completada" ? " al-dot--ok" : ""}`} aria-hidden="true">
                    {f.estado === "completada" ? "✓" : ""}
                  </span>
                  <span className="al-mp__fila">
                    <span className="al-mp__titulo">
                      {f.titulo}
                      <span className="av-sr-only">{f.estado === "completada" ? " (completada)" : f.estado === "bloqueada" ? " (aún no disponible)" : ""}</span>
                    </span>
                    <span className="al-muted al-mp__det">{detalleFila(f)}</span>
                  </span>
                </>
              );
              return (
                <li key={f.id}>
                  {f.estado === "bloqueada" ? (
                    <span className="al-mp__item al-mp__item--bloq">{interior}</span>
                  ) : (
                    <Link href={`/aprender/${curso.id}/${f.id}`} className="al-mp__item">
                      {interior}
                    </Link>
                  )}
                </li>
              );
            })}
            {quiz && (
              <li>
                <Link href={`/aprender/${curso.id}/quiz/${modulo.id}`} className="al-mp__item">
                  <span className={`al-dot${quiz.dominado ? " al-dot--ok" : ""}`} aria-hidden="true">
                    {quiz.dominado ? "✓" : ""}
                  </span>
                  <span className="al-mp__fila">
                    <span className="al-mp__titulo">Quiz de repaso</span>
                    <span className="al-muted al-mp__det">
                      {quiz.total} {quiz.total === 1 ? "pregunta" : "preguntas"}
                      {quiz.dominado ? " · Módulo dominado" : ""}
                    </span>
                  </span>
                </Link>
              </li>
            )}
          </ol>
        </section>
      )}

      <nav className="al-pager" aria-label="Módulos del curso">
        {anterior ? (
          <Link href={`/aprender/${curso.id}/modulo/${anterior.id}`} className="al-btn al-btn--sec">
            ← Módulo anterior
          </Link>
        ) : (
          <span />
        )}
        {siguiente ? (
          <Link href={`/aprender/${curso.id}/modulo/${siguiente.id}`} className={`al-btn${r.estado === "completo" ? "" : " al-btn--sec"}`}>
            Módulo siguiente →
          </Link>
        ) : r.estado === "completo" ? (
          <Link href={`/aprender/${curso.id}/completado`} className="al-btn">
            Ver mi cierre
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
    </ShellCurso>
  );
}
