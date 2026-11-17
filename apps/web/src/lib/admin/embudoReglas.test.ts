import { describe, expect, it } from "vitest";
import { embudo, estancada, etapaDe, indiceEtapa, kpis, medianasDias, ultimaActividad, type ResumenAcademia } from "./embudoReglas";

const AHORA = new Date("2026-11-17T12:00:00Z").getTime();
const dia = (n: number) => new Date(AHORA - n * 86_400_000).toISOString();

function base(over: Partial<ResumenAcademia> = {}): ResumenAcademia {
  return {
    tenantId: "t1", nombre: "A", subdomain: "a", dueno: "a@x.cl", creadaAt: dia(30), onboardingAt: null, dominioPropio: false,
    cursosTotal: 0, cursosPublicados: 0, leccionesTotal: 0, primerCursoAt: null, primerPublicadoAt: null, primerAlumnoAt: null,
    primerPagoAt: null, alumnos: 0, alumnosActivos30: 0, ultimoLogin: null, ultimaEdicion: null, ...over,
  };
}

describe("etapa", () => {
  it("avanza en secuencia y se detiene en el primer hito faltante", () => {
    expect(etapaDe(base()).id).toBe("academia");
    expect(etapaDe(base({ onboardingAt: dia(29) })).id).toBe("identidad");
    expect(etapaDe(base({ onboardingAt: dia(29), cursosTotal: 1 })).id).toBe("curso");
    // publicado sin lecciones no salta la etapa de contenido
    expect(indiceEtapa(base({ onboardingAt: dia(29), cursosTotal: 1, cursosPublicados: 1 }))).toBe(2);
    expect(etapaDe(base({ onboardingAt: dia(29), cursosTotal: 1, leccionesTotal: 3, cursosPublicados: 1, primerAlumnoAt: dia(5), primerPagoAt: dia(4) })).id).toBe("pago");
  });
});

describe("actividad y estancadas", () => {
  it("toma la señal más reciente y marca estancadas solo si no llegaron al final", () => {
    const a = base({ ultimoLogin: dia(20), ultimaEdicion: dia(3) });
    expect(ultimaActividad(a)).toBe(new Date(dia(3)).getTime());
    expect(estancada(a, AHORA)).toBe(false);
    expect(estancada(base({ ultimoLogin: dia(20) }), AHORA)).toBe(true);
    const completa = base({ onboardingAt: dia(29), cursosTotal: 1, leccionesTotal: 1, cursosPublicados: 1, primerAlumnoAt: dia(9), primerPagoAt: dia(8), ultimoLogin: dia(60) });
    expect(estancada(completa, AHORA)).toBe(false);
  });
});

describe("embudo y medianas", () => {
  const lista = [
    base({ tenantId: "1" }),
    base({ tenantId: "2", onboardingAt: dia(25), cursosTotal: 1, primerCursoAt: dia(20) }),
    base({ tenantId: "3", onboardingAt: dia(25), cursosTotal: 1, leccionesTotal: 2, cursosPublicados: 1, primerCursoAt: dia(24), primerPublicadoAt: dia(10) }),
  ];
  it("cuenta academias que alcanzaron al menos cada etapa", () => {
    const e = embudo(lista, 5);
    expect(e.map((f) => f.cantidad)).toEqual([5, 3, 2, 2, 1, 1, 0, 0]);
    expect(e[1].pasoPct).toBe(60);
    expect(e[7].pasoPct).toBeNull();
  });
  it("calcula días medianos desde el alta", () => {
    const m = medianasDias(lista);
    expect(m.primerCurso).toBe(8); // 10 y 6 días → 8
    expect(m.publicado).toBe(20);
    expect(m.primerAlumno).toBeNull();
  });
  it("resume KPIs", () => {
    const k = kpis(lista, AHORA);
    expect(k).toMatchObject({ academias: 3, conPublicado: 1, conAlumno: 0 });
  });
});
