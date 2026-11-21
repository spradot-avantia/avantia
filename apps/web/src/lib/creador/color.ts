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

/* ---------- Marca sobre fondo oscuro (ADR 045) ---------- */

/** Fondos del modo oscuro (tema-oscuro.css): bg, surface y surface-2 (el más claro, el que manda). */
export const FONDOS_OSCUROS = ["#0c1020", "#151b30", "#1e2542"] as const;
/** Fondos claros donde se usa la marca como texto: el del sitio y el blanco de las tarjetas. */
export const FONDOS_CLAROS = ["#faf9f6", "#ffffff"] as const;
/** Fondo oscuro de referencia para mostrar el ratio al creador (las tarjetas del panel). */
export const FONDO_OSCURO_REF = "#151b30";

const HEX6 = /^#[0-9a-f]{6}$/i;

/** Peor contraste del color contra una lista de fondos. */
export function contrasteMinimo(hex: string, fondos: readonly string[]): number {
  return Math.min(...fondos.map((f) => contraste(hex, f)));
}

/** true si el color se lee como texto (≥ 4,5:1) sobre todos los fondos oscuros. */
export function cumpleAAEnOscuro(hex: string): boolean {
  return HEX6.test(hex) && contrasteMinimo(hex, FONDOS_OSCUROS) >= 4.5;
}

/**
 * Variante del color de la academia para el modo oscuro: conserva el tono y lo aclara
 * (mezcla con blanco) solo lo necesario para llegar a `minimo`:1 sobre todos los fondos oscuros.
 * Sirve como texto, ícono o borde, y como relleno con su texto automático (textoSobre).
 */
export function colorParaOscuro(brand: string, minimo = 4.5): string {
  const m = HEX6.exec(brand);
  if (!m) return "#8fb1ff";
  if (contrasteMinimo(brand, FONDOS_OSCUROS) >= minimo) return brand.toLowerCase();
  const n = parseInt(m[0].slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  for (let t = 0.05; t <= 1.0001; t += 0.05) {
    const c = aHex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t);
    if (contrasteMinimo(c, FONDOS_OSCUROS) >= minimo) return c;
  }
  return "#e9ecf8";
}

/** El color que se usa en oscuro: el que eligió el creador o, si no eligió, el automático. */
export function marcaOscura(claro: string, oscuro?: string | null): string {
  return oscuro && HEX6.test(oscuro) ? oscuro.toLowerCase() : colorParaOscuro(claro);
}

export interface AnalisisMarca {
  /** Color como texto sobre blanco (claro) y sobre la tarjeta oscura. */
  sobreClaro: number;
  sobreOscuro: number;
  /** Texto automático encima del color como relleno (botones). */
  textoEncimaClaro: number;
  textoEncimaOscuro: number;
  cumpleClaro: boolean;
  cumpleOscuro: boolean;
}

/** Ratios que ve el creador al elegir: su color en claro y su variante en oscuro. */
export function analizarMarca(claro: string, oscuro: string): AnalisisMarca {
  return {
    sobreClaro: contrasteMinimo(claro, FONDOS_CLAROS),
    sobreOscuro: contrasteMinimo(oscuro, FONDOS_OSCUROS),
    textoEncimaClaro: contraste(claro, textoSobre(claro)),
    textoEncimaOscuro: contraste(oscuro, textoSobre(oscuro)),
    cumpleClaro: contrasteMinimo(claro, FONDOS_CLAROS) >= 4.5,
    cumpleOscuro: contrasteMinimo(oscuro, FONDOS_OSCUROS) >= 4.5,
  };
}

/**
 * Variables CSS de la marca en claro y en oscuro para un contenedor (`cr` panel, `al` alumno).
 * El CSS elige: --{p}-brand = -claro, y en prefers-color-scheme: dark = -osc (tema-oscuro.css).
 * -text es la variante apta como TEXTO sobre el fondo (en oscuro, la misma variante oscura).
 */
export function varsMarca(prefijo: "cr" | "al", claro: string, oscuro?: string | null): Record<string, string> {
  const osc = marcaOscura(claro, oscuro);
  const p = `--${prefijo}`;
  return {
    [`${p}-brand-claro`]: claro,
    [`${p}-on-brand-claro`]: textoSobre(claro),
    [`${p}-brand-text-claro`]: colorTexto(claro),
    [`${p}-brand-osc`]: osc,
    [`${p}-on-brand-osc`]: textoSobre(osc),
  };
}
