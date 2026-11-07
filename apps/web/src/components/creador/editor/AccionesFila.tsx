"use client";

// Piezas compartidas por la lista de módulos (Paso 3) y la pantalla de cada módulo.
import { estadoQuiz } from "../../../lib/creador/quiz";
import type { Modulo } from "../../../lib/creador/types";
import { IconoFlecha, IconoPapelera } from "../../ui/Iconos";
import { Button } from "../Button";
import "./quiz.css";

/** Subir / bajar / eliminar de una fila (módulo o lección). */
export function Acciones({
  nombre,
  primero,
  ultimo,
  onSubir,
  onBajar,
  onEliminar,
}: {
  nombre: string;
  primero: boolean;
  ultimo: boolean;
  onSubir: () => void;
  onBajar: () => void;
  onEliminar: () => void;
}) {
  // aria-disabled (no disabled): el foco no se pierde al llegar al extremo.
  return (
    <div className="ed-acc" role="group" aria-label={`Acciones de ${nombre}`}>
      <button
        type="button"
        className="ed-icono"
        aria-label={`Subir ${nombre}`}
        aria-disabled={primero}
        onClick={() => !primero && onSubir()}
      >
        <IconoFlecha dir="arriba" tam={18} />
      </button>
      <button
        type="button"
        className="ed-icono"
        aria-label={`Bajar ${nombre}`}
        aria-disabled={ultimo}
        onClick={() => !ultimo && onBajar()}
      >
        <IconoFlecha dir="abajo" tam={18} />
      </button>
      <button type="button" className="ed-icono ed-icono--peligro" aria-label={`Eliminar ${nombre}`} onClick={onEliminar}>
        <IconoPapelera tam={18} />
      </button>
    </div>
  );
}

export /** Fila "Quiz de repaso" de un módulo (diseño 3.2): estado y acceso al editor del quiz. */
function FilaQuiz({ moduloId, preguntas, onAbrir }: { moduloId: string; preguntas: Modulo["quiz"]; onAbrir: () => void }) {
  const q = estadoQuiz(preguntas);
  const cls = q.completo ? " qz-fila-mod--lista" : q.total > 0 ? " qz-fila-mod--falta" : "";
  return (
    <div className={`qz-fila-mod${cls}`}>
      <div className="qz-fila-mod__t">
        <b>{q.total ? `Quiz de repaso · ${q.total} ${q.total === 1 ? "pregunta" : "preguntas"}` : "Quiz de repaso"}</b>
        <span className="qz-ayuda">
          {q.completo
            ? "Listo · da puntos y la insignia «Módulo dominado»"
            : q.total
              ? `Falta completar: ${q.problema}`
              : "Opcional · recomendado para que repasen lo que fallan"}
        </span>
      </div>
      <Button id={`ed-quiz-${moduloId}`} variante={q.total ? "secondary" : "primary"} onClick={onAbrir}>
        {q.total ? "Editar quiz" : "Agregar quiz"}
      </Button>
    </div>
  );
}
