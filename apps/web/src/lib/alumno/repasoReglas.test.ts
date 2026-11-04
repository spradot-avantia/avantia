import { describe, expect, it } from "vitest";
import { diaCalendario, preguntasDeRepaso } from "./repasoReglas";

// Mediodía en Santiago (UTC-3 en verano, UTC-4 en invierno): evita saltos de día por zona.
const t = (iso: string) => `${iso}T15:00:00Z`;
const r = (acierto: boolean, dia: string) => ({ preguntaId: "p", acierto, creadaEn: t(dia) });
const hoy = (dia: string) => new Date(t(dia));

describe("preguntasDeRepaso", () => {
  it("no repasa lo acertado a la primera", () => {
    expect(preguntasDeRepaso([r(true, "2026-11-01")], hoy("2026-11-20"))).toEqual([]);
  });

  it("una falla vence al día siguiente, no el mismo día", () => {
    const rs = [r(false, "2026-11-01")];
    expect(preguntasDeRepaso(rs, hoy("2026-11-01"))).toEqual([]);
    expect(preguntasDeRepaso(rs, hoy("2026-11-02"))).toEqual(["p"]);
    expect(preguntasDeRepaso(rs, hoy("2026-11-09"))).toEqual(["p"]); // sigue vencida hasta repasar
  });

  it("acierto en el repaso: vence a los 3 días, luego a los 7 y se da por aprendida", () => {
    const base = [r(false, "2026-11-01"), r(true, "2026-11-02")];
    expect(preguntasDeRepaso(base, hoy("2026-11-04"))).toEqual([]);
    expect(preguntasDeRepaso(base, hoy("2026-11-05"))).toEqual(["p"]);
    const e3 = [...base, r(true, "2026-11-05")];
    expect(preguntasDeRepaso(e3, hoy("2026-11-11"))).toEqual([]);
    expect(preguntasDeRepaso(e3, hoy("2026-11-12"))).toEqual(["p"]);
    expect(preguntasDeRepaso([...e3, r(true, "2026-11-12")], hoy("2027-01-01"))).toEqual([]);
  });

  it("una falla en el repaso vuelve a la etapa 1", () => {
    const rs = [r(false, "2026-11-01"), r(true, "2026-11-02"), r(false, "2026-11-05")];
    expect(preguntasDeRepaso(rs, hoy("2026-11-05"))).toEqual([]);
    expect(preguntasDeRepaso(rs, hoy("2026-11-06"))).toEqual(["p"]);
  });

  it("repetir el quiz antes de tiempo no adelanta el calendario", () => {
    const rs = [r(false, "2026-11-01"), r(true, "2026-11-01")]; // mismo día: no cuenta
    expect(preguntasDeRepaso(rs, hoy("2026-11-02"))).toEqual(["p"]);
  });

  it("cuenta días calendario de Santiago, no 24 horas", () => {
    // 23:30 en Santiago (02:30Z del día siguiente en verano) sigue siendo el día local.
    expect(diaCalendario("2026-11-02T02:30:00Z")).toBe("2026-11-01");
    const rs = [{ preguntaId: "p", acierto: false, creadaEn: "2026-11-02T02:30:00Z" }];
    expect(preguntasDeRepaso(rs, new Date("2026-11-02T02:45:00Z"))).toEqual([]); // 23:45 del 1: aún no
    expect(preguntasDeRepaso(rs, new Date("2026-11-02T04:00:00Z"))).toEqual(["p"]); // 01:00 del 2: ya es el día siguiente
  });

  it("respeta el tope diario", () => {
    const rs = Array.from({ length: 30 }, (_, i) => ({ preguntaId: `p${String(i).padStart(2, "0")}`, acierto: false, creadaEn: t("2026-11-01") }));
    expect(preguntasDeRepaso(rs, hoy("2026-11-03"))).toHaveLength(20);
  });
});

import { preguntasEnRepaso } from "./repasoReglas";

describe("preguntasEnRepaso", () => {
  it("incluye falladas no aprendidas aunque aún no venzan, y excluye aprendidas", () => {
    const aprendida = [r(false, "2026-11-01"), r(true, "2026-11-02"), r(true, "2026-11-05"), r(true, "2026-11-12")].map((x) => ({ ...x, preguntaId: "a" }));
    const reciente = [{ ...r(false, "2026-11-12"), preguntaId: "b" }];
    expect(Array.from(preguntasEnRepaso([...aprendida, ...reciente]))).toEqual(["b"]);
  });
});
