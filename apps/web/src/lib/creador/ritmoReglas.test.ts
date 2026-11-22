import { describe, expect, it } from "vitest";
import { avanceSinDominio, duracionCorta, ritmoPorModulo, type ModuloRitmo } from "./ritmoReglas";

const mods = [
  { id: "m1", titulo: "Presupuesto", leccionIds: ["l1", "l2"] },
  { id: "m2", titulo: "Deudas", leccionIds: ["l3"] },
  { id: "m3", titulo: "Vacío", leccionIds: [] },
];

describe("ritmoPorModulo", () => {
  it("suma tiempo de lecciones y del quiz al primer intento, y cuenta aciertos solo del primer intento", () => {
    const r = ritmoPorModulo(
      mods,
      new Set(["l1", "l2"]),
      new Map([["l1", 120], ["l2", 60], ["l3", 30]]),
      [
        { moduloId: "m1", acierto: true, primerIntento: true, duracionMs: 10_000 },
        { moduloId: "m1", acierto: false, primerIntento: true, duracionMs: null },
        { moduloId: "m1", acierto: true, primerIntento: false, duracionMs: 50_000 },
      ],
    );
    expect(r[0]).toEqual({ moduloId: "m1", titulo: "Presupuesto", completo: true, activoSeg: 190, respondidas: 2, aciertos: 1 });
    expect(r[1]).toMatchObject({ completo: false, activoSeg: 30, respondidas: 0 });
    expect(r[2].completo).toBe(false); // sin lecciones no se da por completo
  });
});

const mod = (p: Partial<ModuloRitmo>): ModuloRitmo => ({
  moduloId: "m1", titulo: "Presupuesto", completo: true, activoSeg: 600, respondidas: 3, aciertos: 3, ...p,
});

describe("avanceSinDominio", () => {
  const clase = [
    { clave: "a", cursoId: "c1", modulos: [mod({ activoSeg: 600 })] },
    { clave: "b", cursoId: "c1", modulos: [mod({ activoSeg: 720 })] },
    { clave: "c", cursoId: "c1", modulos: [mod({ activoSeg: 540 })] },
  ];

  it("marca a quien completa en menos de la mitad de la mediana y falla el repaso", () => {
    const r = avanceSinDominio([...clase, { clave: "matias", cursoId: "c1", modulos: [mod({ activoSeg: 240, aciertos: 1 })] }]);
    expect(r.get("matias")).toEqual({
      moduloId: "m1", moduloTitulo: "Presupuesto", activoSeg: 240, medianaSeg: 570, aciertos: 1, respondidas: 3,
    });
    expect(r.get("a")).toBeNull();
  });

  it("no marca si fue rápido pero domina (ya sabía)", () => {
    const r = avanceSinDominio([...clase, { clave: "x", cursoId: "c1", modulos: [mod({ activoSeg: 120, aciertos: 3 })] }]);
    expect(r.get("x")).toBeNull();
  });

  it("no marca si falla pero se tomó su tiempo (ese caso lo cubre el dominio bajo)", () => {
    const r = avanceSinDominio([...clase, { clave: "x", cursoId: "c1", modulos: [mod({ activoSeg: 500, aciertos: 0 })] }]);
    expect(r.get("x")).toBeNull();
  });

  it("no compara sin suficientes compañeros, sin tiempo medido, sin quiz o con el módulo incompleto", () => {
    const rapido = mod({ activoSeg: 60, aciertos: 0 });
    expect(avanceSinDominio([clase[0], { clave: "x", cursoId: "c1", modulos: [rapido] }]).get("x")).toBeNull();
    const casos = [mod({ activoSeg: 0, aciertos: 0 }), mod({ activoSeg: 60, respondidas: 0, aciertos: 0 }), mod({ activoSeg: 60, aciertos: 0, completo: false })];
    for (const m of casos) expect(avanceSinDominio([...clase, { clave: "x", cursoId: "c1", modulos: [m] }]).get("x")).toBeNull();
  });

  it("la mediana es por curso: otro curso con el mismo módulo no cuenta", () => {
    const r = avanceSinDominio([...clase, { clave: "x", cursoId: "c2", modulos: [mod({ activoSeg: 60, aciertos: 0 })] }]);
    expect(r.get("x")).toBeNull();
  });
});

describe("duracionCorta", () => {
  it("formatea segundos, minutos y horas", () => {
    expect(duracionCorta(45)).toBe("45 s");
    expect(duracionCorta(240)).toBe("4 min");
    expect(duracionCorta(4200)).toBe("1 h 10 min");
    expect(duracionCorta(3600)).toBe("1 h");
  });
});
