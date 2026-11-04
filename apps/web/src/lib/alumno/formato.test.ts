import { describe, expect, it } from "vitest";
import { nombreModulo, sinTituloRepetido } from "./formato";
import { xpDeQuiz } from "./quizReglas";

describe("nombreModulo", () => {
  it("quita el prefijo «Módulo N:» que ya antepone la pantalla", () => {
    expect(nombreModulo("Módulo 1: Pensar como analista")).toBe("Pensar como analista");
    expect(nombreModulo("modulo 2 - Limpiar datos")).toBe("Limpiar datos");
  });
  it("deja intactos los títulos sin prefijo o que quedarían vacíos", () => {
    expect(nombreModulo("Contexto")).toBe("Contexto");
    expect(nombreModulo("Módulo 3:")).toBe("Módulo 3:");
  });
});

describe("sinTituloRepetido", () => {
  it("quita el primer título si repite el de la lección", () => {
    expect(sinTituloRepetido("# Gráficos\n\nUn mensaje por gráfico.", "Gráficos")).toBe("Un mensaje por gráfico.");
  });
  it("no toca un título distinto", () => {
    const t = "## Otro título\n\ntexto";
    expect(sinTituloRepetido(t, "Gráficos")).toBe(t);
  });
});

describe("xpDeQuiz", () => {
  it("+5 por respondida y +5 por acierto al primer intento", () => {
    const e = { moduloId: "m", total: 3, respondidas: 3, aciertosPrimerIntento: 2, dominado: false };
    expect(xpDeQuiz([e])).toBe(3 * 5 + 2 * 5);
  });
});
