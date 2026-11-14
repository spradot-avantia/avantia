// Utilidades de color e identidad de la academia (puras, sin dependencias).

/** Iniciales (máx. 2) a partir del nombre de la academia. */
export function iniciales(nombre: string): string {
  const palabras = nombre
    .trim()
    .split(/\s+/)
    .filter((p) => /[\p{L}\p{N}]/u.test(p));
  if (palabras.length === 0) return "A";
  if (palabras.length === 1) return Array.from(palabras[0]).slice(0, 2).join("").toUpperCase();
  return (Array.from(palabras[0])[0] + Array.from(palabras[1])[0]).toUpperCase();
}

function canal(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function luminancia(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  return 0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255);
}

export function contraste(hexA: string, hexB: string): number {
  const [a, b] = [luminancia(hexA), luminancia(hexB)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

/** Color de texto (blanco o tinta Avantia) con mejor contraste sobre `fondo`. */
export function textoSobre(fondo: string): "#ffffff" | "#0a1029" {
  return contraste(fondo, "#ffffff") >= contraste(fondo, "#0a1029") ? "#ffffff" : "#0a1029";
}

/** true si el color elegido cumple AA (4.5:1) con su texto automático. */
export function cumpleAA(fondo: string): boolean {
  return contraste(fondo, textoSobre(fondo)) >= 4.5;
}

function aHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

/**
 * Variante del color de la academia para usarla COMO TEXTO (enlaces, pestaña activa, íconos)
 * sobre los fondos claros del sitio. Conserva el tono: mezcla el color con la tinta oscura
 * solo lo necesario para llegar a `minimo`:1 sobre `fondo` (por defecto el fondo más oscuro del sitio).
 * El color original se sigue usando para rellenos (botones, barras) con su texto automático.
 */
export function colorTexto(brand: string, fondo = "#faf9f6", minimo = 4.8): string {
  const m = /^#([0-9a-f]{6})$/i.exec(brand);
  if (!m) return brand;
  if (contraste(brand, fondo) >= minimo) return brand;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const [tr, tg, tb] = [0x0a, 0x10, 0x29];
  for (let t = 0.05; t <= 1.0001; t += 0.05) {
    const c = aHex(r + (tr - r) * t, g + (tg - g) * t, b + (tb - b) * t);
    if (contraste(c, fondo) >= minimo) return c;
  }
  return "#0a1029";
}
