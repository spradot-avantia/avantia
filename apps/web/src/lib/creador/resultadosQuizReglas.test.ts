import { describe, expect, it } from "vitest";
import { agregarResultados } from "./resultadosQuizReglas";

const mod = [{ id: "m1", cursoId: "c", titulo: "M1", orden: 0 }, { id: "m2", cursoId: "c", titulo: "M2", orden: 1 }];
const pre = [
  { id: "p1", moduloId: "m1", texto: "A", orden: 0 },
  { id: "p2", moduloId: "m1", texto: "B", orden: 1 },
];

describe("agregarResultados", () => {
  it("omite módulos sin quiz y devuelve vacío sin respuestas", () => {
    const r = agregarResultados(mod, pre, []);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ moduloId: "m1", preguntas: 2, alumnos: 0, acierto: null, masFallada: null });
  });

  it("cuenta solo primeros intentos y marca la pregunta más fallada", () => {
    const r = agregarResultados(mod, pre, [
      { alumnoId: "a", preguntaId: "p1", acierto: true, primerIntento: true },
      { alumnoId: "a", preguntaId: "p2", acierto: false, primerIntento: true },
      { alumnoId: "a", preguntaId: "p2", acierto: true, primerIntento: false }, // repetir no cuenta
      { alumnoId: "b", preguntaId: "p1", acierto: true, primerIntento: true },
      { alumnoId: "b", preguntaId: "p2", acierto: false, primerIntento: true },
    ])[0];
    expect(r.alumnos).toBe(2);
    expect(r.acierto).toBe(50);
    expect(r.masFallada).toMatchObject({ preguntaId: "p2", acierto: 0, respuestas: 2 });
  });
});
