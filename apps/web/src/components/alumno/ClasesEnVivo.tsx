// Clases en vivo, vista del alumno (ADR 039, Fase 1). Server Components: la próxima clase con su
// botón «Unirme» y, después, la grabación y el resumen. El enlace de Meet solo llega aquí tras la
// guardia de inscripción activa.
import { MarkdownMinimo } from "../tenant/MarkdownMinimo";
import type { ClaseAlumno } from "../../lib/alumno/tareas";
import { fechaHoraLarga, separarClases } from "../../lib/tareas/reglas";
import "./alumno.css";

/** Aviso corto de la próxima clase (para la lección y el módulo). Nada si no hay ninguna. */
export function ProximaClase({ cursoId, clases }: { cursoId: string; clases: ClaseAlumno[] }) {
  const sig = separarClases(clases).proximas[0];
  if (!sig) return null;
  return (
    <aside className="al-card" aria-label="Próxima clase en vivo">
      <p style={{ margin: 0 }}>
        <strong>Próxima clase en vivo:</strong> {sig.titulo}
      </p>
      <p className="al-muted" style={{ margin: 0 }}>
        {fechaHoraLarga(sig.iniciaAt)} · {sig.duracionMin} min
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--av-space-3)" }}>
        {sig.enlaceMeet ? (
          <a className="al-btn" href={sig.enlaceMeet} target="_blank" rel="noopener noreferrer">
            Unirme a la clase
          </a>
        ) : (
          <span className="al-muted">El enlace de Meet se publicará pronto.</span>
        )}
        <a className="al-btn al-btn--sec" href={`/aprender/${cursoId}/clases`}>
          Ver todas las clases
        </a>
      </div>
    </aside>
  );
}

export function ListaClases({ clases }: { clases: ClaseAlumno[] }) {
  const { proximas, pasadas } = separarClases(clases);
  return (
    <div className="al-stack">
      <section className="al-stack" aria-labelledby="cl-prox">
        <h2 id="cl-prox">Próximas</h2>
        {proximas.length === 0 && <p className="al-muted">No hay clases agendadas por ahora.</p>}
        {proximas.map((c) => (
          <article key={c.id} className="al-card">
            <h3 style={{ margin: 0 }}>{c.titulo}</h3>
            <p className="al-muted" style={{ margin: 0 }}>
              {fechaHoraLarga(c.iniciaAt)} · {c.duracionMin} min
            </p>
            {c.descripcion && <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{c.descripcion}</p>}
            {c.enlaceMeet ? (
              <div>
                <a className="al-btn" href={c.enlaceMeet} target="_blank" rel="noopener noreferrer">
                  Unirme a la clase
                </a>
              </div>
            ) : (
              <p className="al-muted">El enlace de Meet se publicará pronto.</p>
            )}
          </article>
        ))}
      </section>

      {pasadas.length > 0 && (
        <section className="al-stack" aria-labelledby="cl-pas">
          <h2 id="cl-pas">Clases anteriores</h2>
          {pasadas.map((c) => (
            <article key={c.id} className="al-card">
              <h3 style={{ margin: 0 }}>{c.titulo}</h3>
              <p className="al-muted" style={{ margin: 0 }}>
                {fechaHoraLarga(c.iniciaAt)}
              </p>
              {c.grabacionUrl && (
                <div>
                  <a className="al-btn al-btn--sec" href={c.grabacionUrl} target="_blank" rel="noopener noreferrer">
                    Ver la grabación
                  </a>
                </div>
              )}
              {c.resumen ? (
                <details>
                  <summary>Qué se vio en la clase</summary>
                  <MarkdownMinimo texto={c.resumen} />
                </details>
              ) : (
                !c.grabacionUrl && <p className="al-muted">Pronto se publicará la grabación y el resumen.</p>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
