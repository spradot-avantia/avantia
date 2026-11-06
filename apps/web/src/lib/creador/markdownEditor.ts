// Acciones de la barra de herramientas del texto de la lección (ADR 035). PURO: recibe
// el texto y la selección, y devuelve el texto nuevo y la selección que debe quedar.

export type Accion =
  | "negrita"
  | "cursiva"
  | "resaltado"
  | "codigo"
  | "enlace"
  | "titulo"
  | "subtitulo"
  | "lista"
  | "numerada"
  | "tareas"
  | "cita"
  | "nota"
  | "consejo"
  | "importante"
  | "advertencia"
  | "tabla"
  | "bloque-codigo"
  | "pestanas"
  | "tarjetas"
  | "desplegable"
  | "separador";

export interface Edicion {
  texto: string;
  ini: number;
  fin: number;
}

const ENVOLTURA: Partial<Record<Accion, { marca: string; ejemplo: string }>> = {
  negrita: { marca: "**", ejemplo: "texto en negrita" },
  cursiva: { marca: "*", ejemplo: "texto en cursiva" },
  resaltado: { marca: "==", ejemplo: "texto resaltado" },
  codigo: { marca: "`", ejemplo: "código" },
};

const PREFIJO: Partial<Record<Accion, string>> = {
  titulo: "# ",
  subtitulo: "## ",
  lista: "- ",
  tareas: "- [ ] ",
  cita: "> ",
};

const TIPO_AVISO: Partial<Record<Accion, string>> = {
  nota: "nota",
  consejo: "consejo",
  importante: "importante",
  advertencia: "advertencia",
};

/** Plantillas de bloque: `sel` es el fragmento que queda seleccionado para escribir encima. */
const PLANTILLAS: Partial<Record<Accion, { texto: string; sel: string }>> = {
  tabla: {
    texto: "| Columna 1 | Columna 2 | Columna 3 |\n| --- | --- | --- |\n| Dato | Dato | Dato |\n| Dato | Dato | Dato |",
    sel: "Columna 1",
  },
  pestanas: {
    texto: ":::pestanas\n=== Primera pestaña\nContenido de la primera pestaña.\n\n=== Segunda pestaña\nContenido de la segunda pestaña.\n:::",
    sel: "Primera pestaña",
  },
  tarjetas: {
    texto: ":::tarjetas\n=== Primera tarjeta\nUna idea breve.\n\n=== Segunda tarjeta\nOtra idea breve.\n\n=== Tercera tarjeta\nUna más.\n:::",
    sel: "Primera tarjeta",
  },
  desplegable: {
    texto: ":::desplegable Pregunta o título\nRespuesta o contenido que se muestra al abrir.\n:::",
    sel: "Pregunta o título",
  },
  separador: { texto: "---", sel: "" },
};

/** Inserta un bloque en la selección, separándolo con líneas en blanco del texto vecino. */
function insertarBloque(texto: string, ini: number, fin: number, bloque: string, selIni: number, selFin: number): Edicion {
  // Sin selección y con el cursor dentro de una línea con texto, el bloque va después de esa línea
  // (si no, la línea quedaría partida en dos).
  if (ini === fin) {
    const inicioLinea = texto.lastIndexOf("\n", ini - 1) + 1;
    const f = texto.indexOf("\n", ini);
    const finLinea = f === -1 ? texto.length : f;
    if (ini > inicioLinea && finLinea > inicioLinea) ini = fin = finLinea;
  }
  const antes = texto.slice(0, ini);
  const despues = texto.slice(fin);
  const pre = !antes ? "" : antes.endsWith("\n\n") ? "" : antes.endsWith("\n") ? "\n" : "\n\n";
  const post = !despues ? "\n" : despues.startsWith("\n\n") ? "" : despues.startsWith("\n") ? "\n" : "\n\n";
  const base = antes.length + pre.length;
  return { texto: antes + pre + bloque + post + despues, ini: base + selIni, fin: base + selFin };
}

function envolver(texto: string, ini: number, fin: number, marca: string, ejemplo: string): Edicion {
  const m = marca.length;
  // Ya envuelto por fuera de la selección (o por dentro): se quita.
  if (texto.slice(Math.max(0, ini - m), ini) === marca && texto.slice(fin, fin + m) === marca && ini !== fin) {
    return { texto: texto.slice(0, ini - m) + texto.slice(ini, fin) + texto.slice(fin + m), ini: ini - m, fin: fin - m };
  }
  const sel = texto.slice(ini, fin);
  if (sel.length > 2 * m && sel.startsWith(marca) && sel.endsWith(marca)) {
    const dentro = sel.slice(m, sel.length - m);
    return { texto: texto.slice(0, ini) + dentro + texto.slice(fin), ini, fin: ini + dentro.length };
  }
  const cuerpo = sel || ejemplo;
  return { texto: texto.slice(0, ini) + marca + cuerpo + marca + texto.slice(fin), ini: ini + m, fin: ini + m + cuerpo.length };
}

function porLineas(texto: string, ini: number, fin: number, accion: Accion): Edicion {
  const desde = texto.lastIndexOf("\n", ini - 1) + 1;
  let hasta = texto.indexOf("\n", fin);
  if (hasta === -1) hasta = texto.length;
  const lineas = texto.slice(desde, hasta).split("\n");
  const prefijo = PREFIJO[accion];

  let nuevas: string[];
  if (accion === "numerada") {
    const todas = lineas.every((l) => /^\d+[.)]\s/.test(l));
    nuevas = todas ? lineas.map((l) => l.replace(/^\d+[.)]\s/, "")) : lineas.map((l, i) => `${i + 1}. ${l.replace(/^\d+[.)]\s/, "")}`);
  } else if (prefijo) {
    // Títulos: un prefijo sustituye al otro; el resto de acciones alterna (quita si ya estaba en todas las líneas).
    const esTitulo = accion === "titulo" || accion === "subtitulo";
    const quitar = (l: string) => (esTitulo ? l.replace(/^#{1,3}\s+/, "") : l.startsWith(prefijo) ? l.slice(prefijo.length) : l);
    const todas = lineas.every((l) => l.startsWith(prefijo));
    nuevas = todas ? lineas.map(quitar) : lineas.map((l) => prefijo + quitar(l));
  } else {
    nuevas = lineas;
  }
  const bloque = nuevas.join("\n");
  return { texto: texto.slice(0, desde) + bloque + texto.slice(hasta), ini: desde, fin: desde + bloque.length };
}

export function aplicarAccion(texto: string, ini: number, fin: number, accion: Accion): Edicion {
  if (ini > fin) [ini, fin] = [fin, ini];

  const env = ENVOLTURA[accion];
  if (env) return envolver(texto, ini, fin, env.marca, env.ejemplo);

  if (accion === "enlace") {
    const etiqueta = texto.slice(ini, fin) || "texto del enlace";
    const url = "https://";
    const nuevo = `[${etiqueta}](${url})`;
    const urlIni = ini + etiqueta.length + 3;
    // Con texto ya elegido se deja seleccionada la dirección; sin texto, la etiqueta.
    return ini === fin
      ? { texto: texto.slice(0, ini) + nuevo + texto.slice(fin), ini: ini + 1, fin: ini + 1 + etiqueta.length }
      : { texto: texto.slice(0, ini) + nuevo + texto.slice(fin), ini: urlIni, fin: urlIni + url.length };
  }

  if (PREFIJO[accion] || accion === "numerada") return porLineas(texto, ini, fin, accion);

  const tipo = TIPO_AVISO[accion];
  if (tipo) {
    const cabecera = `> [!${tipo}] Título`;
    const cuerpo = (texto.slice(ini, fin).trim() || "Escribe aquí el mensaje.")
      .split("\n")
      .map((l) => `> ${l}`)
      .join("\n");
    return insertarBloque(texto, ini, fin, `${cabecera}\n${cuerpo}`, cabecera.length - "Título".length, cabecera.length);
  }

  if (accion === "bloque-codigo") {
    const cuerpo = texto.slice(ini, fin) || "código";
    const abre = "```\n";
    return insertarBloque(texto, ini, fin, `${abre}${cuerpo}\n\`\`\``, abre.length, abre.length + cuerpo.length);
  }

  const p = PLANTILLAS[accion];
  if (p) {
    const i = p.sel ? p.texto.indexOf(p.sel) : p.texto.length;
    return insertarBloque(texto, ini, fin, p.texto, i, i + p.sel.length);
  }
  return { texto, ini, fin };
}

/** Definición de los botones de la barra, agrupados. */
export const GRUPOS_BARRA: ReadonlyArray<{
  nombre: string;
  botones: ReadonlyArray<{ accion: Accion; etiqueta: string; titulo: string }>;
}> = [
  {
    nombre: "Texto",
    botones: [
      { accion: "negrita", etiqueta: "Negrita", titulo: "Negrita (Ctrl+B)" },
      { accion: "cursiva", etiqueta: "Cursiva", titulo: "Cursiva (Ctrl+I)" },
      { accion: "resaltado", etiqueta: "Resaltar", titulo: "Resaltar" },
      { accion: "codigo", etiqueta: "</>", titulo: "Código en la línea" },
      { accion: "enlace", etiqueta: "Enlace", titulo: "Enlace (Ctrl+K)" },
    ],
  },
  {
    nombre: "Estructura",
    botones: [
      { accion: "titulo", etiqueta: "Título", titulo: "Título de sección" },
      { accion: "subtitulo", etiqueta: "Subtítulo", titulo: "Subtítulo" },
      { accion: "lista", etiqueta: "• Lista", titulo: "Lista con viñetas" },
      { accion: "numerada", etiqueta: "1. Lista", titulo: "Lista numerada" },
      { accion: "tareas", etiqueta: "☐ Tareas", titulo: "Lista de tareas" },
      { accion: "cita", etiqueta: "Cita", titulo: "Cita" },
      { accion: "separador", etiqueta: "Línea", titulo: "Línea separadora" },
    ],
  },
  {
    nombre: "Bloques",
    botones: [
      { accion: "tabla", etiqueta: "Tabla", titulo: "Tabla" },
      { accion: "bloque-codigo", etiqueta: "Código", titulo: "Bloque de código" },
      { accion: "nota", etiqueta: "Nota", titulo: "Aviso: nota" },
      { accion: "consejo", etiqueta: "Consejo", titulo: "Aviso: consejo" },
      { accion: "importante", etiqueta: "Importante", titulo: "Aviso: importante" },
      { accion: "advertencia", etiqueta: "Advertencia", titulo: "Aviso: advertencia" },
      { accion: "pestanas", etiqueta: "Pestañas", titulo: "Pestañas" },
      { accion: "tarjetas", etiqueta: "Tarjetas", titulo: "Tarjetas" },
      { accion: "desplegable", etiqueta: "Desplegable", titulo: "Sección desplegable" },
    ],
  },
];

/** Atajo de teclado → acción (Ctrl o ⌘ + letra). */
export function accionDeAtajo(e: { key: string; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean }): Accion | null {
  if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return null;
  const k = e.key.toLowerCase();
  return k === "b" ? "negrita" : k === "i" ? "cursiva" : k === "k" ? "enlace" : null;
}
