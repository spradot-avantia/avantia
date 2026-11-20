import { describe, expect, it } from "vitest";
import {
  agruparPorAlumno,
  armarActividad,
  distribucionAvance,
  distribucionDominio,
  dominioMedio,
  estudiantesPorCurso,
  haceCuanto,
  necesitanAyuda,
  temasConDificultad,
  type Titulos,
} from "./actividadReglas";
import type { FilaInscripcion } from "./inscripciones";

const titulos: Titulos = {
  alumnos: new Map([["a1", "Ana"], ["a2", "Luis"]]),
  cursos: new Map([["c1", "Onboarding"]]),
  lecciones: new Map([["l1", "Bienvenida"]]),
  modulos: new Map([["m1", "Modelo comercial"]]),
  tareas: new Map([["t1", "Caso práctico"]]),
};

const insc = (p: Partial<FilaInscripcion>): FilaInscripcion => ({
  id: "i", alumnoId: "a", nombre: "N", correo: "", cursoId: "c1", cursoTitulo: "Onboarding", precioCentavos: 0,
  estado: "activa", origen: "invitacion", campana: null, creadaEn: "2026-11-01T00:00:00Z", avance: 0, completadas: 0,
  totalLecciones: 4, xp: 0, dominio: null, ultimaActividad: "2026-11-18T00:00:00Z", sinActividad: false, pago: null, ...p,
});

describe("armarActividad", () => {
  it("agrupa las respuestas de un quiz por alumno, módulo y día con su acierto", () => {
    const eventos = [
      { id: "e3", alumnoId: "a1", cursoId: "c1", tipo: "intento_quiz", entidadId: "m1", fecha: "2026-11-18T10:05:00Z" },
      { id: "e2", alumnoId: "a1", cursoId: "c1", tipo: "intento_quiz", entidadId: "m1", fecha: "2026-11-18T10:04:00Z" },
      { id: "e1", alumnoId: "a1", cursoId: "c1", tipo: "leccion_completada", entidadId: "l1", fecha: "2026-11-18T09:00:00Z" },
    ];
    const respuestas = [
      { alumnoId: "a1", moduloId: "m1", acierto: true, fecha: "2026-11-18T10:05:00Z" },
      { alumnoId: "a1", moduloId: "m1", acierto: false, fecha: "2026-11-18T10:04:00Z" },
      { alumnoId: "a1", moduloId: "m1", acierto: false, fecha: "2026-11-18T10:03:00Z" },
    ];
    const items = armarActividad(eventos, respuestas, [], titulos);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ tipo: "quiz", alumno: "Ana", detalle: "1 de 3 correctas", tono: "alerta" });
    expect(items[0].texto).toContain("«Modelo comercial»");
    expect(items[1]).toMatchObject({ tipo: "leccion", texto: "completó «Bienvenida»" });
  });

  it("mezcla entregas, ordena por fecha y respeta el límite", () => {
    const eventos = [{ id: "e1", alumnoId: "a2", cursoId: "c1", tipo: "curso_completado", entidadId: "c1", fecha: "2026-11-17T00:00:00Z" }];
    const entregas = [{ id: "x1", alumnoId: "a1", tareaId: "t1", numero: 2, fecha: "2026-11-18T00:00:00Z" }];
    const items = armarActividad(eventos, [], entregas, titulos, 1);
    expect(items).toEqual([expect.objectContaining({ tipo: "tarea", texto: "reenvió la tarea «Caso práctico»" })]);
  });

  it("ignora tipos que no son del feed y usa un nombre genérico si falta el alumno", () => {
    const eventos = [
      { id: "e1", alumnoId: "zz", cursoId: "c1", tipo: "leccion_abierta", entidadId: "l1", fecha: "2026-11-18T00:00:00Z" },
      { id: "e2", alumnoId: "zz", cursoId: "c1", tipo: "inscripcion_activada", entidadId: "c1", fecha: "2026-11-18T00:00:00Z" },
    ];
    const items = armarActividad(eventos, [], [], titulos);
    expect(items).toHaveLength(1);
    expect(items[0].alumno).toBe("Un estudiante");
  });
});

describe("dominioMedio y necesitanAyuda", () => {
  const filas = [
    insc({ id: "1", nombre: "Ana", dominio: { dominadas: 9, total: 10, pct: 90 } }),
    insc({ id: "2", nombre: "Luis", dominio: { dominadas: 3, total: 10, pct: 30 }, sinActividad: true }),
    insc({ id: "3", nombre: "Eva", sinActividad: true }),
    insc({ id: "4", nombre: "Ivo", estado: "cancelada", dominio: { dominadas: 0, total: 10, pct: 0 } }),
  ];
  it("promedia solo inscripciones activas con dominio", () => {
    expect(dominioMedio(filas)).toBe(60);
    expect(dominioMedio([insc({})])).toBeNull();
  });
  it("lista dominio bajo y sin actividad, lo más urgente primero", () => {
    const r = necesitanAyuda(filas.map((f) => ({ ...f, alumnoId: `a${f.id}` })));
    expect(r.map((x) => x.alumno)).toEqual(["Luis", "Eva"]);
    expect(r[0].motivo).toContain("domina 30 %");
    expect(r[0].motivo).toContain("sin entrar");
  });
  it("cuenta una vez al estudiante con dos inscripciones en riesgo", () => {
    const r = necesitanAyuda([
      insc({ id: "1", alumnoId: "s", nombre: "Sam", cursoTitulo: "A", sinActividad: true }),
      insc({ id: "2", alumnoId: "s", nombre: "Sam", cursoId: "c2", cursoTitulo: "B", dominio: { dominadas: 1, total: 10, pct: 10 } }),
    ]);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ cursos: ["A", "B"], dominioBajo: true, sinEntrar: true });
    expect(r[0].motivo).toContain("domina 10 %");
  });
});

describe("distribuciones y estudiantes por curso", () => {
  const filas = [
    insc({ id: "1", alumnoId: "a", avance: 100, dominio: { dominadas: 9, total: 10, pct: 90 } }),
    insc({ id: "2", alumnoId: "b", avance: 40, dominio: { dominadas: 7, total: 10, pct: 70 } }),
    insc({ id: "3", alumnoId: "c", avance: 0, dominio: { dominadas: 2, total: 10, pct: 20 } }),
    insc({ id: "4", alumnoId: "a", cursoId: "c2", cursoTitulo: "Otro", avance: 10 }),
    insc({ id: "5", alumnoId: "d", estado: "cancelada", avance: 50 }),
  ];
  it("reparte avance y dominio de las inscripciones activas", () => {
    expect(distribucionAvance(filas)).toEqual({ terminaron: 1, enProgreso: 2, sinIniciar: 1, total: 4 });
    expect(distribucionDominio(filas)).toEqual({ bajo: 1, medio: 1, alto: 1, sinQuiz: 1, total: 4 });
  });
  it("cuenta estudiantes únicos por curso", () => {
    expect(estudiantesPorCurso(filas)).toEqual([
      { cursoId: "c1", curso: "Onboarding", n: 3 },
      { cursoId: "c2", curso: "Otro", n: 1 },
    ]);
  });
});

describe("agruparPorAlumno", () => {
  const it_ = (id: string, alumnoId: string, fecha: string) =>
    ({ id, alumnoId, alumno: alumnoId.toUpperCase(), tipo: "leccion", texto: "x", detalle: null, tono: "neutro", fecha }) as const;
  it("deja una fila por estudiante con su última acción y cuántas más", () => {
    const g = agruparPorAlumno([
      it_("1", "a", "2026-11-18T10:00:00Z"),
      it_("2", "b", "2026-11-18T11:00:00Z"),
      it_("3", "a", "2026-11-18T12:00:00Z"),
      it_("4", "a", "2026-11-17T12:00:00Z"),
    ]);
    expect(g.map((x) => [x.alumnoId, x.ultima.id, x.mas])).toEqual([
      ["a", "3", 2],
      ["b", "2", 0],
    ]);
  });
  it("respeta el máximo de estudiantes", () => {
    expect(agruparPorAlumno([it_("1", "a", "2026-11-18"), it_("2", "b", "2026-11-17")], 1)).toHaveLength(1);
  });
});

describe("temasConDificultad", () => {
  it("devuelve los módulos con acierto bajo y suficientes respuestas", () => {
    const r = (moduloId: string, alumnoId: string, acierto: boolean) => ({ moduloId, alumnoId, acierto });
    const resp = [
      ...Array.from({ length: 5 }, (_, i) => r("m1", `a${i}`, i === 0)), // 20 %
      ...Array.from({ length: 5 }, (_, i) => r("m2", `a${i}`, true)), // 100 %
      r("m3", "a1", false), // pocas respuestas
    ];
    expect(temasConDificultad(resp)).toEqual([{ moduloId: "m1", acierto: 20, respuestas: 5, alumnos: 5 }]);
  });
});

describe("haceCuanto", () => {
  const ahora = new Date("2026-11-19T12:00:00Z").getTime();
  it.each([
    ["2026-11-19T11:59:40Z", "recién"],
    ["2026-11-19T11:30:00Z", "hace 30 min"],
    ["2026-11-19T09:00:00Z", "hace 3 h"],
    ["2026-11-18T10:00:00Z", "ayer"],
    ["2026-11-15T12:00:00Z", "hace 4 días"],
  ])("%s → %s", (iso, esperado) => {
    expect(haceCuanto(iso, ahora)).toBe(esperado);
  });
});
