import type { ResultadoModulo } from "../../../lib/creador/resultadosQuiz";
import "../inicio/inicio.css";

/** Cómo les va a tus estudiantes en cada quiz (solo primeros intentos). */
export function ResultadosQuiz({ resultados, titulosCurso }: { resultados: ResultadoModulo[]; titulosCurso: Map<string, string> }) {
  if (resultados.length === 0) return null;
  return (
    <section className="ci-stack" style={{ gap: "var(--av-space-3)" }} aria-labelledby="ci-quiz-t">
      <h2 className="ci-card__title" id="ci-quiz-t">
        Resultados de los quizzes
      </h2>
      <p className="ci-muted">Aciertos al primer intento de cada estudiante. Repetir el quiz no cambia estas cifras.</p>
      <ul className="ci-list">
        {resultados.map((r) => (
          <li key={r.moduloId} className="ci-row ci-row--compact">
            <div className="ci-row__main">
              <span className="ci-row__title">{r.titulo || "Módulo"}</span>
              <span className="ci-muted">
                {titulosCurso.get(r.cursoId) ?? "Curso"} · {r.preguntas} {r.preguntas === 1 ? "pregunta" : "preguntas"}
              </span>
              {r.masFallada && r.acierto !== null && r.acierto < 100 && (
                <span className="ci-muted">
                  Lo que más cuesta: «{r.masFallada.texto}» ({r.masFallada.acierto} % de acierto)
                </span>
              )}
            </div>
            <div>
              {r.acierto === null ? (
                <span className="ci-muted">Aún sin respuestas</span>
              ) : (
                <strong>
                  {r.acierto} % <span className="ci-muted">· {r.alumnos} {r.alumnos === 1 ? "estudiante" : "estudiantes"}</span>
                </strong>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
