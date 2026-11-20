import { LinkButton } from "../Button";
import { iniciales } from "../../../lib/creador/color";
import { resumenModulos, type CompletitudCurso, type EstadoModulo } from "../../../lib/creador/completitud";
import type { CursoResumen } from "../../../lib/creador/types";
import { CopiarEnlace } from "./CopiarEnlace";
import "./inicio.css";

export interface CursoConCompletitud extends CursoResumen {
  url: string;
  /** null si no se pudo cargar el contenido: se muestra el curso sin la barra. */
  completitud: CompletitudCurso | null;
}

const ETIQUETA: Record<EstadoModulo, string> = { completo: "Completo", en_edicion: "En edición", pendiente: "Pendiente" };

/**
 * Tus cursos con cuánto contenido está listo (lecciones con contenido + quiz completo) y el estado
 * de cada módulo, plegado en un resumen para que el Inicio no se alargue.
 */
export function CursosResumen({ cursos }: { cursos: CursoConCompletitud[] }) {
  return (
    <section className="ci-cursosr" aria-labelledby="ci-cursos-t">
      <div className="ci-check__head ci-check__head--centro">
        <h2 className="ci-card__title" id="ci-cursos-t">
          Tus cursos
        </h2>
        <LinkButton href="/cursos" variante="ghost">
          Ver todos
        </LinkButton>
      </div>
      <ul className="ci-cursosr__lista">
        {cursos.map((c) => {
          const comp = c.completitud;
          const publicado = c.estado === "publicado";
          const titId = `ci-curso-${c.id}`;
          return (
            <li key={c.id} className="ci-card ci-cursor">
              <div className="ci-cursor__cab">
                <span className="ci-cursor__ini" aria-hidden="true">
                  {iniciales(c.titulo)}
                </span>
                <div className="ci-cursor__txt">
                  <h3 className="ci-cursor__titulo" id={titId}>
                    {c.titulo}
                  </h3>
                  <p className="ci-cursor__meta">
                    <span className={`av-badge ${publicado ? "av-badge--ok" : "av-badge--neutral"}`}>{publicado ? "Publicado" : "Borrador"}</span>
                    <span>
                      {c.totalEstudiantes} {c.totalEstudiantes === 1 ? "estudiante" : "estudiantes"} · {c.totalLecciones}{" "}
                      {c.totalLecciones === 1 ? "lección" : "lecciones"}
                    </span>
                  </p>
                </div>
              </div>

              {comp && (
                <>
                  <div className="ci-cursor__prog">
                    <span className="ci-cursor__prog-fila">
                      <span>Contenido listo</span>
                      <strong>{comp.pct} %</strong>
                    </span>
                    <span
                      className={`ci-bar${comp.pct === 100 ? " ci-bar--ok" : ""}`}
                      role="progressbar"
                      aria-label={`Contenido listo de ${c.titulo}`}
                      aria-valuenow={comp.pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <i style={{ width: `${comp.pct}%` }} />
                    </span>
                  </div>
                  {comp.modulos.length > 0 && (
                    <details className="ci-mods" open={!publicado && comp.pct < 100}>
                      <summary>
                        <span className="ci-mods__mini" aria-hidden="true">
                          {comp.modulos.map((m) => (
                            <i key={m.id} className={`ci-est ci-est--${m.estado}`} />
                          ))}
                        </span>
                        <span className="ci-mods__resumen">{resumenModulos(comp)}</span>
                      </summary>
                      <ul className="ci-mods__lista">
                        {comp.modulos.map((m) => (
                          <li key={m.id}>
                            <i className={`ci-est ci-est--${m.estado} ci-est--punto`} aria-hidden="true" />
                            <span className="ci-mods__nombre">{m.titulo}</span>
                            <span className="ci-mods__estado">
                              {ETIQUETA[m.estado]}
                              {m.estado === "en_edicion" && m.lecciones > 0 && ` · ${m.listas} de ${m.lecciones}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </>
              )}

              <div className="ci-actions ci-actions--fila">
                {publicado && <CopiarEnlace url={c.url} etiqueta="Copiar enlace" />}
                <LinkButton href={`/cursos/${c.id}/editar`} variante={publicado ? "secondary" : "primary"}>
                  {comp && comp.pct < 100 ? "Seguir editando" : "Editar"}
                </LinkButton>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
