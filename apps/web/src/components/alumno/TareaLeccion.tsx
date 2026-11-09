// Tarea de una lección (ADR 038), vista del alumno: instrucciones, sus entregas y, cuando el
// creador la publica, el puntaje y los comentarios. Server Component; solo el formulario es cliente.
import { MarkdownMinimo } from "../tenant/MarkdownMinimo";
import type { EntregaAlumno, TareaAlumno } from "../../lib/alumno/tareas";
import { fechaHoraLarga, formatearPuntaje } from "../../lib/tareas/reglas";
import { FormEntrega } from "./FormEntrega";
import "./alumno.css";

export function TareaLeccion({ cursoId, tarea, entregas }: { cursoId: string; tarea: TareaAlumno; entregas: EntregaAlumno[] }) {
  const yaEntrego = entregas.length > 0;
  const puedeEnviar = !yaEntrego || tarea.permiteReenvio;
  return (
    <section className="al-card" aria-labelledby={`tarea-${tarea.id}`}>
      <h2 id={`tarea-${tarea.id}`}>Tarea: {tarea.titulo}</h2>
      <p className="al-muted">
        Vale {formatearPuntaje(tarea.puntajeMaximo)} {tarea.puntajeMaximo === 1 ? "punto" : "puntos"}
        {tarea.fechaLimite ? ` · Entrega hasta el ${fechaHoraLarga(tarea.fechaLimite)}` : ""}
      </p>
      {tarea.instrucciones && <MarkdownMinimo texto={tarea.instrucciones} />}

      {yaEntrego && (
        <div className="al-stack">
          <h3>Tus entregas</h3>
          <ul className="al-stack" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {entregas.map((e) => (
              <li key={e.id} className="al-alert">
                <strong>Entrega {e.numero}</strong> · {fechaHoraLarga(e.enviadaAt)}
                {e.atrasada ? " · fuera de plazo" : ""}
                <br />
                <a href={`/aprender/${cursoId}/entrega/${e.id}`} target="_blank" rel="noopener noreferrer">
                  {e.archivoNombre}
                </a>
                {e.revision ? (
                  <div className="al-stack" style={{ marginTop: "var(--av-space-2)" }}>
                    <p style={{ margin: 0 }}>
                      <strong>
                        Puntaje: {formatearPuntaje(e.revision.puntaje)} de {formatearPuntaje(tarea.puntajeMaximo)}
                      </strong>
                    </p>
                    {e.revision.comentario && <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{e.revision.comentario}</p>}
                  </div>
                ) : (
                  <span className="al-muted"> · Esperando revisión</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {puedeEnviar ? (
        <FormEntrega tareaId={tarea.id} reenvio={yaEntrego} />
      ) : (
        <p className="al-muted">Esta tarea admite una sola entrega.</p>
      )}
    </section>
  );
}
