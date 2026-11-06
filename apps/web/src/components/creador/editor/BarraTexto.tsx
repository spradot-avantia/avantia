"use client";

// Barra de herramientas del texto de la lección (ADR 035). Opera sobre el textarea por su id:
// lee la selección, aplica la acción pura de `markdownEditor` y devuelve el texto nuevo.
import type { KeyboardEvent, ReactNode } from "react";
import { GRUPOS_BARRA, accionDeAtajo, aplicarAccion, type Accion } from "../../../lib/creador/markdownEditor";


/** Íconos de la barra (viewBox 24, trazo de 1,8). Los de texto imitan a Word: B, I, H1, H2. */
const T = (props: { children: string; cls?: string }) => (
  <span className={`ed-ico-t ${props.cls ?? ""}`} aria-hidden="true">
    {props.children}
  </span>
);
const Svg = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const ICONOS: Record<Accion, ReactNode> = {
  negrita: <T cls="ed-ico-t--b">B</T>,
  cursiva: <T cls="ed-ico-t--i">I</T>,
  resaltado: (
    <Svg>
      <path d="M4 21h16" />
      <path d="M14.5 4.5l5 5L10 19H5v-5z" />
    </Svg>
  ),
  codigo: (
    <Svg>
      <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" />
    </Svg>
  ),
  enlace: (
    <Svg>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </Svg>
  ),
  titulo: <T>H1</T>,
  subtitulo: <T>H2</T>,
  lista: (
    <Svg>
      <path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01" />
    </Svg>
  ),
  numerada: (
    <Svg>
      <path d="M10 6h11M10 12h11M10 18h11" />
      <path d="M4 5l1.5-1v5M3.5 14.5c0-1 2.5-1 2.5.3 0 1-2.5 1.7-2.5 2.7H6M3.5 20.5H6l-1.5-1.6" />
    </Svg>
  ),
  tareas: (
    <Svg>
      <rect x="3" y="3.5" width="7" height="7" rx="1.5" />
      <path d="M5 7l1.5 1.5L9 5.5M13 7h8" />
      <rect x="3" y="13.5" width="7" height="7" rx="1.5" />
      <path d="M13 17h8" />
    </Svg>
  ),
  cita: (
    <Svg>
      <path d="M10 17H6a2 2 0 0 1-2-2v-3a4 4 0 0 1 4-4M20 17h-4a2 2 0 0 1-2-2v-3a4 4 0 0 1 4-4" />
    </Svg>
  ),
  separador: (
    <Svg>
      <path d="M4 12h16M8 6h8M8 18h8" />
    </Svg>
  ),
  tabla: (
    <Svg>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18M3 15h18M9 4v16" />
    </Svg>
  ),
  "bloque-codigo": (
    <Svg>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M10 9l-3 3 3 3M14 9l3 3-3 3" />
    </Svg>
  ),
  nota: (
    <Svg>
      <path d="M5 4h14v12H9l-4 4z" />
    </Svg>
  ),
  consejo: (
    <Svg>
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.5 1.1.5 2.1h6c0-1 0-1.7.5-2.1A6 6 0 0 0 12 3z" />
    </Svg>
  ),
  importante: (
    <Svg>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6M12 16.5h.01" />
    </Svg>
  ),
  advertencia: (
    <Svg>
      <path d="M12 3l10 18H2z" />
      <path d="M12 10v5M12 18h.01" />
    </Svg>
  ),
  pestanas: (
    <Svg>
      <rect x="3" y="9" width="18" height="11" rx="2" />
      <path d="M3 9V6h7v3M13 9V6h8" />
    </Svg>
  ),
  tarjetas: (
    <Svg>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </Svg>
  ),
  desplegable: (
    <Svg>
      <rect x="3" y="4" width="18" height="7" rx="1.5" />
      <path d="M9 6.5l3 2 3-2M3 16h18M3 20h12" />
    </Svg>
  ),
};

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
                {ICONOS[b.accion]}
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
