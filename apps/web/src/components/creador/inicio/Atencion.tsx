import Link from "next/link";
import { LinkButton } from "../Button";
import { iniciales } from "../../../lib/creador/color";
import type { AlumnoEnRiesgo } from "../../../lib/creador/actividadReglas";
import type { TemaDificilConTitulo } from "../../../lib/creador/actividadReciente";
import "./inicio.css";

const MAX_ALUMNOS = 5;

/** Correo prellenado para que el creador le escriba (no hay mensajería dentro de la plataforma). */
function mailto(a: AlumnoEnRiesgo): string {
  const asunto = `¿Cómo vas con ${a.cursos[0] ?? "el curso"}?`;
  return `mailto:${encodeURIComponent(a.correo)}?subject=${encodeURIComponent(asunto)}`;
}

/** Quién necesita al creador hoy: dominio bajo o se está alejando (lo más urgente primero). */
export function NecesitanAyuda({ alumnos }: { alumnos: AlumnoEnRiesgo[] }) {
  return (
    <section className="ci-card" aria-labelledby="ci-ayuda-t">
      <div className="ci-check__head">
        <h2 className="ci-card__title" id="ci-ayuda-t">
          Necesitan tu ayuda
        </h2>
        {alumnos.length > 0 && <span className="ci-cuenta ci-cuenta--alerta">{alumnos.length}</span>}
      </div>
      {alumnos.length === 0 ? (
        <p className="ci-muted">Nadie con dominio bajo ni sin entrar hace una semana. Buen ritmo.</p>
      ) : (
        <>
          <ul className="ci-ayuda">
            {alumnos.slice(0, MAX_ALUMNOS).map((a) => (
              <li key={a.alumnoId} className="ci-ayuda__item">
                <span className="ci-avatar" aria-hidden="true">
                  {iniciales(a.alumno)}
                </span>
                <div className="ci-ayuda__txt">
                  <Link className="ci-ayuda__nombre" href={`/estudiantes?alumno=${encodeURIComponent(a.alumnoId)}`}>
                    {a.alumno}
                  </Link>
                  <span className="ci-ayuda__motivo">{a.motivo}</span>
                  <span className="ci-ayuda__curso">{a.cursos.length > 1 ? `En ${a.cursos.length} cursos` : a.cursos[0]}</span>
                </div>
                {a.correo && (
                  <a className="ci-icobtn" href={mailto(a)} aria-label={`Escribirle a ${a.alumno}`} title={`Escribirle a ${a.alumno}`}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3 7 9 6 9-6" />
                    </svg>
                  </a>
                )}
              </li>
            ))}
          </ul>
          {alumnos.length > MAX_ALUMNOS && <p className="ci-muted">Y {alumnos.length - MAX_ALUMNOS} más.</p>}
          <div className="ci-actions">
            <LinkButton href="/estudiantes" variante="ghost">
              Ver estudiantes
            </LinkButton>
          </div>
        </>
      )}
    </section>
  );
}

/** Módulos donde más se equivocan al primer intento: dónde reforzar la explicación. */
export function TemasDificiles({ temas }: { temas: TemaDificilConTitulo[] }) {
  return (
    <section className="ci-card" aria-labelledby="ci-temas-t">
      <h2 className="ci-card__title" id="ci-temas-t">
        Temas que cuestan más
      </h2>
      {temas.length === 0 ? (
        <p className="ci-muted">Cuando haya suficientes respuestas de quiz, verás aquí los módulos con menor acierto.</p>
      ) : (
        <>
          <p className="ci-muted">Acierto al primer intento en el quiz del módulo. Una explicación extra o una clase en vivo puede ayudar.</p>
          <ul className="ci-temas">
            {temas.map((t) => (
              <li key={t.moduloId} className="ci-temas__item">
                <div className="ci-temas__fila">
                  <div className="ci-temas__txt">
                    <span className="ci-temas__mod">{t.modulo}</span>
                    <span className="ci-ayuda__curso">
                      {t.curso} · {t.alumnos} {t.alumnos === 1 ? "estudiante" : "estudiantes"}
                    </span>
                  </div>
                  <span className="ci-temas__pct">{t.acierto} %</span>
                </div>
                <span className="ci-bar ci-bar--fina ci-bar--bajo" aria-hidden="true">
                  <i style={{ width: `${t.acierto}%` }} />
                </span>
              </li>
            ))}
          </ul>
          <div className="ci-actions">
            <LinkButton href={temas[0].cursoId ? `/analitica?curso=${temas[0].cursoId}` : "/analitica"} variante="ghost">
              Ver analítica
            </LinkButton>
          </div>
        </>
      )}
    </section>
  );
}
