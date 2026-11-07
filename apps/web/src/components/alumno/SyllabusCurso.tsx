// Syllabus del curso para el alumno (ADR 033): avance y acordeón de módulos con sus lecciones.
// Server Component: los módulos usan <details> nativo; el módulo actual parte abierto.
import Link from "next/link";
import type { CursoParaAlumno } from "../../lib/alumno/catalogo";
import { nombreModulo } from "../../lib/alumno/formato";
import { resumirModulo } from "../../lib/alumno/moduloReglas";
import type { EstadoQuizModulo } from "../../lib/alumno/quizReglas";
import { IconoCandado, IconoCheck, IconoLista, IconoTipoLeccion, ROTULO_TIPO } from "../ui/Iconos";
import { PanelPlegable } from "./PanelPlegable";
import { Barra } from "./Piezas";

interface Props {
  curso: CursoParaAlumno;
  completadas: Set<string>;
  hoy: string;
  quizzes: Map<string, EstadoQuizModulo>;
  /** Dónde está el alumno: el módulo abierto y, si es una lección, cuál (sin `leccionId` = resumen del módulo). */
  actual: { moduloId: string; leccionId?: string };
}

export function SyllabusCurso({ curso, completadas, hoy, quizzes, actual }: Props) {
  const total = curso.modulos.reduce((n, m) => n + m.lecciones.length, 0);
  const pct = total === 0 ? 0 : Math.round((completadas.size / total) * 100);

  return (
    <PanelPlegable id="al-syllabus" titulo="Contenido del curso" variante="sil">
      <nav aria-label="Contenido del curso" className="al-syl">
        <Barra etiqueta="Tu avance" pct={pct} detalle={`${completadas.size} de ${total}`} />
        {curso.modulos.map((m, mi) => {
          const r = resumirModulo(m, curso, curso.diaLiberacion, completadas, hoy);
          const q = quizzes.get(m.id);
          const esActual = m.id === actual.moduloId;
          return (
            <details key={m.id} className="al-syl__mod" open={esActual}>
              <summary>
                <span className="al-syl__modt">
                  Módulo {mi + 1} · {nombreModulo(m.titulo)}
                </span>
                <span className="al-syl__cnt">
                  {r.hechas}/{r.total}
                  <span className="av-sr-only"> lecciones completadas</span>
                </span>
              </summary>
              <ol>
                <li>
                  <Link href={`/aprender/${curso.id}/modulo/${m.id}`} aria-current={esActual && !actual.leccionId ? "page" : undefined}>
                    <span className="al-syl__ico" aria-hidden="true">
                      <IconoLista tam={16} />
                    </span>
                    <span>Resumen del módulo</span>
                  </Link>
                </li>
                {r.filas.map((f) => {
                  const interior = (
                    <>
                      <span className={`al-dot${f.estado === "completada" ? " al-dot--ok" : ""}`} aria-hidden="true">
                        {f.estado === "completada" ? <IconoCheck tam={12} /> : f.estado === "bloqueada" ? <IconoCandado tam={12} grosor={2.2} /> : null}
                      </span>
                      <IconoTipoLeccion tipo={f.tipo} tam={16} className="al-syl__tipo" />
                      <span>
                        <span className="av-sr-only">{ROTULO_TIPO[f.tipo]}: </span>
                        {f.titulo}
                        <span className="av-sr-only">
                          {f.estado === "completada" ? " (completada)" : f.estado === "bloqueada" ? " (aún no disponible)" : ""}
                        </span>
                      </span>
                    </>
                  );
                  return (
                    <li key={f.id}>
                      {f.estado === "bloqueada" ? (
                        <span className="al-syl__bloq">{interior}</span>
                      ) : (
                        <Link href={`/aprender/${curso.id}/${f.id}`} aria-current={f.id === actual.leccionId ? "page" : undefined}>
                          {interior}
                        </Link>
                      )}
                    </li>
                  );
                })}
                {q && (
                  <li>
                    <Link href={`/aprender/${curso.id}/quiz/${m.id}`}>
                      <span className={`al-dot${q.dominado ? " al-dot--ok" : ""}`} aria-hidden="true">
                        {q.dominado ? <IconoCheck tam={12} /> : null}
                      </span>
                      <span>Quiz de repaso</span>
                    </Link>
                  </li>
                )}
              </ol>
            </details>
          );
        })}
      </nav>
    </PanelPlegable>
  );
}
