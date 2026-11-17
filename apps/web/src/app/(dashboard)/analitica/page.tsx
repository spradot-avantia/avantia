import Link from "next/link";
import { EmptyState, PageHeader, SinAcademia } from "../../../components/creador";
import "../../../components/creador/inicio/inicio.css";
import "../../../components/creador/analitica/analitica.css";
import { cargarAnalitica, type AnaliticaCurso } from "../../../lib/creador/analitica";
import { aciertoMedio, avanceMedio, resumenPorModulo, resumenQuizPorModulo } from "../../../lib/creador/analiticaReglas";
import { getCurrentTenant } from "../../../lib/creador/tenantActual";

export const dynamic = "force-dynamic";

function duracion(seg: number | null): string {
  if (seg == null) return "sin datos";
  if (seg < 60) return `${seg} s`;
  const m = Math.floor(seg / 60);
  return `${m} min${seg % 60 ? ` ${seg % 60} s` : ""}`;
}
const pct = (n: number | null) => (n == null ? "—" : `${n} %`);

function Barra({ valor, alerta }: { valor: number | null; alerta?: boolean }) {
  return (
    <div className={`an-barra${alerta ? " an-barra--alerta" : ""}`} aria-hidden="true">
      <i style={{ width: `${Math.max(0, Math.min(100, valor ?? 0))}%` }} />
    </div>
  );
}

export default async function AnaliticaPage({ searchParams }: { searchParams: { curso?: string } }) {
  let a: AnaliticaCurso;
  try {
    if (!(await getCurrentTenant())) return <SinAcademia />;
    a = await cargarAnalitica(searchParams.curso);
  } catch (e) {
    console.error("[analitica] no se pudo cargar", e);
    return <EmptyState titulo="No pudimos cargar la analítica" descripcion="Revisa tu conexión e inténtalo de nuevo en unos minutos." />;
  }
  if (!a.cursoId) {
    return (
      <div className="ci-stack">
        <PageHeader titulo="Analítica" />
        <EmptyState titulo="Aún no hay datos" descripcion="Crea un curso y registra estudiantes: aquí verás cómo avanzan." />
      </div>
    );
  }
  const r = a.retencion;
  const atencionLecciones = [...a.lecciones].filter((l) => (l.abandono ?? 0) > 0 && l.abrieron >= 2).sort((x, y) => (y.abandono ?? 0) - (x.abandono ?? 0)).slice(0, 3);
  const atencionPreguntas = [...a.preguntas].filter((q) => q.acierto != null && q.acierto < 50).sort((x, y) => (x.acierto ?? 0) - (y.acierto ?? 0)).slice(0, 3);
  const modulos = resumenPorModulo(a.lecciones);
  const quizModulos = resumenQuizPorModulo(a.preguntas).filter((m) => m.alumnos > 0);
  const avance = avanceMedio(a.lecciones, r.inscritosActivos);
  const acierto = aciertoMedio(a.preguntas);
  const csv = (tipo: string) => `/analitica/exportar?curso=${a.cursoId}&tipo=${tipo}`;

  return (
    <div className="ci-stack">
      <PageHeader titulo="Analítica" descripcion="Cómo avanzan tus estudiantes: dónde se detienen, qué les cuesta y quién se está alejando." />
      {a.cursos.length > 1 && (
        <nav className="an-tabs" aria-label="Curso">
          {a.cursos.map((c) => (
            <Link key={c.id} href={`/analitica?curso=${c.id}`} aria-current={c.id === a.cursoId ? "page" : undefined}>
              {c.titulo}
            </Link>
          ))}
        </nav>
      )}

      <section className="ci-card an-kpis" aria-label="Resumen">
        <div className="an-kpi"><b>{r.inscritosActivos}</b><span>Estudiantes activos</span></div>
        <div className="an-kpi"><b>{pct(avance)}</b><span>Avance medio del curso</span></div>
        <div className="an-kpi"><b>{pct(acierto)}</b><span>Acierto en quizzes (primer intento)</span></div>
        <div className="an-kpi"><b>{r.sinActividad7}</b><span>Sin entrar hace 7 días o más{r.sinActividad14 > 0 ? ` (${r.sinActividad14} hace 14 o más)` : ""}</span></div>
      </section>

      {(atencionLecciones.length > 0 || atencionPreguntas.length > 0) && (
        <section className="ci-card ci-card--accent" aria-labelledby="an-a">
          <h2 className="ci-card__title" id="an-a">Requiere atención</h2>
          <ul className="an-lista">
            {atencionLecciones.map((l) => (
              <li key={l.leccionId} className="an-fila">
                <span className="an-fila__t">{l.titulo}</span>
                <span className="an-fila__meta"><span>Lección · {l.modulo}</span><span>Abandono {pct(l.abandono)}</span><span>{l.abrieron} la abrieron</span></span>
              </li>
            ))}
            {atencionPreguntas.map((q) => (
              <li key={q.preguntaId} className="an-fila">
                <span className="an-fila__t">{q.texto}</span>
                <span className="an-fila__meta"><span>Pregunta · {q.modulo}</span><span>Acierto {pct(q.acierto)}</span><span>{q.alumnos} {q.alumnos === 1 ? "alumno" : "alumnos"}</span></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="ci-card" aria-labelledby="an-l">
        <h2 className="ci-card__title" id="an-l">Lecciones por módulo</h2>
        <p className="ci-muted">Qué parte de lo abierto se completó. Abre un módulo para ver sus lecciones y el tiempo activo (mediana por visita).</p>
        {!a.hayTiempos && <p className="ci-muted">El tiempo por lección aparecerá cuando tus estudiantes vuelvan a entrar.</p>}
        {modulos.length === 0 ? (
          <p className="ci-muted">Este curso aún no tiene lecciones.</p>
        ) : (
          <div className="an-mods">
            {modulos.map((m) => (
              <details key={m.modulo} className="an-mod">
                <summary>
                  <span className="an-fila__t">{m.modulo}</span>
                  <Barra valor={m.abrieron ? 100 - (m.abandono ?? 0) : 0} />
                  <span className="an-fila__meta">
                    <span>{m.lecciones.length} {m.lecciones.length === 1 ? "lección" : "lecciones"}</span>
                    <span>{m.abrieron ? `${100 - (m.abandono ?? 0)} % completado` : "Sin aperturas"}</span>
                  </span>
                </summary>
                <ol className="an-lista">
                  {m.lecciones.map((l) => (
                    <li key={l.leccionId} className="an-fila">
                      <span className="an-fila__t">{l.titulo}</span>
                      <span className="an-fila__meta">
                        <span>{l.abrieron} abrieron</span>
                        <span>{l.completaron} completaron</span>
                        <span>Abandono {pct(l.abandono)}</span>
                        <span>Tiempo {duracion(l.tiempoMedianoSeg)}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </details>
            ))}
          </div>
        )}
      </section>

      <section className="ci-card" aria-labelledby="an-q">
        <h2 className="ci-card__title" id="an-q">Quizzes por módulo</h2>
        <p className="ci-muted">Acierto medio al primer intento. Abre un módulo para ver sus preguntas, de la más fallada a la menos fallada.</p>
        {quizModulos.length === 0 ? (
          <p className="ci-muted">Aún no hay respuestas de quiz.</p>
        ) : (
          <div className="an-mods">
            {quizModulos.map((m) => (
              <details key={m.modulo} className="an-mod">
                <summary>
                  <span className="an-fila__t">{m.modulo}</span>
                  <Barra valor={m.acierto} alerta={(m.acierto ?? 100) < 50} />
                  <span className="an-fila__meta">
                    <span>Acierto {pct(m.acierto)}</span>
                    <span>{m.preguntas.length} {m.preguntas.length === 1 ? "pregunta" : "preguntas"}</span>
                    <span>{m.alumnos} {m.alumnos === 1 ? "alumno" : "alumnos"}</span>
                  </span>
                </summary>
                <ol className="an-lista">
                  {[...m.preguntas].filter((q) => q.acierto != null).sort((x, y) => (x.acierto ?? 0) - (y.acierto ?? 0)).map((q) => (
                    <li key={q.preguntaId} className="an-fila">
                      <span className="an-fila__t">{q.texto}</span>
                      <span className="an-fila__meta">
                        <span>Acierto {pct(q.acierto)}</span>
                        <span>{q.alumnos} {q.alumnos === 1 ? "alumno" : "alumnos"}</span>
                        <span>Tiempo {duracion(q.tiempoMedianoSeg)}</span>
                        <span>Reintentos {q.reintentos}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </details>
            ))}
          </div>
        )}
      </section>

      {a.tareas.length > 0 && (
        <section className="ci-card" aria-labelledby="an-t">
          <h2 className="ci-card__title" id="an-t">Tareas</h2>
          <ul className="an-lista">
            {a.tareas.map((t) => (
              <li key={t.tareaId} className="an-fila">
                <span className="an-fila__t">{t.titulo}</span>
                <Barra valor={t.inscritos ? Math.round((t.entregaron / t.inscritos) * 100) : 0} />
                <span className="an-fila__meta">
                  <span>{t.entregaron} de {t.inscritos} entregaron</span>
                  <span>{t.conReenvio} con reenvío</span>
                  <span>{t.horasMedianas == null ? "Tiempo hasta entregar: sin datos" : `Entregan a las ${t.horasMedianas} h de abrir la lección`}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="ci-card" aria-labelledby="an-r">
        <h2 className="ci-card__title" id="an-r">Retención por semana de ingreso</h2>
        <p className="ci-muted">De cada grupo que se inscribió una semana, qué porcentaje volvió en las semanas siguientes.</p>
        {r.cohortes.length === 0 ? (
          <p className="ci-muted">Aún no hay inscripciones activas.</p>
        ) : (
          <div className="an-scroll">
            <table className="an-tabla">
              <thead>
                <tr><th scope="col">Semana</th><th scope="col">Alumnos</th><th scope="col">+1</th><th scope="col">+2</th><th scope="col">+3</th><th scope="col">+4</th></tr>
              </thead>
              <tbody>
                {r.cohortes.map((c) => (
                  <tr key={c.semanaInicio}>
                    <th scope="row">{c.semanaInicio}</th>
                    <td>{c.alumnos}</td>
                    {c.retencion.map((v, i) => <td key={i}>{pct(v)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="ci-muted an-csv">
        <span style={{ flexBasis: "100%" }}>Exportar todo el detalle:</span>
        <a href={csv("lecciones")}>Lecciones (CSV)</a>
        <a href={csv("preguntas")}>Preguntas (CSV)</a>
        <a href={csv("tareas")}>Tareas (CSV)</a>
      </p>
    </div>
  );
}
