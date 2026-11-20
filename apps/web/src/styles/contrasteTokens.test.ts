// Comprueba los pares de color críticos de Avantia en claro y en oscuro, leyendo
// los valores directo de las hojas de tokens para que no se vuelva atrás sin aviso.
// Texto: ≥ 4,5:1 (WCAG 1.4.3). Íconos y bordes con significado: ≥ 3:1 (WCAG 1.4.11).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contraste } from "../lib/creador/color";

function tokens(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of css.matchAll(/--av-([a-z0-9-]+):\s*(#[0-9a-f]{6})\b/gi)) {
    // Primera aparición: en tema-oscuro.css es el bloque oscuro (el de .av-claro viene después).
    if (!(m[1] in out)) out[m[1]] = m[2].toLowerCase();
  }
  return out;
}

const dir = join(process.cwd(), "src", "styles");
const claro = tokens(readFileSync(join(dir, "avantia-tokens.css"), "utf8"));
const oscuro = { ...claro, ...tokens(readFileSync(join(dir, "tema-oscuro.css"), "utf8")) };

const FONDOS = ["bg", "surface", "canvas", "side"];

const TEXTO = ["ink", "ink-2", "muted", "blue-700"];
const TEXTO_OSCURO = [...TEXTO, "subtle", "blue-400"];
const UI_OSCURO = ["blue-200", "blue-400"];

describe("tokens en claro", () => {
  it.each(TEXTO.flatMap((t) => FONDOS.map((f) => [t, f])))("%s sobre %s ≥ 4,5", (t, f) => {
    expect(contraste(claro[t], claro[f])).toBeGreaterThanOrEqual(4.5);
  });
  it("blanco sobre el botón primario ≥ 4,5", () => {
    expect(contraste("#ffffff", claro["blue-600"])).toBeGreaterThanOrEqual(4.5);
  });
});

describe("tokens en oscuro", () => {
  it.each(TEXTO_OSCURO.flatMap((t) => FONDOS.map((f) => [t, f])))("%s sobre %s ≥ 4,5", (t, f) => {
    expect(contraste(oscuro[t], oscuro[f])).toBeGreaterThanOrEqual(4.5);
  });
  it.each(["ink", "ink-2", "muted", "subtle"])("%s sobre surface-2 ≥ 4,5", (t) => {
    expect(contraste(oscuro[t], oscuro["surface-2"])).toBeGreaterThanOrEqual(4.5);
  });
  it.each(UI_OSCURO.flatMap((t) => ["bg", "surface"].map((f) => [t, f])))("%s (borde/ícono) sobre %s ≥ 3", (t, f) => {
    expect(contraste(oscuro[t], oscuro[f])).toBeGreaterThanOrEqual(3);
  });
  it("blanco sobre el botón primario ≥ 4,5", () => {
    expect(contraste("#ffffff", oscuro["blue-600"])).toBeGreaterThanOrEqual(4.5);
  });
  it.each([
    ["success", "success-bg"],
    ["danger-ink", "danger-bg"],
    ["warning-ink", "warning-bg"],
    ["violet-700", "violet-50"],
    ["blue-700", "blue-50"],
  ])("%s sobre %s ≥ 4,5", (t, f) => {
    expect(contraste(oscuro[t], oscuro[f])).toBeGreaterThanOrEqual(4.5);
  });

  // Cabecera del panel en oscuro: color-mix(in srgb, <marca -osc> 18%, surface) con texto ink.
  // Se prueba con colores de academia extremos (muy claro, saturados y oscuro).
  const mezcla = (a: string, b: string, pa: number) => {
    const c = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
    return `#${[1, 3, 5]
      .map((i) => Math.round(c(a, i) * pa + c(b, i) * (1 - pa)).toString(16).padStart(2, "0"))
      .join("")}`;
  };
  it.each(["#ffffff", "#ffd400", "#8fb1ff", "#ff6b6b", "#4fcf9f", "#1d4ed8"])(
    "texto de la cabecera sobre la banda teñida con %s ≥ 4,5",
    (marca) => {
      const banda = mezcla(marca, oscuro.surface, 0.18);
      expect(contraste(oscuro.ink, banda)).toBeGreaterThanOrEqual(4.5);
      expect(contraste(oscuro["ink-2"], banda)).toBeGreaterThanOrEqual(4.5);
    },
  );
});
