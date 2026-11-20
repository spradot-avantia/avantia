import Link from "next/link";
import { LinkButton } from "../Button";
import { iniciales } from "../../../lib/creador/color";
import { haceCuanto, type ActividadAlumno } from "../../../lib/creador/actividadReglas";
import "./inicio.css";

/**
 * Lo último de cada estudiante: una fila por persona con su acción más reciente y cuántas más
 * tiene, para que el feed no se alargue con todo (Server Component; sin interactividad).
 */
export function ActividadReciente({ grupos, ahora }: { grupos: ActividadAlumno[]; ahora: number }) {
  return (
    <section className="ci-card ci-act" aria-labelledby="ci-act-t">
      <div className="ci-check__head">
        <h2 className="ci-card__title" id="ci-act-t">
          Actividad reciente
        </h2>
        {grupos.length > 0 && (
          <LinkButton href="/estudiantes" variante="ghost">
            Ver todo
          </LinkButton>
        )}
      </div>
      {grupos.length === 0 ? (
        <p className="ci-muted">Cuando tus estudiantes completen lecciones o respondan quizzes, lo verás aquí.</p>
      ) : (
        <ol className="ci-act__lista">
          {grupos.map((g) => {
            const it = g.ultima;
            return (
              <li key={g.alumnoId} className={`ci-act__item ci-act__item--${it.tono}`}>
                <span className="ci-avatar ci-avatar--neutro" aria-hidden="true">
                  {iniciales(g.alumno)}
                </span>
                <div className="ci-act__cuerpo">
                  <p className="ci-act__texto">
                    <strong>{g.alumno}</strong> {it.texto}
                    {it.detalle && (
                      <span className="ci-act__detalle">
                        {" · "}
                        {it.tono === "alerta" && <span className="ci-sr">Acierto bajo: </span>}
                        {it.detalle}
                      </span>
                    )}
                  </p>
                  <p className="ci-act__meta">
                    <time dateTime={it.fecha}>{haceCuanto(it.fecha, ahora)}</time>
                    {g.mas > 0 && (
                      <Link href={`/estudiantes?alumno=${encodeURIComponent(g.alumnoId)}`} className="ci-act__mas">
                        +{g.mas} {g.mas === 1 ? "actividad" : "actividades"}
                        <span className="ci-sr"> de {g.alumno}</span>
                      </Link>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
