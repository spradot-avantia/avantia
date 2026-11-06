"use client";

// Barra de herramientas del texto de la lección (ADR 035). Opera sobre el textarea por su id:
// lee la selección, aplica la acción pura de `markdownEditor` y devuelve el texto nuevo.
import type { KeyboardEvent } from "react";
import { GRUPOS_BARRA, accionDeAtajo, aplicarAccion, type Accion } from "../../../lib/creador/markdownEditor";

/** Aplica una acción al textarea `id`. Si el resultado excede `maximo`, no hace nada. */
export function aplicarEnTextarea(id: string, accion: Accion, onCambio: (texto: string) => void, maximo: number) {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLTextAreaElement)) return;
  const r = aplicarAccion(el.value, el.selectionStart, el.selectionEnd, accion);
  if (r.texto === el.value || r.texto.length > maximo) return;
  onCambio(r.texto);
  // React actualiza el valor al confirmar el cambio; la selección se repone justo después.
  setTimeout(() => {
    el.focus();
    el.setSelectionRange(r.ini, r.fin);
  }, 0);
}

/** Ctrl/⌘ + B, I, K sobre el textarea. */
export function atajosTexto(e: KeyboardEvent<HTMLTextAreaElement>, onCambio: (texto: string) => void, maximo: number) {
  const accion = accionDeAtajo(e);
  if (!accion) return;
  e.preventDefault();
  aplicarEnTextarea(e.currentTarget.id, accion, onCambio, maximo);
}

interface Props {
  textareaId: string;
  onCambio: (texto: string) => void;
  maximo: number;
}

export function BarraTexto({ textareaId, onCambio, maximo }: Props) {
  return (
    <div className="ed-barra" role="toolbar" aria-label="Formato del texto" aria-controls={textareaId}>
      {GRUPOS_BARRA.map((g) => (
        <div key={g.nombre} className="ed-barra__grupo" role="group" aria-label={g.nombre}>
          <span className="ed-barra__nombre" aria-hidden="true">
            {g.nombre}
          </span>
          <div className="ed-barra__botones">
            {g.botones.map((b) => (
              <button
                key={b.accion}
                type="button"
                className="ed-barra__btn"
                title={b.titulo}
                aria-label={b.titulo}
                // El botón no roba el foco ni la selección del textarea.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => aplicarEnTextarea(textareaId, b.accion, onCambio, maximo)}
              >
                {b.etiqueta}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Guía plegable con la sintaxis, para quien prefiere escribir Markdown directamente. */
export function GuiaFormato() {
  const filas: [string, string][] = [
    ["**negrita**, *cursiva*, ~~tachado~~, ==resaltado==", "Formato dentro de una línea"],
    ["`código`", "Código dentro de una línea"],
    ["[texto](https://…)", "Enlace (solo https)"],
    ["# Título   ## Subtítulo   ### Sub-subtítulo", "Los títulos arman el índice «En esta lección»"],
    ["- punto   1. paso   - [ ] tarea   - [x] hecha", "Listas"],
    ["> cita", "Cita"],
    ["> [!nota] Título   (también consejo, importante, advertencia)", "Aviso destacado; las líneas siguientes con > son su contenido"],
    ["| A | B |  y debajo  | --- | --- |", "Tabla; «:---», «:---:» y «---:» alinean la columna"],
    ["``` en una línea, el código, y ``` para cerrar", "Bloque de código; después de los primeros ``` puedes poner el lenguaje"],
    [":::pestanas  …  === Título  …  :::", "Pestañas: cada «=== Título» abre una pestaña (hasta 8)"],
    [":::tarjetas  …  === Título  …  :::", "Tarjetas en cuadrícula (hasta 8)"],
    [":::desplegable Título  …  :::", "Sección que se abre y se cierra"],
    ["---", "Línea separadora"],
  ];
  return (
    <details className="ed-guia">
      <summary>Guía de formato</summary>
      <table>
        <caption className="av-sr-only">Sintaxis admitida</caption>
        <thead>
          <tr>
            <th scope="col">Escribes</th>
            <th scope="col">Resultado</th>
          </tr>
        </thead>
        <tbody>
          {filas.map(([a, b]) => (
            <tr key={a}>
              <td>
                <code>{a}</code>
              </td>
              <td>{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="cr-field__hint">
        El texto nunca se interpreta como HTML. Los bloques se pueden anidar hasta 3 niveles; los títulos dentro de pestañas o avisos no entran
        al índice.
      </p>
    </details>
  );
}
