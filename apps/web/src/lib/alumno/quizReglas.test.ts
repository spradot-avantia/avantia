import { describe, expect, it } from "vitest";
import { estadoDeModulo } from "./quizReglas";

const f = (id: string, acierto: boolean, primer_intento: boolean) => ({ pregunta_id: id, acierto, primer_intento });

describe("estadoDeModulo", () => {
  it("domina con 4 de 5 aciertos al primer intento (80 %)", () => {
    const e = estadoDeModulo("m", 5, [f("a", true, true), f("b", true, true), f("c", true, true), f("d", true, true), f("e", false, true)]);
    expect(e).toMatchObject({ respondidas: 5, aciertosPrimerIntento: 4, dominado: true });
  });

  it("no domina si solo 3 de 5 fueron al primer intento, aunque luego se acierte el resto", () => {
    // Caso real del QA: el alumno ya había respondido antes; los reintentos no cuentan.
    const e = estadoDeModulo("m", 5, [
      f("a", true, true), f("b", true, true), f("c", true, true), f("d", false, true), f("e", false, true),
      f("d", true, false), f("e", true, false),
    ]);
    expect(e).toMatchObject({ respondidas: 5, aciertosPrimerIntento: 3, dominado: false });
  });

  it("no domina si falta responder preguntas", () => {
    expect(estadoDeModulo("m", 5, [f("a", true, true), f("b", true, true), f("c", true, true), f("d", true, true)]).dominado).toBe(false);
  });

  it("un módulo sin preguntas nunca queda dominado", () => {
    expect(estadoDeModulo("m", 0, []).dominado).toBe(false);
  });
});
