import { describe, expect, it } from "vitest";
import { validarDominioPropio } from "./dominio";

const op = { dominiosRaiz: ["goavantia.com", "dev.goavantia.com"], hostsPlataforma: ["www.goavantia.com"] };

describe("validarDominioPropio", () => {
  it("acepta un dominio propio y lo normaliza", () => {
    expect(validarDominioPropio("  FinanzasClaras.cl. ", op)).toEqual({ ok: true, dominio: "finanzasclaras.cl" });
    expect(validarDominioPropio("cursos.miacademia.com", op)).toEqual({ ok: true, dominio: "cursos.miacademia.com" });
  });
  it("rechaza formatos inválidos y tipos raros", () => {
    for (const v of ["", "sinpunto", "-a.com", "a..com", "a.com/x", "a,b.com", 42, null]) {
      expect(validarDominioPropio(v, op).ok).toBe(false);
    }
  });
  it("rechaza dominios de la plataforma", () => {
    for (const v of ["goavantia.com", "www.goavantia.com", "otra.goavantia.com", "x.dev.goavantia.com", "a.localhost"]) {
      expect(validarDominioPropio(v, op).ok).toBe(false);
    }
  });
});
