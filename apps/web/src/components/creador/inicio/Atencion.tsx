import { LinkButton } from "../Button";
import type { AlumnoEnRiesgo } from "../../../lib/creador/actividadReglas";
import type { TemaDificilConTitulo } from "../../../lib/creador/actividadReciente";
import "./inicio.css";

const MAX_ALUMNOS = 5;

/** Quién necesita al creador hoy: dominio bajo o se está alejando (lo más urgente primero). */
export function NecesitanAyuda({ alumnos }: { alumnos: AlumnoEnRiesgo[] }) {
  return (
    <section className="ci-card" aria-labelledby="ci-ayuda-t">
      <div className="ci-check__head">
        <h2 className="ci-card__title" id="ci-ayuda-t">
          Necesitan tu ayuda
        </h2>
        {alumnos.length > 0 && <span className="ci-check__count">{alumnos.length}</span>}
      </div>
      {alumnos.length === 0 ? (
        <p className="ci-muted">Nadie con dominio bajo ni sin entrar hace una semana. Buen ritmo.</p>
      ) : (
        <>
          <ul className="ci-ayuda">
            {alumnos.slice(0, MAX_ALUMNOS).map((a) => (
              <li key={a.inscripcionId} className="ci-ayuda__item">
                <span className="ci-ayuda__nombre">{a.alumno}</span>
                <span className="ci-ayuda__motivo">{a.motivo}</span>
                <span className="ci-ayuda__curso">{a.curso}</span>
              </li>
            ))}
          </ul>
          {alumnos.length > MAX_ALUMNOS && <p className="ci-muted">Y {alumnos.length - MAX_ALUMNOS} más.</p>}
          <div className="ci-actions">
            <LinkButton href="/estudiantes" variante="secondary">
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
  if (temas.length === 0) return null;
  return (
    <section className="ci-card" aria-labelledby="ci-temas-t">
      <h2 className="ci-card__title" id="ci-temas-t">
        Temas que cuestan más
      </h2>
      <p className="ci-muted">Acierto al primer intento en el quiz del módulo. Una explicación extra o una clase en vivo puede ayudar.</p>
      <ul className="ci-temas">
        {temas.map((t) => (
          <li key={t.moduloId} className="ci-temas__item">
            <div className="ci-temas__txt">
              <span className="ci-temas__mod">{t.modulo}</span>
              <span className="ci-ayuda__curso">
                {t.curso} · {t.alumnos} {t.alumnos === 1 ? "estudiante" : "estudiantes"}
              </span>
            </div>
            <span className="ci-temas__pct">{t.acierto} %</span>
          </li>
        ))}
      </ul>
      <div className="ci-actions">
        <LinkButton href={temas[0].cursoId ? `/analitica?curso=${temas[0].cursoId}` : "/analitica"} variante="ghost">
          Ver analítica
        </LinkButton>
      </div>
    </section>
  );
}
