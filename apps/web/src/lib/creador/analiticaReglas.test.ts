import { describe, expect, it } from "vitest";
import { aCsv, celdaCsv, cohortesSemanales, embudoPorLeccion, mediana, resultadosPorPregunta, resumenTareas, sinActividadHace } from "./analiticaReglas";

describe("mediana", () => {
  it("maneja vacío, impar y par", () => {
    expect(mediana([])).toBeNull();
    expect(mediana([5, 1, 3])).toBe(3);
    expect(mediana([1, 2, 3, 10])).toBe(3);
  });
});

describe("embudoPorLeccion", () => {
  it("calcula abandono y tiempo mediano", () => {
    const f = embudoPorLeccion(
      [{ id: "l1", titulo: "Intro", moduloTitulo: "M1", orden: 1 }, { id: "l2", titulo: "Dos", moduloTitulo: "M1", orden: 2 }],
      [
        { leccionId: "l1", alumnoId: "a", completada: true },
        { leccionId: "l1", alumnoId: "b", completada: false },
        { leccionId: "l1", alumnoId: "c", completada: false },
        { leccionId: "l1", alumnoId: "d", completada: false },
      ],
      [{ leccionId: "l1", activoSeg: 60 }, { leccionId: "l1", activoSeg: 120 }, { leccionId: "l1", activoSeg: 0 }],
    );
    expect(f[0]).toMatchObject({ abrieron: 4, completaron: 1, abandono: 75, tiempoMedianoSeg: 90 });
    expect(f[1]).toMatchObject({ abrieron: 0, abandono: null, tiempoMedianoSeg: null });
  });
});

describe("resultadosPorPregunta", () => {
  it("cuenta solo primeros intentos para el acierto y mide reintentos", () => {
    const [r] = resultadosPorPregunta(
      [{ id: "q", texto: "¿?", moduloTitulo: "M1", orden: 1 }],
      [
        { preguntaId: "q", alumnoId: "a", acierto: false, primerIntento: true, duracionMs: 4000 },
        { preguntaId: "q", alumnoId: "a", acierto: true, primerIntento: false, duracionMs: 2000 },
        { preguntaId: "q", alumnoId: "b", acierto: true, primerIntento: true, duracionMs: 8000 },
      ],
    );
    expect(r).toMatchObject({ alumnos: 2, acierto: 50, tiempoMedianoSeg: 6, reintentos: 0.5 });
  });
});

describe("resumenTareas", () => {
  it("mide entregas, reenvíos y horas hasta la primera entrega", () => {
    const [t] = resumenTareas(
      [{ id: "t", titulo: "Tarea", leccionId: "l" }],
      [
        { tareaId: "t", alumnoId: "a", numero: 1, enviadaAt: "2026-11-10T12:00:00Z" },
        { tareaId: "t", alumnoId: "a", numero: 2, enviadaAt: "2026-11-11T12:00:00Z" },
      ],
      [{ leccionId: "l", alumnoId: "a", at: "2026-11-10T09:00:00Z" }],
      5,
    );
    expect(t).toMatchObject({ entregaron: 1, inscritos: 5, conReenvio: 1, horasMedianas: 3 });
  });
});

describe("cohortesSemanales", () => {
  it("calcula retención solo de semanas ya terminadas", () => {
    const lunes = Date.UTC(2026, 9, 5); // lunes 2026-10-05
    const act = new Map<string, number[]>([["a", [lunes + 8 * 24 * 3_600_000]]]); // semana +1
    const ahora = Date.UTC(2026, 9, 5) + 15 * 24 * 3_600_000; // semana +2 en curso
    const [c] = cohortesSemanales([{ alumnoId: "a", desde: "2026-10-07T10:00:00Z" }, { alumnoId: "b", desde: "2026-10-08T10:00:00Z" }], act, ahora);
    expect(c.semanaInicio).toBe("2026-10-05");
    expect(c.alumnos).toBe(2);
    expect(c.retencion).toEqual([50, null, null, null]);
  });
});

describe("sinActividadHace", () => {
  it("cuenta nulos y antiguos", () => {
    const ahora = Date.UTC(2026, 10, 14);
    expect(sinActividadHace([null, "2026-11-13T00:00:00Z", "2026-10-01T00:00:00Z"], 14, ahora)).toBe(2);
  });
});

describe("csv", () => {
  it("escapa comillas y neutraliza fórmulas", () => {
    expect(celdaCsv('a,"b"')).toBe('"a,""b"""');
    expect(celdaCsv("=1+1")).toBe("'=1+1");
    expect(aCsv(["x"], [[1]])).toBe("﻿x\r\n1\r\n");
  });
});
