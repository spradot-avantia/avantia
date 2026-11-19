"use client";

import { useState } from "react";
import { PRECIO_MIN } from "../../../lib/creador/validacion";
import type { AccesoCurso } from "../../../lib/creador/types";
import { Badge } from "../Badge";
import { Field, Input } from "../Field";
import type { EditorCtx } from "./contexto";
import { errorDe } from "./util";

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

const pesos = (n: number) => (n > 0 ? n.toLocaleString("es-CL") : "");

/** Paso 5: quien puede inscribirse y cuanto cuesta. */
export function PasoAcceso({ ctx }: { ctx: EditorCtx }) {
  const { curso, setCurso } = ctx;
  // Texto tal como lo escribe el creador ("19.990"); al curso va el número en pesos.
  const [precioTexto, setPrecioTexto] = useState(() => pesos(Math.round(curso.precioCentavos / 100)));

  const elegir = (a: AccesoCurso) => {
    if (a === curso.acceso) return;
    setCurso((c) => ({ ...c, acceso: a }));
    ctx.guardarCampo("acceso", a);
    ctx.anunciar(a === "invitados" ? "Acceso: solo personas que invites" : "Acceso: cualquiera con el enlace");
  };

  const cambiarPrecio = (texto: string) => {
    const digitos = texto.replace(/\D/g, "").slice(0, 9);
    const n = digitos ? Number(digitos) : 0;
    setPrecioTexto(digitos ? n.toLocaleString("es-CL") : "");
    setCurso((c) => ({ ...c, precioCentavos: n * 100 }));
    ctx.guardarCampo("precio", n);
  };

  const errorPrecio = errorDe(ctx, "precio");

  return (
    <div className="ed-form">
      <p className="ed-lede">Elige quién puede inscribirse y cuánto cuesta. Podrás cambiarlo cuando quieras.</p>

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

      <Field
        id="ed-precio"
        label="Precio (CLP)"
        ayuda={`En pesos chilenos, sin decimales. Déjalo vacío si el curso es gratis. Mínimo $${PRECIO_MIN.toLocaleString("es-CL")}. Tus estudiantes pagan con Mercado Pago.`}
        error={errorPrecio}
      >
        <Input
          id="ed-precio"
          value={precioTexto}
          inputMode="numeric"
          autoComplete="off"
          placeholder="Gratis"
          conAyuda
          invalido={!!errorPrecio}
          onChange={(e) => cambiarPrecio(e.target.value)}
          onBlur={() => ctx.marcarTocado("precio")}
        />
      </Field>
    </div>
  );
}
