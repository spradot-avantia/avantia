import { LinkButton } from "../Button";
import { haceCuanto, type ItemActividad, type TipoActividad } from "../../../lib/creador/actividadReglas";
import "./inicio.css";

const ICONO: Record<TipoActividad, string> = {
  leccion: "M5 12l4 4 10-10",
  quiz: "M9 9a3 3 0 1 1 3 3v2M12 18h.01",
  curso: "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z",
  inscripcion: "M12 5v14M5 12h14",
  tarea: "M14 3H6v18h12V7l-4-4zM14 3v4h4",
};

const ETIQUETA: Record<TipoActividad, string> = {
  leccion: "Lección",
  quiz: "Quiz",
  curso: "Curso terminado",
  inscripcion: "Inscripción",
  tarea: "Tarea",
};

/** Feed de lo último que hicieron los estudiantes (Server Component; sin interactividad). */
export function ActividadReciente({ items, ahora }: { items: ItemActividad[]; ahora: number }) {
  return (
    <section className="ci-card ci-act" aria-labelledby="ci-act-t">
      <div className="ci-check__head">
        <h2 className="ci-card__title" id="ci-act-t">
          Actividad reciente
        </h2>
        {items.length > 0 && (
          <LinkButton href="/estudiantes" variante="ghost">
            Ver estudiantes
          </LinkButton>
        )}
      </div>
      {items.length === 0 ? (
        <p className="ci-muted">Cuando tus estudiantes completen lecciones o respondan quizzes, lo verás aquí.</p>
      ) : (
        <ol className="ci-act__lista">
          {items.map((it) => (
            <li key={`${it.tipo}-${it.id}`} className={`ci-act__item ci-act__item--${it.tono}`}>
              <span className="ci-act__ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={ICONO[it.tipo]} />
                </svg>
              </span>
              <div className="ci-act__cuerpo">
                <p className="ci-act__texto">
                  <span className="ci-sr">{ETIQUETA[it.tipo]}: </span>
                  <strong>{it.alumno}</strong> {it.texto}
                </p>
                <p className="ci-act__meta">
                  {it.detalle && (
                    <span className="ci-act__detalle">
                      {it.tono === "alerta" && <span className="ci-sr">Acierto bajo: </span>}
                      {it.detalle}
                    </span>
                  )}
                  <time dateTime={it.fecha}>{haceCuanto(it.fecha, ahora)}</time>
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
