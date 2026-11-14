import { describe, expect, it } from "vitest";
import {
  RUTA_ENTREGA,
  formatearPuntaje,
  leerPuntaje,
  leerPuntajeObtenido,
  localAUtc,
  puedeEntregar,
  separarClases,
  utcALocal,
  validarArchivoEntrega,
  validarClase,
  validarRevision,
  validarTarea,
} from "./reglas";

describe("puntajes", () => {
  it("acepta coma o punto y hasta 2 decimales", () => {
    expect(leerPuntaje("30")).toBe(30);
    expect(leerPuntaje("7,5")).toBe(7.5);
    expect(leerPuntaje("7.25")).toBe(7.25);
  });
  it("rechaza 0, negativos, texto y demasiados decimales", () => {
    for (const x of ["0", "-1", "abc", "1,234", "", "100000"]) expect(leerPuntaje(x)).toBeNull();
  });
  it("el puntaje obtenido admite 0", () => {
    expect(leerPuntajeObtenido("0")).toBe(0);
    expect(leerPuntajeObtenido("-1")).toBeNull();
  });
  it("formatea con coma", () => {
    expect(formatearPuntaje(25)).toBe("25");
    expect(formatearPuntaje(24.5)).toBe("24,5");
  });
});

describe("validarTarea / validarRevision", () => {
  const base = { titulo: " Ejercicios 1 ", instrucciones: "Resuelve $x^2$", puntajeMaximo: "30", fechaLimite: "", permiteReenvio: true };
  it("normaliza una tarea válida", () => {
    const r = validarTarea(base);
    expect(r.ok && r.data).toMatchObject({ titulo: "Ejercicios 1", puntajeMaximo: 30, fechaLimite: null });
  });
  it("exige título y puntaje", () => {
    const r = validarTarea({ ...base, titulo: " ", puntajeMaximo: "0" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.campos).sort()).toEqual(["puntajeMaximo", "titulo"]);
  });
  it("la revisión no puede superar el máximo", () => {
    expect(validarRevision({ puntaje: "31", comentario: "", puntajeMaximo: 30 }).ok).toBe(false);
    expect(validarRevision({ puntaje: "30", comentario: " bien ", puntajeMaximo: 30 })).toEqual({ ok: true, data: { puntaje: 30, comentario: "bien" } });
  });
});

describe("entregas", () => {
  it("solo admite los tipos del bucket", () => {
    expect(validarArchivoEntrega("a.pdf", 100).ok).toBe(true);
    expect(validarArchivoEntrega("a.xlsx", 100).ok).toBe(false);
    expect(validarArchivoEntrega("a.exe", 100).ok).toBe(false);
    expect(validarArchivoEntrega("a.pdf", 0).ok).toBe(false);
  });
  it("reenvío según la tarea", () => {
    expect(puedeEntregar({ permiteReenvio: false }, 0)).toEqual({ ok: true, numero: 1 });
    expect(puedeEntregar({ permiteReenvio: false }, 1).ok).toBe(false);
    expect(puedeEntregar({ permiteReenvio: true }, 2)).toEqual({ ok: true, numero: 3 });
    expect(puedeEntregar({ permiteReenvio: true }, 20).ok).toBe(false);
  });
  it("valida la forma de la ruta", () => {
    const u = "11111111-1111-1111-1111-111111111111";
    expect(RUTA_ENTREGA.test(`${u}/${u}/${u}/${u}.pdf`)).toBe(true);
    expect(RUTA_ENTREGA.test(`${u}/${u}/../${u}.pdf`)).toBe(false);
  });
});

describe("fechas en la zona de la academia", () => {
  it("convierte hora de Santiago a UTC y de vuelta", () => {
    // Noviembre: Chile en horario de verano (UTC-3).
    expect(localAUtc("2026-11-09T18:00")).toBe("2026-11-09T21:00:00.000Z");
    expect(utcALocal("2026-11-09T21:00:00.000Z")).toBe("2026-11-09T18:00");
    // Julio: horario de invierno (UTC-4).
    expect(localAUtc("2026-07-09T18:00")).toBe("2026-07-09T22:00:00.000Z");
  });
  it("rechaza fechas inexistentes", () => {
    expect(localAUtc("2026-02-30T10:00")).toBeNull();
    expect(localAUtc("hola")).toBeNull();
  });
});

describe("clases en vivo", () => {
  const base = {
    titulo: "Clase 1",
    descripcion: "",
    inicia: "2026-11-09T18:00",
    duracionMin: "90",
    enlaceMeet: "https://meet.google.com/abc-defg-hij",
    grabacionUrl: "",
    resumen: "",
  };
  it("acepta una clase válida", () => {
    const r = validarClase(base);
    expect(r.ok && r.data).toMatchObject({ iniciaAt: "2026-11-09T21:00:00.000Z", duracionMin: 90, grabacionUrl: null });
  });
  it("solo enlaces https", () => {
    const r = validarClase({ ...base, enlaceMeet: "http://meet.google.com/x", grabacionUrl: "javascript:alert(1)" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.campos).sort()).toEqual(["enlaceMeet", "grabacionUrl"]);
  });
  it("separa próximas y pasadas; una clase en curso sigue próxima", () => {
    const ahora = new Date("2026-11-09T21:30:00.000Z");
    const cs = [
      { id: "a", iniciaAt: "2026-11-09T21:00:00.000Z", duracionMin: 60 },
      { id: "b", iniciaAt: "2026-11-01T21:00:00.000Z", duracionMin: 60 },
      { id: "c", iniciaAt: "2026-11-12T21:00:00.000Z", duracionMin: 60 },
    ];
    const { proximas, pasadas } = separarClases(cs, ahora);
    expect(proximas.map((c) => c.id)).toEqual(["a", "c"]);
    expect(pasadas.map((c) => c.id)).toEqual(["b"]);
  });
});
