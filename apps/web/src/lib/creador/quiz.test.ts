import { describe, expect, it } from "vitest";
import { cambiarTipo, estadoQuiz, preguntaNueva, problemaPregunta, quizSchema, type PreguntaQuiz } from "./quiz";
import { validarPublicacion } from "./reglasPublicacion";
import type { CursoCompleto } from "./types";

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const lista = (n: number): PreguntaQuiz => ({
  id: uuid(n),
  tipo: "opcion_multiple",
  texto: `Pregunta ${n}`,
  opciones: ["A", "B", "C"],
  correcta: 0,
  explicacion: "",
});

describe("pregunta", () => {
  it("una pregunta nueva no está lista", () => {
    expect(problemaPregunta(preguntaNueva(uuid(1)))).toBe("Falta escribir la pregunta.");
  });
  it("pide marcar la correcta y completar respuestas", () => {
    expect(problemaPregunta({ ...lista(1), correcta: null })).toMatch(/correcta/);
    expect(problemaPregunta({ ...lista(1), opciones: ["A", "", "C"] })).toMatch(/vacías/);
    expect(problemaPregunta({ ...lista(1), opciones: ["A", "a ", "C"] })).toMatch(/iguales/);
    expect(problemaPregunta(lista(1))).toBeNull();
  });
  it("verdadero/falso fija las respuestas y borra la correcta", () => {
    const vf = cambiarTipo(lista(1), "verdadero_falso");
    expect(vf.opciones).toEqual(["Verdadero", "Falso"]);
    expect(vf.correcta).toBeNull();
    expect(problemaPregunta({ ...vf, correcta: 1 })).toBeNull();
  });
});

describe("estado del quiz", () => {
  it("sin preguntas no hay quiz ni problema", () => {
    expect(estadoQuiz([])).toMatchObject({ total: 0, completo: false, problema: null });
  });
  it("con menos de 3 pide más", () => {
    expect(estadoQuiz([lista(1), lista(2)]).problema).toBe("Agrega al menos 1 pregunta más.");
  });
  it("3 a 5 preguntas listas = completo", () => {
    expect(estadoQuiz([lista(1), lista(2), lista(3)]).completo).toBe(true);
    expect(estadoQuiz([lista(1), lista(2), { ...lista(3), texto: "" }]).problema).toBe("1 pregunta necesita completarse.");
  });
});

describe("validación del guardado", () => {
  it("acepta borradores incompletos pero no formas inválidas", () => {
    expect(quizSchema.safeParse([preguntaNueva(uuid(1))]).success).toBe(true);
    expect(quizSchema.safeParse([{ ...lista(1), opciones: ["A"] }]).success).toBe(false);
    expect(quizSchema.safeParse([{ ...lista(1), correcta: 3 }]).success).toBe(false);
    expect(quizSchema.safeParse([1, 2, 3, 4, 5, 6].map(lista)).success).toBe(false);
    expect(quizSchema.safeParse([lista(1), lista(1)]).success).toBe(false);
    expect(quizSchema.safeParse([{ ...lista(1), tipo: "verdadero_falso", opciones: ["Sí", "No"] }]).success).toBe(false);
  });
});

const curso = (quiz: PreguntaQuiz[] | undefined): CursoCompleto => ({
  id: "c",
  slug: "c",
  titulo: "Negociar contratos",
  descripcion: "x".repeat(60),
  publico: "Equipos de abastecimiento",
  estado: "borrador",
  modalidad: "a_su_ritmo",
  fechaInicio: null,
  fechaTermino: null,
  acceso: "enlace",
  publishedAt: null,
  createdAt: "",
  updatedAt: "",
  objetivos: ["Uno", "Dos"],
  modulos: [
    {
      id: "m",
      cursoId: "c",
      titulo: "Contexto",
      orden: 0,
      descripcion: null,
      objetivos: [],
      materiales: [],
      duracionMin: null,
      quiz,
      lecciones: [
        { id: "l", moduloId: "m", cursoId: "c", titulo: "L", tipo: "texto", contenidoUrl: null, contenidoTexto: "Hola", storagePath: null, contenidoTipo: null, descripcion: null, duracionMin: null, orden: 0 },
      ],
    },
  ],
});

describe("publicación con quiz", () => {
  it("sin quiz: se puede publicar y se recomienda agregar uno", () => {
    const r = validarPublicacion(curso(undefined));
    expect(r.puedePublicar).toBe(true);
    expect(r.recomendaciones.some((x) => /quiz de repaso/.test(x.mensaje))).toBe(true);
  });
  it("un quiz empezado e incompleto bloquea", () => {
    const r = validarPublicacion(curso([lista(1)]));
    expect(r.puedePublicar).toBe(false);
    expect(r.bloqueos[0]).toMatchObject({ paso: "estructura" });
  });
  it("con un quiz completo no hay bloqueo ni recomendación de quiz", () => {
    const r = validarPublicacion(curso([lista(1), lista(2), lista(3)]));
    expect(r.puedePublicar).toBe(true);
    expect(r.recomendaciones.some((x) => /quiz/.test(x.mensaje))).toBe(false);
  });
});