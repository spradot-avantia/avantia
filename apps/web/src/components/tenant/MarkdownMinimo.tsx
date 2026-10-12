import type { ReactNode } from "react";
import "./ficha-curso.css";
import { parsearMarkdown, type Bloque, type Inline } from "../../lib/creador/markdown";

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

function bloque(b: Bloque, i: number): ReactNode {
  if (b.t === "titulo") {
    const H = `h${b.nivel}` as "h2" | "h3" | "h4";
    return <H key={i}>{inline(b.v)}</H>;
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
  return <div className="fc-md">{parsearMarkdown(texto).map(bloque)}</div>;
}
