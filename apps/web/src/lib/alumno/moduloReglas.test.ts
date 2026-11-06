import { describe, expect, it } from "vitest";
import type { Leccion, Modulo } from "../creador/types";
import { resumirModulo } from "./moduloReglas";

const lec = (id: string, duracionMin: number | null = null): Leccion => ({
  id,
  moduloId: "m1",
  cursoId: "c1",
  titulo: `Lección ${id}`,
  tipo: "texto",
  contenidoUrl: null,
  contenidoTexto: "x",
  storagePath: null,
  contenidoTipo: null,
  archivoNombre: null,
  bytes: null,
  descripcion: null,
  duracionMin,
  orden: 0,
});

const modulo = (lecciones: Leccion[], duracionMin: number | null = null): Modulo => ({
  id: "m1",
  cursoId: "c1",
  titulo: "Módulo 1",
  orden: 0,
  descripcion: null,
  objetivos: [],
  duracionMin,
  lecciones,
  materiales: [],
});

const ritmo = { modalidad: "a_su_ritmo" as const, fechaInicio: null };
const fechas = { modalidad: "con_fechas" as const, fechaInicio: "2026-11-10" };

describe("resumirModulo", () => {
  it("módulo sin empezar: la próxima es la primera lección", () => {
    const r = resumirModulo(modulo([lec("a"), lec("b")]), ritmo, new Map(), new Set(), "2026-11-06");
    expect(r).toMatchObject({ total: 2, hechas: 0, pct: 0, proxima: "a", estado: "sin_empezar" });
  });

  it("en curso: salta las completadas y calcula el porcentaje", () => {
    const r = resumirModulo(modulo([lec("a"), lec("b"), lec("c")]), ritmo, new Map(), new Set(["a"]), "2026-11-06");
    expect(r).toMatchObject({ hechas: 1, pct: 33, proxima: "b", estado: "en_curso" });
    expect(r.filas.map((f) => f.estado)).toEqual(["completada", "disponible", "disponible"]);
  });

  it("completo: no hay próxima lección", () => {
    const r = resumirModulo(modulo([lec("a")]), ritmo, new Map(), new Set(["a"]), "2026-11-06");
    expect(r).toMatchObject({ pct: 100, proxima: null, estado: "completo" });
  });

  it("una lección con fecha futura queda bloqueada y dice cuándo abre", () => {
    const dia = new Map<string, number | null>([["b", 3]]);
    const r = resumirModulo(modulo([lec("a"), lec("b")]), fechas, new Map(dia), new Set(["a"]), "2026-11-12");
    expect(r.filas[1]).toMatchObject({ estado: "bloqueada", abreEl: "2026-11-13" });
    expect(r.proxima).toBeNull();
  });

  it("una lección completada nunca figura como bloqueada", () => {
    const dia = new Map<string, number | null>([["a", 30]]);
    const r = resumirModulo(modulo([lec("a")]), fechas, dia, new Set(["a"]), "2026-11-06");
    expect(r.filas[0]).toMatchObject({ estado: "completada", abreEl: null });
  });

  it("duración: usa la del módulo y, si falta, suma las de las lecciones", () => {
    expect(resumirModulo(modulo([lec("a", 5)], 20), ritmo, new Map(), new Set(), "2026-11-06").duracionMin).toBe(20);
    expect(resumirModulo(modulo([lec("a", 5), lec("b", 7), lec("c")]), ritmo, new Map(), new Set(), "2026-11-06").duracionMin).toBe(12);
    expect(resumirModulo(modulo([lec("a")]), ritmo, new Map(), new Set(), "2026-11-06").duracionMin).toBeNull();
  });

  it("módulo sin lecciones: 0 %, sin próxima y sin empezar", () => {
    const r = resumirModulo(modulo([]), ritmo, new Map(), new Set(), "2026-11-06");
    expect(r).toMatchObject({ total: 0, pct: 0, proxima: null, estado: "sin_empezar" });
  });
});
