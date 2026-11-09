import type { ReactNode } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import "./ficha-curso.css";
import { indiceDeTitulos, parsearMarkdown, type Alineacion, type Bloque, type Inline } from "../../lib/creador/markdown";
import { PestanasTexto } from "./PestanasTexto";

/**
 * Fórmula LaTeX con KaTeX. El HTML lo genera KaTeX (no el creador): `trust: false` bloquea
 * \href, \url, \includegraphics y similares, y un error de sintaxis se muestra como texto rojo
 * en vez de romper la lección.
 */
function Mate({ v, bloque }: { v: string; bloque?: boolean }) {
  const html = katex.renderToString(v, { displayMode: !!bloque, throwOnError: false, trust: false, strict: "ignore", maxExpand: 1000, maxSize: 20 });
  const Tag = bloque ? "div" : "span";
  return <Tag className={bloque ? "fc-mate" : "fc-mate-linea"} dangerouslySetInnerHTML={{ __html: html }} />;
}

function inline(nodos: Inline[]): ReactNode[] {
  return nodos.map((n, i) => {
    if (n.t === "texto") return n.v;
    if (n.t === "mate") return <Mate key={i} v={n.v} />;
    if (n.t === "codigo") return <code key={i}>{n.v}</code>;
    if (n.t === "negrita") return <strong key={i}>{inline(n.v)}</strong>;
    if (n.t === "cursiva") return <em key={i}>{inline(n.v)}</em>;
    if (n.t === "tachado") return <del key={i}>{inline(n.v)}</del>;
    if (n.t === "resaltado") return <mark key={i}>{inline(n.v)}</mark>;
    return (
      <a key={i} href={n.href} target="_blank" rel="noopener noreferrer nofollow">
        {inline(n.v)}
      </a>
    );
  });
}

const CLASE_ALINEACION: Record<NonNullable<Alineacion>, string> = { izq: "fc-al-i", centro: "fc-al-c", der: "fc-al-d" };
const alin = (a: Alineacion) => (a ? CLASE_ALINEACION[a] : undefined);

function bloques(lista: Bloque[], ids?: string[]): ReactNode[] {
  let k = 0;
  return lista.map((b, i) => bloque(b, i, b.t === "titulo" ? ids?.[k++] : undefined));
}

function bloque(b: Bloque, i: number, idTitulo?: string): ReactNode {
  switch (b.t) {
    case "titulo": {
      const H = `h${b.nivel}` as "h2" | "h3" | "h4";
      return (
        <H key={i} id={idTitulo}>
          {inline(b.v)}
        </H>
      );
    }
    case "lista": {
      const L = b.ordenada ? "ol" : "ul";
      return (
        <L key={i} className={b.tareas ? "fc-tareas" : undefined}>
          {b.items.map((it, j) => {
            const marca = b.tareas?.[j];
            return (
              <li key={j}>
                {marca !== undefined && marca !== null && (
                  <>
                    <span className={`fc-tarea${marca ? " fc-tarea--hecha" : ""}`} aria-hidden="true" />
                    <span className="av-sr-only">{marca ? "Hecho: " : "Pendiente: "}</span>
                  </>
                )}
                {inline(it)}
              </li>
            );
          })}
        </L>
      );
    }
    case "cita":
      return <blockquote key={i}>{bloques(b.v)}</blockquote>;
    case "aviso":
      return (
        <aside key={i} className={`fc-aviso fc-aviso--${b.tipo}`}>
          <p className="fc-aviso__t">{b.titulo}</p>
          {bloques(b.v)}
        </aside>
      );
    case "codigo":
      return (
        <figure key={i} className="fc-codigo">
          {b.lenguaje && <figcaption>{b.lenguaje}</figcaption>}
          {/* tabIndex: las líneas largas se desplazan, y con teclado hay que poder llegar al bloque. */}
          <pre tabIndex={0}>
            <code>{b.v}</code>
          </pre>
        </figure>
      );
    case "separador":
      return <hr key={i} />;
    case "mate":
      return <Mate key={i} v={b.v} bloque />;
    case "tabla":
      return (
        <div key={i} className="fc-tabla" role="region" aria-label="Tabla" tabIndex={0}>
          <table>
            <thead>
              <tr>
                {b.cabecera.map((c, j) => (
                  <th key={j} scope="col" className={alin(b.alinear[j])}>
                    {inline(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.filas.map((f, r) => (
                <tr key={r}>
                  {f.map((c, j) => (
                    <td key={j} className={alin(b.alinear[j])}>
                      {inline(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "pestanas":
      return <PestanasTexto key={i} items={b.items.map((e) => ({ titulo: e.titulo, contenido: bloques(e.v) }))} />;
    case "tarjetas":
      return (
        <ul key={i} className="fc-tarjetas">
          {b.items.map((e, j) => (
            <li key={j} className="fc-tarjeta">
              <p className="fc-tarjeta__t">{e.titulo}</p>
              {bloques(e.v)}
            </li>
          ))}
        </ul>
      );
    case "desplegable":
      return (
        <details key={i} className="fc-desplegable">
          <summary>{b.titulo}</summary>
          <div className="fc-desplegable__cuerpo">{bloques(b.v)}</div>
        </details>
      );
    default:
      return <p key={i}>{inline(b.v)}</p>;
  }
}

/** Renderiza el Markdown ampliado de una leccion como elementos React (sin HTML crudo). */
export function MarkdownMinimo({ texto }: { texto: string }) {
  const arbol = parsearMarkdown(texto);
  // Los títulos llevan el mismo id que el índice de la lección (ADR 033).
  const ids = indiceDeTitulos(arbol).map((e) => e.id);
  return <div className="fc-md">{bloques(arbol, ids)}</div>;
}
