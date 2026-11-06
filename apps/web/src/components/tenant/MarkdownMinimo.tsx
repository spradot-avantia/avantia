import type { ReactNode } from "react";
import "./ficha-curso.css";
import { indiceDeTitulos, parsearMarkdown, type Bloque, type Inline } from "../../lib/creador/markdown";

function inline(nodos: Inline[]): ReactNode[] {
  return nodos.map((n, i) => {
    if (n.t === "texto") return n.v;
    if (n.t === "negrita") return <strong key={i}>{inline(n.v)}</strong>;
    if (n.t === "cursiva") return <em key={i}>{inline(n.v)}</em>;
    return (
      <a key={i} href={n.href} target="_blank" rel="noopener noreferrer nofollow">
        {inline(n.v)}
      </a>
    );
  });
}

function bloque(b: Bloque, i: number, idTitulo?: string): ReactNode {
  if (b.t === "titulo") {
    const H = `h${b.nivel}` as "h2" | "h3" | "h4";
    return (
      <H key={i} id={idTitulo}>
        {inline(b.v)}
      </H>
    );
  }
  if (b.t === "lista") {
    const L = b.ordenada ? "ol" : "ul";
    return (
      <L key={i}>
        {b.items.map((it, j) => (
          <li key={j}>{inline(it)}</li>
        ))}
      </L>
    );
  }
  return <p key={i}>{inline(b.v)}</p>;
}

/** Renderiza el Markdown minimo de una leccion como elementos React (sin HTML crudo). */
export function MarkdownMinimo({ texto }: { texto: string }) {
  const bloques = parsearMarkdown(texto);
  // Los títulos llevan el mismo id que el índice de la lección (ADR 033).
  const ids = indiceDeTitulos(bloques).map((e) => e.id);
  let k = 0;
  return <div className="fc-md">{bloques.map((b, i) => bloque(b, i, b.t === "titulo" ? ids[k++] : undefined))}</div>;
}
