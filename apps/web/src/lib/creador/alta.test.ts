import { describe, expect, it } from "vitest";
import { derivarSubdominio, errorSubdominio, mapearErrorAlta } from "./alta";

describe("derivarSubdominio", () => {
  it("deriva guiones, minusculas y sin tildes", () => {
    expect(derivarSubdominio("Academia de Juan")).toBe("academia-de-juan");
    expect(derivarSubdominio("  Ñandú & Cía.  ")).toBe("nandu-cia");
    expect(derivarSubdominio("Yoga---Pro!!")).toBe("yoga-pro");
  });
  it("trunca a 40 sin guion final", () => {
    const s = derivarSubdominio("a".repeat(39) + " bbbbbb");
    expect(s.length).toBeLessThanOrEqual(40);
    expect(s.endsWith("-")).toBe(false);
  });
  it("devuelve vacio si no hay caracteres utiles", () => {
    expect(derivarSubdominio("¡¡¡")).toBe("");
  });
  it("lo derivado de un nombre normal pasa la validacion", () => {
    expect(errorSubdominio(derivarSubdominio("Academia de Juan"))).toBeNull();
  });
  it("rechaza reservados y nombres demasiado cortos", () => {
    expect(errorSubdominio(derivarSubdominio("Admin"))).not.toBeNull();
    expect(errorSubdominio(derivarSubdominio("Yo"))).not.toBeNull();
  });
});

describe("mapearErrorAlta", () => {
  it("mapea codigos conocidos", () => {
    expect(mapearErrorAlta({ message: "subdominio_tomado" })).toEqual({
      codigo: "subdominio_tomado",
      mensaje: "Ese nombre ya está tomado, elige otro.",
    });
    expect(mapearErrorAlta({ message: "ya_tiene_academia" }).codigo).toBe("ya_tiene_academia");
    expect(mapearErrorAlta({ message: "no_autenticado" }).codigo).toBe("no_autenticado");
  });
  it("trata 23505 como subdominio tomado", () => {
    expect(mapearErrorAlta({ code: "23505", message: "duplicate key" }).codigo).toBe("subdominio_tomado");
  });
  it("error desconocido no filtra detalles internos", () => {
    const r = mapearErrorAlta({ message: "relation tenants violates something secret" });
    expect(r.codigo).toBe("desconocido");
    expect(r.mensaje).not.toContain("secret");
  });
});
