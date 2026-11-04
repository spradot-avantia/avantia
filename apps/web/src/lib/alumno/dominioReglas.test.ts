import { describe, expect, it } from "vitest";
import { calcularDominio } from "./dominioReglas";

describe("calcularDominio", () => {
  it("sin quiz o sin respuestas no hay barra", () => {
    expect(calcularDominio(0, 0, 0)).toBeNull();
    expect(calcularDominio(9, 0, 0)).toBeNull();
  });
  it("resta las preguntas que siguen en repaso", () => {
    expect(calcularDominio(9, 9, 3)).toEqual({ dominadas: 6, total: 9, pct: 67 });
  });
  it("aprender lo fallado sube el dominio", () => {
    expect(calcularDominio(9, 9, 0)?.pct).toBe(100);
  });
  it("no sale del rango aunque haya preguntas huérfanas", () => {
    expect(calcularDominio(3, 3, 5)?.dominadas).toBe(0);
    expect(calcularDominio(3, 9, 0)?.dominadas).toBe(3);
  });
});
