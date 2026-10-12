import { describe, expect, it } from "vitest";
import { PALETA_MARCA, ajustarParaAA, cumpleAASobreBlanco } from "./contraste";

describe("contraste de marca", () => {
  it("un color claro no cumple AA y el ajuste lo corrige conservando formato", () => {
    expect(cumpleAASobreBlanco("#fde68a")).toBe(false);
    const a = ajustarParaAA("#fde68a");
    expect(a).toMatch(/^#[0-9a-f]{6}$/);
    expect(cumpleAASobreBlanco(a)).toBe(true);
  });
  it("un color que ya cumple no cambia", () => {
    expect(ajustarParaAA("#0F766E")).toBe("#0f766e");
  });
  it("toda la paleta sugerida cumple AA", () => {
    for (const c of PALETA_MARCA) expect(cumpleAASobreBlanco(c)).toBe(true);
  });
});
