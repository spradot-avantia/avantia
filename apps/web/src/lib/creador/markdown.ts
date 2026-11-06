// Markdown ampliado para lecciones de texto (ADR 035). Modulo PURO: produce un arbol
// de datos (no HTML) que se renderiza como elementos React, asi que el texto del
// creador nunca se inyecta como HTML.
//
// Inline: **negrita**, *cursiva*, ~~tachado~~, ==resaltado==, `codigo` y
// [texto](https://enlace) (solo https; cualquier otro esquema queda como texto).
// Bloques: titulos (#, ##, ###), parrafos, listas (- / * / 1.) y de tareas (- [ ] / - [x]),
// tablas con barras, citas (>), avisos estilo Obsidian (> [!nota] Titulo), bloques de
// codigo (```), separadores (---) y contenedores :::pestanas, :::tarjetas y
// :::desplegable Titulo (en pestanas y tarjetas cada elemento empieza con "=== Titulo").

export type Inline =
  | { t: "texto"; v: string }
  | { t: "codigo"; v: string }
  | { t: "negrita"; v: Inline[] }
  | { t: "cursiva"; v: Inline[] }
  | { t: "tachado"; v: Inline[] }
  | { t: "resaltado"; v: Inline[] }
  | { t: "enlace"; href: string; v: Inline[] };

export type TipoAviso = "nota" | "consejo" | "importante" | "advertencia";
export type Alineacion = "izq" | "centro" | "der" | null;

export interface Elemento {
  titulo: string;
  v: Bloque[];
}

export type Bloque =
  | { t: "titulo"; nivel: 2 | 3 | 4; v: Inline[] }
  | { t: "parrafo"; v: Inline[] }
  /** `tareas` (si existe) va en paralelo a `items`: true/false = casilla marcada o no; null = ítem normal. */
  | { t: "lista"; ordenada: boolean; items: Inline[][]; tareas?: (boolean | null)[] }
  | { t: "cita"; v: Bloque[] }
  | { t: "aviso"; tipo: TipoAviso; titulo: string; v: Bloque[] }
  | { t: "codigo"; lenguaje: string; v: string }
  | { t: "separador" }
  | { t: "tabla"; alinear: Alineacion[]; cabecera: Inline[][]; filas: Inline[][][] }
  | { t: "pestanas"; items: Elemento[] }
  | { t: "tarjetas"; items: Elemento[] }
  | { t: "desplegable"; titulo: string; v: Bloque[] };

/** Límites para que un texto enorme o malicioso no cueste de más al parsear ni al renderizar. */
export const MAX_PROFUNDIDAD = 3;
export const MAX_ELEMENTOS = 8;
export const MAX_COLUMNAS = 8;
export const MAX_FILAS = 200;
const MAX_TITULO = 80;

export const ETIQUETA_AVISO: Record<TipoAviso, string> = {
  nota: "Nota",
  consejo: "Consejo",
  importante: "Importante",
  advertencia: "Advertencia",
};

const ALIAS_AVISO: Record<string, TipoAviso> = {
  nota: "nota",
  note: "nota",
  info: "nota",
  consejo: "consejo",
  tip: "consejo",
  hint: "consejo",
  importante: "importante",
  important: "importante",
  advertencia: "advertencia",
  warning: "advertencia",
  caution: "advertencia",
  cuidado: "advertencia",
  peligro: "advertencia",
  danger: "advertencia",
};

function hrefSeguro(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "https:" || u.username || u.password) return null;
    return u.toString();
  } catch {
    return null;
  }
}

const PARES = [
  ["**", "negrita"],
  ["~~", "tachado"],
  ["==", "resaltado"],
] as const;

export function parsearInline(s: string): Inline[] {
  const out: Inline[] = [];
  let buf = "";
  const vaciar = () => {
    if (buf) out.push({ t: "texto", v: buf });
    buf = "";
  };
  let i = 0;
  while (i < s.length) {
    if (s[i] === "`") {
      const fin = s.indexOf("`", i + 1);
      if (fin > i + 1) {
        vaciar();
        out.push({ t: "codigo", v: s.slice(i + 1, fin) });
        i = fin + 1;
        continue;
      }
    }
    let consumido = false;
    for (const [marca, t] of PARES) {
      if (!s.startsWith(marca, i)) continue;
      const fin = s.indexOf(marca, i + 2);
      if (fin > i + 2) {
        vaciar();
        out.push({ t, v: parsearInline(s.slice(i + 2, fin)) });
        i = fin + 2;
        consumido = true;
      }
      break;
    }
    if (consumido) continue;
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

// ---------------------------------------------------------------------------
// Bloques

const RE_FENCE = /^```\s*([\w+#.-]{0,20})\s*$/;
const RE_CONTENEDOR = /^:::\s*(pestanas|pestañas|tarjetas|desplegable)\b\s*(.*)$/i;
const RE_HR = /^(?:-{3,}|\*{3,}|_{3,})$/;
const RE_DELIM = /^\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)*\|?$/;
const RE_ELEMENTO = /^===\s*(.+)$/;

/** Separa las celdas de una fila de tabla (`\|` es una barra literal). */
function celdas(linea: string): string[] {
  let l = linea.trim();
  if (l.startsWith("|")) l = l.slice(1);
  if (l.endsWith("|") && !l.endsWith("\\|")) l = l.slice(0, -1);
  const out: string[] = [];
  let cur = "";
  for (let i = 0; i < l.length; i++) {
    if (l[i] === "\\" && l[i + 1] === "|") {
      cur += "|";
      i++;
    } else if (l[i] === "|") {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += l[i];
    }
  }
  out.push(cur.trim());
  return out;
}

function alineacion(c: string): Alineacion {
  const ini = c.startsWith(":");
  const fin = c.endsWith(":");
  return ini && fin ? "centro" : fin ? "der" : ini ? "izq" : null;
}

/** Índice de la línea `:::` que cierra el contenedor abierto antes de `desde` (o el final si no cierra). */
function cierreContenedor(lineas: string[], desde: number): number {
  let prof = 0;
  let enCodigo = false;
  for (let k = desde; k < lineas.length; k++) {
    const t = lineas[k].trim();
    if (t.startsWith("```")) {
      enCodigo = !enCodigo;
      continue;
    }
    if (enCodigo) continue;
    if (t === ":::") {
      if (prof === 0) return k;
      prof--;
    } else if (RE_CONTENEDOR.test(t)) {
      prof++;
    }
  }
  return lineas.length;
}

function dividirElementos(cuerpo: string[], prof: number): Elemento[] {
  const grupos: { titulo: string; lineas: string[] }[] = [];
  let nivel = 0;
  let enCodigo = false;
  for (const raw of cuerpo) {
    const t = raw.trim();
    if (t.startsWith("```")) enCodigo = !enCodigo;
    if (!enCodigo) {
      if (t === ":::") nivel = Math.max(0, nivel - 1);
      else if (RE_CONTENEDOR.test(t)) nivel++;
      else if (nivel === 0) {
        const m = RE_ELEMENTO.exec(t);
        if (m) {
          grupos.push({ titulo: m[1].trim().slice(0, MAX_TITULO), lineas: [] });
          continue;
        }
      }
    }
    grupos.at(-1)?.lineas.push(raw);
  }
  return grupos.slice(0, MAX_ELEMENTOS).map((g) => ({ titulo: g.titulo, v: parsearLineas(g.lineas, prof + 1) }));
}

function parsearLineas(lineas: string[], prof: number): Bloque[] {
  const bloques: Bloque[] = [];
  let parrafo: string[] = [];
  let lista: { ordenada: boolean; items: Inline[][]; tareas: (boolean | null)[] } | null = null;

  const cerrarParrafo = () => {
    if (parrafo.length) bloques.push({ t: "parrafo", v: parsearInline(parrafo.join(" ")) });
    parrafo = [];
  };
  const cerrarLista = () => {
    if (lista) {
      const b: Bloque = { t: "lista", ordenada: lista.ordenada, items: lista.items };
      if (lista.tareas.some((x) => x !== null)) b.tareas = lista.tareas;
      bloques.push(b);
    }
    lista = null;
  };
  const cerrar = () => {
    cerrarParrafo();
    cerrarLista();
  };

  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i].trim();
    if (!l) {
      cerrar();
      continue;
    }

    // Bloque de código: se conserva el texto tal cual, sin interpretar nada.
    const f = RE_FENCE.exec(l);
    if (f) {
      cerrar();
      const cuerpo: string[] = [];
      i++;
      while (i < lineas.length && lineas[i].trim() !== "```") cuerpo.push(lineas[i++]);
      bloques.push({ t: "codigo", lenguaje: f[1], v: cuerpo.join("\n") });
      continue;
    }

    // Contenedores :::pestanas, :::tarjetas, :::desplegable
    const c = prof < MAX_PROFUNDIDAD ? RE_CONTENEDOR.exec(l) : null;
    if (c) {
      cerrar();
      const fin = cierreContenedor(lineas, i + 1);
      const cuerpo = lineas.slice(i + 1, fin);
      const tipo = c[1].toLowerCase();
      if (tipo === "desplegable") {
        bloques.push({ t: "desplegable", titulo: c[2].trim().slice(0, MAX_TITULO) || "Ver más", v: parsearLineas(cuerpo, prof + 1) });
      } else {
        const items = dividirElementos(cuerpo, prof);
        if (items.length) bloques.push({ t: tipo === "tarjetas" ? "tarjetas" : "pestanas", items });
        else bloques.push(...parsearLineas(cuerpo, prof + 1));
      }
      i = fin;
      continue;
    }

    // Citas y avisos
    if (l.startsWith(">") && prof < MAX_PROFUNDIDAD) {
      cerrar();
      const cuerpo: string[] = [];
      while (i < lineas.length && lineas[i].trim().startsWith(">")) cuerpo.push(lineas[i++].trim().replace(/^>\s?/, ""));
      i--;
      const a = /^\[!([A-Za-záéíóúñÁÉÍÓÚÑ]+)\]\s*(.*)$/.exec(cuerpo[0].trim());
      const tipo = a ? ALIAS_AVISO[a[1].toLowerCase()] : undefined;
      if (a && tipo) {
        bloques.push({
          t: "aviso",
          tipo,
          titulo: a[2].trim().slice(0, MAX_TITULO) || ETIQUETA_AVISO[tipo],
          v: parsearLineas(cuerpo.slice(1), prof + 1),
        });
      } else {
        bloques.push({ t: "cita", v: parsearLineas(cuerpo, prof + 1) });
      }
      continue;
    }

    if (RE_HR.test(l)) {
      cerrar();
      bloques.push({ t: "separador" });
      continue;
    }

    // Tabla: fila de encabezado con barras + fila de guiones con el mismo número de columnas.
    if (l.includes("|") && i + 1 < lineas.length) {
      const delim = lineas[i + 1].trim();
      const cab = celdas(l);
      if (delim.includes("|") && RE_DELIM.test(delim) && celdas(delim).length === cab.length) {
        cerrar();
        const n = Math.min(cab.length, MAX_COLUMNAS);
        const alinear = celdas(delim).slice(0, n).map(alineacion);
        const filas: Inline[][][] = [];
        i += 2;
        while (i < lineas.length && lineas[i].trim() && lineas[i].includes("|") && filas.length < MAX_FILAS) {
          const fila = celdas(lineas[i++]).slice(0, n);
          while (fila.length < n) fila.push("");
          filas.push(fila.map(parsearInline));
        }
        i--;
        bloques.push({ t: "tabla", alinear, cabecera: cab.slice(0, n).map(parsearInline), filas });
        continue;
      }
    }

    const h = /^(#{1,3})\s+(.+)$/.exec(l);
    if (h) {
      cerrar();
      // # => h2, ## => h3, ### => h4 (el h1 es el titulo de la pagina).
      bloques.push({ t: "titulo", nivel: (h[1].length + 1) as 2 | 3 | 4, v: parsearInline(h[2]) });
      continue;
    }

    const li = /^(?:([-*])|(\d+)[.)])\s+(.+)$/.exec(l);
    if (li) {
      cerrarParrafo();
      const ordenada = !li[1];
      if (lista && lista.ordenada !== ordenada) cerrarLista();
      if (!lista) lista = { ordenada, items: [], tareas: [] };
      let texto = li[3];
      let marca: boolean | null = null;
      if (!ordenada) {
        const tk = /^\[( |x|X)\]\s+(.+)$/.exec(texto);
        if (tk) {
          marca = tk[1] !== " ";
          texto = tk[2];
        }
      }
      lista.items.push(parsearInline(texto));
      lista.tareas.push(marca);
      continue;
    }

    cerrarLista();
    parrafo.push(l);
  }
  cerrar();
  return bloques;
}

export function parsearMarkdown(texto: string): Bloque[] {
  return parsearLineas(texto.replace(/\r\n?/g, "\n").split("\n"), 0);
}

// ---------------------------------------------------------------------------
// Índice de títulos (ADR 033). Puro: el mismo árbol que se renderiza da los ids,
// así el índice y los títulos de la página nunca se desalinean. Solo cuenta los
// títulos del nivel superior (no los que están dentro de pestañas, tarjetas o avisos).

export interface EntradaIndice {
  id: string;
  nivel: 2 | 3 | 4;
  texto: string;
}

/** Texto sin formato de un fragmento inline (para el índice y los ids). */
export function textoPlano(nodos: Inline[]): string {
  return nodos.map((n) => (n.t === "texto" || n.t === "codigo" ? n.v : textoPlano(n.v))).join("");
}

function slug(texto: string): string {
  const base = texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
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
