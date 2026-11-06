import { describe, expect, it } from "vitest";
import { normalizarCursoGenerado } from "./normalizarGenerado";

const base = {
  titulo: "Curso de prueba",
  descripcion: "Una descripción",
  modulos: [
    {
      titulo: "Módulo 1",
      descripcion: "Presentación del módulo",
      objetivos: ["Uno", "Dos", "Tres", "Cuatro", "Cinco"],
      duracionMin: 25,
      lecciones: [{ titulo: "Lección 1", resumen: "Resumen", descripcion: "Qué se aprende", duracionMin: 8 }],
    },
  ],
};

describe("normalizarCursoGenerado (ADR 029, F3)", () => {
  it("conserva una respuesta válida y recorta los objetivos a 4", () => {
    const r = normalizarCursoGenerado(base);
    expect(r?.modulos[0].objetivos).toEqual(["Uno", "Dos", "Tres", "Cuatro"]);
    expect(r?.modulos[0].duracionMin).toBe(25);
    expect(r?.modulos[0].lecciones[0]).toMatchObject({ descripcion: "Qué se aprende", duracionMin: 8 });
  });
  it("descarta duraciones fuera de rango o no numéricas", () => {
    const r = normalizarCursoGenerado({
      ...base,
      modulos: [{ ...base.modulos[0], duracionMin: 5000, lecciones: [{ titulo: "L", resumen: "", duracionMin: "10" }] }],
    });
    expect(r?.modulos[0].duracionMin).toBeNull();
    expect(r?.modulos[0].lecciones[0].duracionMin).toBeNull();
  });
  it("redondea minutos decimales", () => {
    expect(normalizarCursoGenerado({ ...base, modulos: [{ ...base.modulos[0], duracionMin: 12.6 }] })?.modulos[0].duracionMin).toBe(13);
  });
  it("respeta los largos máximos", () => {
    const r = normalizarCursoGenerado({ ...base, modulos: [{ ...base.modulos[0], descripcion: "x".repeat(900), objetivos: ["y".repeat(300)] }] });
    expect(r?.modulos[0].descripcion).toHaveLength(600);
    expect(r?.modulos[0].objetivos[0]).toHaveLength(140);
  });
  it("quita cualquier enlace: la IA no inventa URLs", () => {
    const r = normalizarCursoGenerado({
      ...base,
      descripcion: "Mira https://malo.example/x ahora",
      modulos: [{ ...base.modulos[0], descripcion: "Lee www.malo.example hoy", objetivos: ["https://solo.enlace"] }],
    });
    expect(r?.descripcion).toBe("Mira ahora");
    expect(r?.modulos[0].descripcion).toBe("Lee hoy");
    expect(r?.modulos[0].objetivos).toEqual([]);
  });
  it("ignora un campo de materiales que el modelo agregue", () => {
    const r = normalizarCursoGenerado({ ...base, modulos: [{ ...base.modulos[0], materiales: [{ url: "https://x.cl" }] }] });
    expect(JSON.stringify(r)).not.toContain("https://x.cl");
  });
  it("rechaza respuestas sin forma de curso", () => {
    expect(normalizarCursoGenerado(null)).toBeNull();
    expect(normalizarCursoGenerado("texto")).toBeNull();
    expect(normalizarCursoGenerado({ titulo: "", modulos: [] })).toBeNull();
    expect(normalizarCursoGenerado({ titulo: "Ok" })).toBeNull();
  });
});
