// Markdown minimo para lecciones de texto. Modulo PURO: produce un arbol de
// datos (no HTML) que se renderiza como elementos React, asi que el texto del
// creador nunca se inyecta como HTML. Soporta: titulos (#, ##, ###), listas
// (- / * / 1.), parrafos, **negrita**, *cursiva* y [texto](https://enlace).
// Los enlaces solo se aceptan con https; cualquier otro esquema queda como texto.

export type Inline =
  | { t: "texto"; v: string }
  | { t: "negrita"; v: Inline[] }
  | { t: "cursiva"; v: Inline[] }
  | { t: "enlace"; href: string; v: Inline[] };

export type Bloque =
  | { t: "titulo"; nivel: 2 | 3 | 4; v: Inline[] }
  | { t: "parrafo"; v: Inline[] }
  | { t: "lista"; ordenada: boolean; items: Inline[][] };

function hrefSeguro(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "https:" || u.username || u.password) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function parsearInline(s: string): Inline[] {
  const out: Inline[] = [];
  let buf = "";
  const vaciar = () => {
    if (buf) out.push({ t: "texto", v: buf });
    buf = "";
  };
  let i = 0;
  while (i < s.length) {
    if (s.startsWith("**", i)) {
      const fin = s.indexOf("**", i + 2);
      if (fin > i + 2) {
        vaciar();
        out.push({ t: "negrita", v: parsearInline(s.slice(i + 2, fin)) });
        i = fin + 2;
        continue;
      }
    }
    if (s[i] === "*" && s[i + 1] !== "*" && s[i + 1] !== " ") {
      const fin = s.indexOf("*", i + 1);
      if (fin > i + 1 && s[fin - 1] !== " ") {
        vaciar();
        out.push({ t: "cursiva", v: parsearInline(s.slice(i + 1, fin)) });
        i = fin + 1;
        continue;
      }
    }
    if (s[i] === "[") {
      const m = /^\[([^\]]+)\]\(([^)\s]+)\)/.exec(s.slice(i));
      const href = m ? hrefSeguro(m[2]) : null;
      if (m && href) {
        vaciar();
        out.push({ t: "enlace", href, v: parsearInline(m[1]) });
        i += m[0].length;
        continue;
      }
    }
    buf += s[i];
    i++;
  }
  vaciar();
  return out;
}

export function parsearMarkdown(texto: string): Bloque[] {
  const lineas = texto.replace(/\r\n?/g, "\n").split("\n");
  const bloques: Bloque[] = [];
  let parrafo: string[] = [];
  let lista: { ordenada: boolean; items: Inline[][] } | null = null;

  const cerrarParrafo = () => {
    if (parrafo.length) bloques.push({ t: "parrafo", v: parsearInline(parrafo.join(" ")) });
    parrafo = [];
  };
  const cerrarLista = () => {
    if (lista) bloques.push({ t: "lista", ordenada: lista.ordenada, items: lista.items });
    lista = null;
  };

  for (const cruda of lineas) {
    const l = cruda.trim();
    if (!l) {
      cerrarParrafo();
      cerrarLista();
      continue;
    }
    const h = /^(#{1,3})\s+(.+)$/.exec(l);
    if (h) {
      cerrarParrafo();
      cerrarLista();
      // # => h2, ## => h3, ### => h4 (el h1 es el titulo de la pagina).
      bloques.push({ t: "titulo", nivel: (h[1].length + 1) as 2 | 3 | 4, v: parsearInline(h[2]) });
      continue;
    }
    const li = /^(?:([-*])|(\d+)[.)])\s+(.+)$/.exec(l);
    if (li) {
      cerrarParrafo();
      const ordenada = !li[1];
      if (lista && lista.ordenada !== ordenada) cerrarLista();
      if (!lista) lista = { ordenada, items: [] };
      lista.items.push(parsearInline(li[3]));
      continue;
    }
    cerrarLista();
    parrafo.push(l);
  }
  cerrarParrafo();
  cerrarLista();
  return bloques;
}

// ---------------------------------------------------------------------------
// Índice de títulos (ADR 033). Puro: el mismo árbol que se renderiza da los ids,
// así el índice y los títulos de la página nunca se desalinean.

export interface EntradaIndice {
  id: string;
  nivel: 2 | 3 | 4;
  texto: string;
}

/** Texto sin formato de un fragmento inline (para el índice y los ids). */
export function textoPlano(nodos: Inline[]): string {
  return nodos.map((n) => (n.t === "texto" ? n.v : textoPlano(n.v))).join("");
}

function slug(texto: string): string {
  const base = texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return base || "seccion";
}

/** Títulos del texto, en orden, con un id único dentro de la lección («sec-<slug>», «-2», «-3»…). */
export function indiceDeTitulos(bloques: Bloque[]): EntradaIndice[] {
  const usados = new Map<string, number>();
  const salida: EntradaIndice[] = [];
  for (const b of bloques) {
    if (b.t !== "titulo") continue;
    const texto = textoPlano(b.v).trim();
    const base = `sec-${slug(texto)}`;
    const n = (usados.get(base) ?? 0) + 1;
    usados.set(base, n);
    salida.push({ id: n === 1 ? base : `${base}-${n}`, nivel: b.nivel, texto });
  }
  return salida;
}
