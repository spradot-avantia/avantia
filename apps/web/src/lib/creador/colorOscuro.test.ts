import { describe, expect, it } from "vitest";
import { PALETA_MARCA } from "../../components/creador/marca/contraste";
import { FONDOS_OSCUROS, analizarMarca, colorParaOscuro, contrasteMinimo, cumpleAAEnOscuro, marcaOscura } from "./color";

describe("colorParaOscuro", () => {
  it.each([...PALETA_MARCA, "#000000", "#2563eb", "#facc15"])("%s llega a AA sobre todos los fondos oscuros", (c) => {
    const o = colorParaOscuro(c);
    expect(contrasteMinimo(o, FONDOS_OSCUROS)).toBeGreaterThanOrEqual(4.5);
    expect(cumpleAAEnOscuro(o)).toBe(true);
  });
  it("deja intacto un color que ya cumple en oscuro", () => {
    expect(colorParaOscuro("#facc15")).toBe("#facc15");
  });
  it("aclara lo mínimo: el azul de Avantia no termina en blanco", () => {
    const o = colorParaOscuro("#2563eb");
    expect(o).not.toBe("#ffffff");
    expect(contrasteMinimo(o, FONDOS_OSCUROS)).toBeLessThan(7);
  });
});

describe("marcaOscura y analizarMarca", () => {
  it("usa el color elegido por el creador si existe, si no el automático", () => {
    expect(marcaOscura("#0a1029", "#A5B4FC")).toBe("#a5b4fc");
    expect(marcaOscura("#0a1029", null)).toBe(colorParaOscuro("#0a1029"));
    expect(marcaOscura("#0a1029", "nope")).toBe(colorParaOscuro("#0a1029"));
  });
  it("informa ratios en claro y en oscuro", () => {
    const a = analizarMarca("#0a1029", marcaOscura("#0a1029"));
    expect(a.cumpleClaro).toBe(true);
    expect(a.cumpleOscuro).toBe(true);
    expect(analizarMarca("#0a1029", "#0a1029").cumpleOscuro).toBe(false);
    expect(a.textoEncimaOscuro).toBeGreaterThanOrEqual(4.5);
  });
});
