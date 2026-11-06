import { describe, expect, it } from "vitest";
import {
  aMaterialAlumno,
  esCompleto,
  hrefMaterial,
  materialesDeLeccion,
  puedeAbrirMaterial,
  rotuloMaterial,
  type FilaMaterial,
} from "./materialesReglas";

const fila = (o: Partial<FilaMaterial> = {}): FilaMaterial => ({
  id: "m1",
  modulo_id: "mod1",
  leccion_id: null,
  titulo: "Guía",
  nota: null,
  origen: "enlace",
  url: "https://ejemplo.cl/guia",
  storage_path: null,
  archivo_nombre: null,
  mime: null,
  bytes: null,
  ...o,
});
const archivo = (o: Partial<FilaMaterial> = {}) =>
  fila({ origen: "archivo", url: null, storage_path: "t/c/u.pdf", archivo_nombre: "Guía.pdf", mime: "application/pdf", bytes: 2516582, ...o });

describe("materiales del alumno (ADR 029 F3, ADR 030)", () => {
  it("solo muestra materiales completos", () => {
    expect(esCompleto(fila())).toBe(true);
    expect(esCompleto(fila({ url: null }))).toBe(false);
    expect(esCompleto(fila({ url: "http://inseguro.cl" }))).toBe(false);
    expect(esCompleto(archivo())).toBe(true);
    expect(esCompleto(archivo({ storage_path: null }))).toBe(false);
    expect(esCompleto(fila({ origen: "otro" }))).toBe(false);
  });
  it("nunca reenvía la ruta interna del archivo", () => {
    const m = aMaterialAlumno(archivo());
    expect(JSON.stringify(m)).not.toContain("t/c/u.pdf");
    expect(m.url).toBeNull();
    expect(Object.keys(m)).not.toContain("storage_path");
  });
  it("un enlace va directo; un archivo pasa por la ruta del servidor", () => {
    expect(hrefMaterial(aMaterialAlumno(fila()), "c1")).toBe("https://ejemplo.cl/guia");
    expect(hrefMaterial(aMaterialAlumno(archivo({ id: "m9" })), "c1")).toBe("/aprender/c1/material/m9");
  });
  it("rotula archivos con tipo y tamaño, y enlaces como externos", () => {
    expect(rotuloMaterial(aMaterialAlumno(archivo()))).toBe("PDF · 2,4 MB");
    expect(rotuloMaterial(aMaterialAlumno(archivo({ archivo_nombre: "Hoja.xlsx", bytes: 500 })))).toBe("Excel · 500 B");
    expect(rotuloMaterial(aMaterialAlumno(fila()))).toBe("Enlace externo");
  });
  it("separa los materiales del módulo de los de la lección", () => {
    const todos = [
      aMaterialAlumno(fila({ id: "a" })),
      aMaterialAlumno(fila({ id: "b", leccion_id: "l1" })),
      aMaterialAlumno(fila({ id: "c", leccion_id: "l2" })),
      aMaterialAlumno(fila({ id: "d", modulo_id: "mod2" })),
    ];
    const r = materialesDeLeccion(todos, "mod1", "l1");
    expect(r.delModulo.map((m) => m.id)).toEqual(["a"]);
    expect(r.deLaLeccion.map((m) => m.id)).toEqual(["b"]);
  });
  describe("puedeAbrirMaterial", () => {
    const lecs = [
      { id: "l1", moduloId: "mod1", liberada: true },
      { id: "l2", moduloId: "mod1", liberada: false },
      { id: "l3", moduloId: "mod2", liberada: false },
    ];
    it("una lección liberada abre sus materiales", () => {
      expect(puedeAbrirMaterial({ moduloId: "mod1", leccionId: "l1" }, lecs)).toBe(true);
    });
    it("una lección aún no liberada no abre los suyos", () => {
      expect(puedeAbrirMaterial({ moduloId: "mod1", leccionId: "l2" }, lecs)).toBe(false);
    });
    it("un material de módulo exige al menos una lección liberada del módulo", () => {
      expect(puedeAbrirMaterial({ moduloId: "mod1", leccionId: null }, lecs)).toBe(true);
      expect(puedeAbrirMaterial({ moduloId: "mod2", leccionId: null }, lecs)).toBe(false);
    });
    it("rechaza una lección de otro módulo o inexistente", () => {
      expect(puedeAbrirMaterial({ moduloId: "mod2", leccionId: "l1" }, lecs)).toBe(false);
      expect(puedeAbrirMaterial({ moduloId: "mod1", leccionId: "nope" }, lecs)).toBe(false);
    });
  });
});
