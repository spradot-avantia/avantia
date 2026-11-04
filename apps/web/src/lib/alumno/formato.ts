// Pequeños formateos de texto del creador para mostrarlo al estudiante (puros).

/** «Módulo 1: Pensar…» → «Pensar…». Las pantallas ya anteponen «Módulo N», así que el prefijo se repetía. */
export function nombreModulo(titulo: string): string {
  const limpio = titulo.replace(/^\s*m[oó]dulo\s*\d+\s*[:.\-–—)]\s*/i, "").trim();
  return limpio || titulo;
}

/** Quita el primer título de un texto en markdown si repite el título de la lección (que la página ya muestra). */
export function sinTituloRepetido(texto: string, tituloLeccion: string): string {
  const lineas = texto.split("\n");
  const i = lineas.findIndex((l) => l.trim() !== "");
  if (i < 0) return texto;
  const m = /^#{1,3}\s+(.+)$/.exec(lineas[i].trim());
  if (!m) return texto;
  const norm = (s: string) => s.replace(/[*_`]/g, "").trim().toLowerCase();
  if (norm(m[1]) !== norm(tituloLeccion)) return texto;
  return lineas.slice(i + 1).join("\n").replace(/^\s*\n/, "");
}
