"use client";

import { guardarCampoCursoAction } from "../../../lib/creador/actions";
import { validarFechas } from "../../../lib/creador/validacion";
import type { Modalidad } from "../../../lib/creador/types";
import { Badge } from "../Badge";
import { Field, Input } from "../Field";
import type { EditorCtx } from "./contexto";

const OPCIONES: ReadonlyArray<{ id: Modalidad; titulo: string; texto: string }> = [
  { id: "a_su_ritmo", titulo: "A su ritmo", texto: "Cada estudiante avanza cuando quiere, sin fechas fijas." },
  { id: "con_fechas", titulo: "Con fechas de inicio y término", texto: "El curso tiene un periodo definido, por ejemplo una cohorte." },
];

/** Paso 4: modalidad y fechas. Las sesiones en vivo aparecen como "Proximamente". */
export function PasoModalidad({ ctx }: { ctx: EditorCtx }) {
  const { curso, setCurso, auto } = ctx;

  const elegir = (m: Modalidad) => {
    if (m === curso.modalidad) return;
    if (m === "a_su_ritmo") {
      // El servidor tambien borra las fechas; aqui se refleja de inmediato.
      auto.cancelar("campo:fechas");
      setCurso((c) => ({ ...c, modalidad: m, fechaInicio: null, fechaTermino: null }));
    } else {
      setCurso((c) => ({ ...c, modalidad: m }));
    }
    ctx.guardarCampo("modalidad", m);
    ctx.anunciar(m === "a_su_ritmo" ? "Modalidad: a su ritmo" : "Modalidad: con fechas");
  };

  const cambiarFecha = (campo: "fechaInicio" | "fechaTermino", valor: string) => {
    const v = valor || null;
    const ini = campo === "fechaInicio" ? v : curso.fechaInicio;
    const ter = campo === "fechaTermino" ? v : curso.fechaTermino;
    setCurso((c) => ({ ...c, [campo]: v }));
    if (ini && ter && Date.parse(ter) < Date.parse(ini)) {
      // Incoherente: no se guarda; el error se muestra bajo "Fecha de termino".
      auto.cancelar("campo:fechas");
      return;
    }
    // Se guardan ambas juntas; si el servidor rechaza el primer orden por
    // coherencia con la fecha anterior, se reintenta en el orden inverso.
    auto.programar("campo:fechas", async () => {
      const g = (c: "fechaInicio" | "fechaTermino", x: string | null) => guardarCampoCursoAction(curso.id, c, x);
      let r1 = await g("fechaInicio", ini);
      let r2 = await g("fechaTermino", ter);
      if (!r1.ok) {
        r2 = await g("fechaTermino", ter);
        r1 = await g("fechaInicio", ini);
      }
      return r1.ok ? r2 : r1;
    });
  };

  const conFechas = curso.modalidad === "con_fechas";
  const incoherente = conFechas && curso.fechaInicio && curso.fechaTermino ? validarFechas(curso.fechaInicio, curso.fechaTermino) : null;

  return (
    <div className="ed-form">
      <p className="ed-lede">Define cómo avanzan tus estudiantes por el curso.</p>

      <fieldset className="ed-radios">
        <legend className="cr-field__label">Modalidad</legend>
        {OPCIONES.map((o) => (
          <label key={o.id} className={`ed-radio${curso.modalidad === o.id ? " ed-radio--sel" : ""}`}>
            <input type="radio" name="ed-modalidad" checked={curso.modalidad === o.id} onChange={() => elegir(o.id)} />
            <span className="ed-radio__body">
              <strong>{o.titulo}</strong>
              <span>{o.texto}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {conFechas && (
        <div className="ed-fechas">
          <Field id="ed-fecha-inicio" label="Fecha de inicio">
            <Input
              id="ed-fecha-inicio"
              type="date"
              value={curso.fechaInicio ?? ""}
              onChange={(e) => cambiarFecha("fechaInicio", e.target.value)}
            />
          </Field>
          <Field id="ed-fecha-termino" label="Fecha de término" error={incoherente ?? undefined}>
            <Input
              id="ed-fecha-termino"
              type="date"
              min={curso.fechaInicio ?? undefined}
              value={curso.fechaTermino ?? ""}
              invalido={!!incoherente}
              onChange={(e) => cambiarFecha("fechaTermino", e.target.value)}
            />
          </Field>
        </div>
      )}

      <div className="ed-proximamente">
        <label className="ed-radio ed-radio--off">
          <input type="checkbox" disabled aria-describedby="ed-envivo-desc" />
          <span className="ed-radio__body">
            <strong>
              Incluir sesiones en vivo <Badge tono="info">Próximamente</Badge>
            </strong>
            <span id="ed-envivo-desc">Podrás programar sesiones por Zoom, Meet o Teams. Aún no está disponible.</span>
          </span>
        </label>
      </div>
    </div>
  );
}
