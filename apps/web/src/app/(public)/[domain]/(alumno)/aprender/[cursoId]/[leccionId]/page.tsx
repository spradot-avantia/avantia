import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormAccion } from "../../../../../../../components/alumno/FormAccion";
import { ContenidoLeccion } from "../../../../../../../components/tenant/FichaCurso";
import { MaterialesLeccion } from "../../../../../../../components/alumno/MaterialesLeccion";
import { ToastXp } from "../../../../../../../components/alumno/ToastXp";
import { nombreModulo } from "../../../../../../../lib/alumno/formato";
import { estadoQuizzes } from "../../../../../../../lib/alumno/quiz";
import { Barra } from "../../../../../../../components/alumno/Piezas";
import { completarLeccionAction } from "../../../../../../../lib/alumno/actions";
import { leccionesEnOrden } from "../../../../../../../lib/alumno/catalogo";
import { exigirCursoActivo } from "../../../../../../../lib/alumno/guardia";
import { fechaLiberacion, hoyEnZona, leccionLiberada } from "../../../../../../../lib/alumno/liberacion";
import { materialesDeCurso } from "../../../../../../../lib/alumno/materiales";
import { materialesDeLeccion } from "../../../../../../../lib/alumno/materialesReglas";
import { marcarAcceso } from "../../../../../../../lib/alumno/progreso";
import { porcentaje } from "../../../../../../../lib/alumno/xp";

export const metadata: Metadata = { title: "Lección" };
export const dynamic = "force-dynamic";

const TIPO = { video: "Video", texto: "Texto", documento: "Documento" } as const;

function fechaCorta(f: string) {
  return new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${f}T00:00:00Z`));
}

export default async function LeccionPage({
  params,
  searchParams,
}: {
  params: { cursoId: string; leccionId: string };
  searchParams: { error?: string; ganaste?: string };
}) {
  const { tenant, alumno, curso, completadas } = await exigirCursoActivo(params.cursoId, `/aprender/${params.cursoId}/${params.leccionId}`);
  const orden = leccionesEnOrden(curso);
  const idx = orden.findIndex((l) => l.id === params.leccionId);
  if (idx < 0) notFound();
  const leccion = orden[idx];
  const previa = orden[idx - 1] ?? null;
  const siguiente = orden[idx + 1] ?? null;

  const hoy = hoyEnZona();
  const liberada = leccionLiberada(curso, curso.diaLiberacion.get(leccion.id) ?? null, hoy);
  const fechaLib = fechaLiberacion(curso, curso.diaLiberacion.get(leccion.id) ?? null);
  const hecha = completadas.has(leccion.id);
  if (liberada && !hecha) await marcarAcceso(tenant.id, alumno.id, curso.id, leccion.id);

  // Los materiales solo se leen (y se muestran) con la lección liberada y la inscripción ya comprobada.
  const materiales = liberada ? materialesDeLeccion(await materialesDeCurso(tenant.id, curso.id), leccion.moduloId, leccion.id) : null;

  const pct = porcentaje(completadas.size, orden.length);
  const quizzes = await estadoQuizzes(tenant.id, alumno.id, curso.id);
  const modActual = curso.modulos.find((m) => m.id === leccion.moduloId);
  const quizActual = modActual ? quizzes.get(modActual.id) : undefined;
  const esUltimaDelModulo = !!modActual && modActual.lecciones[modActual.lecciones.length - 1]?.id === leccion.id;
  const ganaste = Number(searchParams.ganaste);

  return (
    <div className="al-player">
      <article className="al-leccion">
        <p className="al-crumbs">
          <Link href="/mis-cursos">Mis cursos</Link> › {curso.titulo}
          {modActual && (
            <>
              {" "}
              › <Link href={`/aprender/${curso.id}/modulo/${modActual.id}`}>Módulo {leccion.moduloNum}</Link>
            </>
          )}
        </p>
        <div className="al-prog-movil">
          <Barra etiqueta={`Lección ${idx + 1} de ${orden.length}`} pct={pct} detalle={`${pct} % del curso`} />
        </div>
        <p className="al-muted al-meta">
          <span>
            Módulo {leccion.moduloNum} · Lección {leccion.num} · {TIPO[leccion.tipo]}
            {leccion.duracionMin ? ` · ${leccion.duracionMin} min` : ""}
          </span>
          {hecha && <span className="al-badge al-badge--ok">✓ Completada</span>}
        </p>
        <h1>{leccion.titulo}</h1>
        {leccion.descripcion && <p className="al-leccion__desc">{leccion.descripcion}</p>}

        {Number.isFinite(ganaste) && ganaste > 0 && (
          <ToastXp xp={ganaste} />
        )}
        {searchParams.error && (
          <p className="al-alert al-alert--error" role="alert">
            {searchParams.error.slice(0, 300)}
          </p>
        )}

        {liberada ? (
          <>
            <ContenidoLeccion l={leccion} />
            {materiales && (
              <MaterialesLeccion cursoId={curso.id} deLaLeccion={materiales.deLaLeccion} delModulo={materiales.delModulo} />
            )}
          </>
        ) : (
          <p className="al-alert" role="status">
            Esta lección se abre el <strong>{fechaLib ? fechaCorta(fechaLib) : "próximamente"}</strong>. Vuelve ese día.
          </p>
        )}

        {hecha && esUltimaDelModulo && quizActual && (
          <div className="al-card al-quizcta">
            <p className="al-quizcta__t">Repasa el módulo con un quiz de {quizActual.total} preguntas</p>
            <p className="al-muted">
              {quizActual.respondidas >= quizActual.total
                ? quizActual.dominado
                  ? "🏅 Módulo dominado"
                  : `Lo respondiste: ${quizActual.aciertosPrimerIntento} de ${quizActual.total} al primer intento.`
                : "Gana XP y la insignia «Módulo dominado» con 80 % de aciertos."}
            </p>
            <Link href={`/aprender/${curso.id}/quiz/${curso.modulos.find((m) => m.id === leccion.moduloId)?.id}`} className="al-btn al-btn--sec">
              {quizActual.respondidas >= quizActual.total ? "Repetir el quiz" : "Hacer el quiz"}
            </Link>
          </div>
        )}
        <div className="al-pager">
          {previa ? (
            <Link href={`/aprender/${curso.id}/${previa.id}`} className="al-btn al-btn--sec">
              ← Anterior
            </Link>
          ) : (
            <span />
          )}
          {liberada &&
            (hecha ? (
              siguiente ? (
                <Link
                  href={
                    siguiente.moduloId !== leccion.moduloId
                      ? `/aprender/${curso.id}/modulo/${siguiente.moduloId}` // ADR 032: al cambiar de módulo se pasa por su presentación
                      : `/aprender/${curso.id}/${siguiente.id}`
                  }
                  className="al-btn"
                >
                  {siguiente.moduloId !== leccion.moduloId ? "Siguiente módulo →" : "Siguiente →"}
                </Link>
              ) : (
                <Link href={`/aprender/${curso.id}/completado`} className="al-btn">
                  Ver mi cierre
                </Link>
              )
            ) : (
              <FormAccion action={completarLeccionAction}>
                <input type="hidden" name="cursoId" value={curso.id} />
                <input type="hidden" name="leccionId" value={leccion.id} />
                <button type="submit" className="al-btn">
                  Marcar como completada · +10 XP
                </button>
              </FormAccion>
            ))}
        </div>
      </article>

      <aside className="al-player__side al-card al-temario" aria-label="Contenido del curso">
        <Barra etiqueta="Tu avance" pct={pct} detalle={`${completadas.size} de ${orden.length}`} />
        {curso.modulos.map((m, mi) => (
          <div key={m.id}>
            <p className="al-mod">
              <Link href={`/aprender/${curso.id}/modulo/${m.id}`}>
                Módulo {mi + 1} · {nombreModulo(m.titulo)}
              </Link>
            </p>
            <ol>
              {m.lecciones.map((l) => {
                const ok = completadas.has(l.id);
                const abierta = leccionLiberada(curso, curso.diaLiberacion.get(l.id) ?? null, hoy);
                const contenido = (
                  <>
                    <span className={`al-dot${ok ? " al-dot--ok" : ""}`} aria-hidden="true">
                      {ok ? "✓" : ""}
                    </span>
                    <span>
                      {l.titulo}
                      <span className="av-sr-only">{ok ? " (completada)" : abierta ? "" : " (aún no disponible)"}</span>
                    </span>
                  </>
                );
                return (
                  <li key={l.id}>
                    {abierta ? (
                      <Link href={`/aprender/${curso.id}/${l.id}`} aria-current={l.id === leccion.id ? "page" : undefined}>
                        {contenido}
                      </Link>
                    ) : (
                      <span>{contenido}</span>
                    )}
                  </li>
                );
              })}
              {quizzes.get(m.id) && (
                <li>
                  <Link href={`/aprender/${curso.id}/quiz/${m.id}`}>
                    <span className={`al-dot${quizzes.get(m.id)?.dominado ? " al-dot--ok" : ""}`} aria-hidden="true">
                      {quizzes.get(m.id)?.dominado ? "✓" : ""}
                    </span>
                    <span>Quiz de repaso</span>
                  </Link>
                </li>
              )}
            </ol>
          </div>
        ))}
      </aside>
    </div>
  );
}
