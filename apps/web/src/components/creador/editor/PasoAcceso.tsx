"use client";

import type { AccesoCurso } from "../../../lib/creador/types";
import { Badge } from "../Badge";
import type { EditorCtx } from "./contexto";

const OPCIONES: ReadonlyArray<{ id: AccesoCurso; titulo: string; texto: string; recomendado?: boolean }> = [
  {
    id: "invitados",
    titulo: "Solo personas que yo invite",
    texto: "Tú registras a cada estudiante por su correo y solo ellos pueden entrar. Ideal para pilotos y grupos pequeños.",
    recomendado: true,
  },
  {
    id: "enlace",
    titulo: "Cualquiera con el enlace",
    texto: "Quien reciba el enlace del curso puede inscribirse. Úsalo cuando ya quieras abrir el curso a más gente.",
  },
];

/** Paso 5: quien puede inscribirse. */
export function PasoAcceso({ ctx }: { ctx: EditorCtx }) {
  const { curso, setCurso } = ctx;

  const elegir = (a: AccesoCurso) => {
    if (a === curso.acceso) return;
    setCurso((c) => ({ ...c, acceso: a }));
    ctx.guardarCampo("acceso", a);
    ctx.anunciar(a === "invitados" ? "Acceso: solo personas que invites" : "Acceso: cualquiera con el enlace");
  };

  return (
    <div className="ed-form">
      <p className="ed-lede">Elige quién puede inscribirse. Podrás cambiarlo cuando quieras.</p>

      <fieldset className="ed-radios">
        <legend className="cr-field__label">¿Quién puede entrar al curso?</legend>
        {OPCIONES.map((o) => (
          <label key={o.id} className={`ed-radio${curso.acceso === o.id ? " ed-radio--sel" : ""}`}>
            <input type="radio" name="ed-acceso" checked={curso.acceso === o.id} onChange={() => elegir(o.id)} />
            <span className="ed-radio__body">
              <strong>
                {o.titulo} {o.recomendado && <Badge tono="ok">Recomendado para pilotos</Badge>}
              </strong>
              <span>{o.texto}</span>
            </span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}
