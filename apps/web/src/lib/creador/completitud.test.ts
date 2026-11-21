import { describe, expect, it } from "vitest";
import { completitudCurso, completitudModulo, resumenModulos } from "./completitud";
import type { PreguntaQuiz } from "./quiz";
import type { Leccion } from "./types";

const lec = (id: string, texto: string | null): Leccion => ({
  id, moduloId: "m", cursoId: "c", titulo: `Lección ${id}`, tipo: "texto", contenidoUrl: null, contenidoTexto: texto,
  storagePath: null, contenidoTipo: null, archivoNombre: null, bytes: null, descripcion: null, duracionMin: null, orden: 0,
});
const preg = (id: string, lista = true): PreguntaQuiz => ({
  id, tipo: "verdadero_falso", texto: lista ? "¿Sí?" : "", opciones: ["Verdadero", "Falso"], correcta: 0, explicacion: "",
});
const mod = (id: string, lecciones: Leccion[], quiz: PreguntaQuiz[] = []) => ({ id, titulo: `Módulo ${id}`, lecciones, quiz });

describe("completitudModulo", () => {
  it("pendiente sin lecciones o sin ninguna lista", () => {
    expect(completitudModulo(mod("a", [])).estado).toBe("pendiente");
    expect(completitudModulo(mod("b", [lec("1", null), lec("2", "  ")])).estado).toBe("pendiente");
  });
  it("completo con todas las lecciones listas y sin quiz o con quiz completo", () => {
    expect(completitudModulo(mod("a", [lec("1", "Hola")])).estado).toBe("completo");
    expect(completitudModulo(mod("b", [lec("1", "Hola")], [preg("p1"), preg("p2"), preg("p3")])).estado).toBe("completo");
  });
  it("en edición si falta una lección o el quiz empezado no está listo", () => {
    expect(completitudModulo(mod("a", [lec("1", "Hola"), lec("2", null)])).estado).toBe("en_edicion");
    expect(completitudModulo(mod("b", [lec("1", "Hola")], [preg("p1")])).estado).toBe("en_edicion");
  });
});

describe("completitudCurso", () => {
  it("cuenta lecciones listas y quizzes completos sobre el total", () => {
    const c = completitudCurso({
      modulos: [
        mod("a", [lec("1", "x"), lec("2", "y")], [preg("p1"), preg("p2"), preg("p3")]), // 3 de 3
        mod("b", [lec("3", "z"), lec("4", null)]), // 1 de 2
        mod("c", []), // 0 de 0
      ],
    });
    expect(c.pct).toBe(80);
    expect([c.completos, c.enEdicion, c.pendientes]).toEqual([1, 1, 1]);
  });
  it("0 % sin contenido", () => {
    expect(completitudCurso({ modulos: [] }).pct).toBe(0);
  });
});

describe("resumenModulos", () => {
  it("resume los estados", () => {
    expect(resumenModulos({ completos: 2, enEdicion: 1, pendientes: 1 })).toBe("2 completos · 1 en edición · 1 pendiente");
    expect(resumenModulos({ completos: 3, enEdicion: 0, pendientes: 0 })).toBe("3 de 3 módulos completos");
    expect(resumenModulos({ completos: 0, enEdicion: 0, pendientes: 0 })).toBe("Sin módulos todavía");
  });
});
