import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormAccion } from "../../../../../../../components/alumno/FormAccion";
import { ContenidoLeccion } from "../../../../../../../components/tenant/FichaCurso";
import { Barra } from "../../../../../../../components/alumno/Piezas";
import { completarLeccionAction } from "../../../../../../../lib/alumno/actions";
import { leccionesEnOrden } from "../../../../../../../lib/alumno/catalogo";
import { exigirCursoActivo } from "../../../../../../../lib/alumno/guardia";
import { fechaLiberacion, hoyEnZona, leccionLiberada } from "../../../../../../../lib/alumno/liberacion";
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

  const pct = porcentaje(completadas.size, orden.length);
  const ganaste = Number(searchParams.ganaste);

  return (
    <div className="al-player">
      <article className="al-leccion">
        <p className="al-crumbs">
          <Link href="/mis-cursos">Mis cursos</Link> › {curso.titulo}
        </p>
        <p className="al-muted">
          Módulo {leccion.moduloNum} · Lección {leccion.num} · {TIPO[leccion.tipo]}
        </p>
        <h1>{leccion.titulo}</h1>

        {Number.isFinite(ganaste) && ganaste > 0 && (
          <p className="al-toast" role="status">
            +{ganaste} XP
          </p>
        )}
        {searchParams.error && (
          <p className="al-alert al-alert--error" role="alert">
            {searchParams.error.slice(0, 300)}
          </p>
        )}

        {liberada ? (
          <ContenidoLeccion l={leccion} />
        ) : (
          <p className="al-alert" role="status">
            Esta lección se abre el <strong>{fechaLib ? fechaCorta(fechaLib) : "próximamente"}</strong>. Vuelve ese día.
          </p>
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
                <Link href={`/aprender/${curso.id}/${siguiente.id}`} className="al-btn">
                  Siguiente →
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
        {hecha && <p className="al-badge al-badge--ok">✓ Completada</p>}
      </article>

      <aside className="al-player__side al-card al-temario" aria-label="Contenido del curso">
        <Barra etiqueta="Tu avance" pct={pct} detalle={`${completadas.size} de ${orden.length}`} />
        {curso.modulos.map((m, mi) => (
          <div key={m.id}>
            <p className="al-mod">
              Módulo {mi + 1} · {m.titulo}
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
            </ol>
          </div>
        ))}
      </aside>
    </div>
  );
}
