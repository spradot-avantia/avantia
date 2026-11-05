import { describe, expect, it } from "vitest";
import {
  FORMA_DEFECTO,
  FORMAS,
  TIPOGRAFIA_DEFECTO,
  TIPOGRAFIAS,
  clasesIdentidad,
  esForma,
  esTipografia,
  formaDe,
  tipografiaDe,
} from "./identidad";

describe("identidad por academia (ADR 027)", () => {
  it("acepta solo los valores de la lista cerrada", () => {
    for (const t of TIPOGRAFIAS) expect(esTipografia(t)).toBe(true);
    for (const f of FORMAS) expect(esForma(f)).toBe(true);
    for (const malo of ["", "Clasico", "comic-sans", "recta", null, undefined, 3, "clasico; x"]) expect(esTipografia(malo)).toBe(false);
    for (const malo of ["", "Suave", "redonda", "clasico", null, undefined, 1]) expect(esForma(malo)).toBe(false);
  });

  it("cae al default (apariencia de siempre) con valores nulos o desconocidos", () => {
    expect(tipografiaDe(null)).toBe(TIPOGRAFIA_DEFECTO);
    expect(tipografiaDe("otra")).toBe(TIPOGRAFIA_DEFECTO);
    expect(formaDe(undefined)).toBe(FORMA_DEFECTO);
    expect(formaDe("otra")).toBe(FORMA_DEFECTO);
    expect(TIPOGRAFIA_DEFECTO).toBe("clasico");
    expect(FORMA_DEFECTO).toBe("suave");
  });

  it("arma las clases del contenedor y nunca deja pasar texto libre", () => {
    expect(clasesIdentidad("editorial", "recta")).toBe("tn-tipo-editorial tn-forma-recta");
    expect(clasesIdentidad(null, null)).toBe("tn-tipo-clasico tn-forma-suave");
    expect(clasesIdentidad("x onclick=y", "<script>")).toBe("tn-tipo-clasico tn-forma-suave");
  });
});
