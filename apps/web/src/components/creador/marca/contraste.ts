// Ajuste de contraste AA para el color de la academia (puro, sin dependencias).
// El color se usa como texto/enlace/borde sobre fondo blanco, asi que debe
// tener >= 4.5:1 contra blanco. (Sobre el color, el texto se elige solo.)
import { contraste } from "../../../lib/creador/color";

export const PALETA_MARCA = ["#0F766E", "#2563EB", "#7C3AED", "#B45309", "#BE185D", "#0A1029", "#15803D", "#0369A1"] as const;

const AA = 4.5;

export function ratioSobreBlanco(hex: string): number {
  return contraste(hex, "#ffffff");
}

export function cumpleAASobreBlanco(hex: string): boolean {
  return ratioSobreBlanco(hex) >= AA;
}

function aHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

function deHsl(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const hex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/** Oscurece el color (mismo tono) hasta cumplir AA sobre blanco. */
export function ajustarParaAA(hex: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex) || cumpleAASobreBlanco(hex)) return hex.toLowerCase();
  const [h, s, l0] = aHsl(hex);
  for (let l = l0; l >= 0; l -= 0.01) {
    const c = deHsl(h, s, Math.max(l, 0));
    if (cumpleAASobreBlanco(c)) return c;
  }
  return "#0a1029";
}
