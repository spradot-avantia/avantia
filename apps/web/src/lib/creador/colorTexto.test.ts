import { describe, expect, it } from "vitest";
import { colorTexto, contraste } from "./color";

describe("colorTexto", () => {
  it("deja intacto un color que ya cumple AA como texto", () => {
    expect(colorTexto("#0b1f4d")).toBe("#0b1f4d");
  });
  it.each(["#facc15", "#67e8f9", "#f9a8d4", "#f97316", "#16a34a", "#9ca3af", "#ffffff", "#7c3aed"])(
    "%s llega a AA sobre el fondo del sitio",
    (c) => {
      const t = colorTexto(c);
      expect(contraste(t, "#faf9f6")).toBeGreaterThanOrEqual(4.5);
      expect(contraste(t, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    },
  );
  it("ignora valores que no son hex de 6 dígitos", () => {
    expect(colorTexto("rojo")).toBe("rojo");
  });
});
