// Reglas del quiz de repaso por módulo (ADR 022). Módulo PURO: lo usan el
// editor (cliente), las Server Actions y las reglas de publicación.
import { z } from "zod";

export type TipoPregunta = "opcion_multiple" | "verdadero_falso";

export interface PreguntaQuiz {
  /** uuid generado en el editor; se conserva al editar. */
  id: string;
  tipo: TipoPregunta;
  texto: string;
  opciones: string[];
  /** Índice de la opción correcta; null mientras no se marca. */
  correcta: number | null;
  explicacion: string;
}

export const QUIZ_MIN = 3;
export const QUIZ_MAX = 5;
export const OPCIONES_MIN = 2;
export const OPCIONES_MAX = 4;
export const PREGUNTA_MAX = 300;
export const OPCION_MAX = 160;
export const EXPLICACION_MAX = 400;
export const OPCIONES_VF = ["Verdadero", "Falso"] as const;

export const ETIQUETA_TIPO: Record<TipoPregunta, string> = {
  opcion_multiple: "Opción múltiple",
  verdadero_falso: "Verdadero o falso",
};

/** Pregunta nueva vacía (opción múltiple con 3 respuestas). */
export function preguntaNueva(id: string): PreguntaQuiz {
  return { id, tipo: "opcion_multiple", texto: "", opciones: ["", "", ""], correcta: null, explicacion: "" };
}

/** Cambia el tipo: V/F fija las dos opciones; opción múltiple vuelve a 3 vacías. */
export function cambiarTipo(p: PreguntaQuiz, tipo: TipoPregunta): PreguntaQuiz {
  if (p.tipo === tipo) return p;
  return tipo === "verdadero_falso"
    ? { ...p, tipo, opciones: [...OPCIONES_VF], correcta: null }
    : { ...p, tipo, opciones: ["", "", ""], correcta: null };
}

/** Qué le falta a una pregunta para estar lista (null = lista). */
export function problemaPregunta(p: PreguntaQuiz): string | null {
  if (!p.texto.trim()) return "Falta escribir la pregunta.";
  if (p.correcta == null || p.correcta < 0 || p.correcta >= p.opciones.length) return "Marca cuál es la respuesta correcta.";
  if (p.tipo === "opcion_multiple" && p.opciones.some((o) => !o.trim())) return "Completa o quita las respuestas vacías.";
  if (p.tipo === "opcion_multiple") {
    const vistas = new Set(p.opciones.map((o) => o.trim().toLowerCase()));
    if (vistas.size !== p.opciones.length) return "Hay dos respuestas iguales.";
  }
  return null;
}

export interface EstadoQuiz {
  total: number;
  listas: number;
  /** Tiene de 3 a 5 preguntas y todas están listas. */
  completo: boolean;
  /** Mensaje para el creador si el quiz existe pero no está listo. */
  problema: string | null;
}

export function estadoQuiz(preguntas: PreguntaQuiz[] | undefined): EstadoQuiz {
  const ps = preguntas ?? [];
  const total = ps.length;
  const listas = ps.filter((p) => !problemaPregunta(p)).length;
  let problema: string | null = null;
  if (total > 0 && total < QUIZ_MIN) {
    const faltan = QUIZ_MIN - total;
    problema = `Agrega al menos ${faltan} ${faltan === 1 ? "pregunta más" : "preguntas más"}.`;
  } else if (total > QUIZ_MAX) problema = `Deja como máximo ${QUIZ_MAX} preguntas.`;
  else if (listas < total) problema = `${total - listas} ${total - listas === 1 ? "pregunta necesita" : "preguntas necesitan"} completarse.`;
  return { total, listas, completo: total >= QUIZ_MIN && total <= QUIZ_MAX && listas === total, problema };
}

// ---------------------------------------------------------------- Validación del guardado

/** El borrador puede quedar incompleto; solo se limitan formas y largos. */
const preguntaSchema = z
  .object({
    id: z.string().uuid(),
    tipo: z.enum(["opcion_multiple", "verdadero_falso"]),
    texto: z.string().max(PREGUNTA_MAX, `La pregunta admite hasta ${PREGUNTA_MAX} caracteres.`),
    opciones: z
      .array(z.string().max(OPCION_MAX, `Cada respuesta admite hasta ${OPCION_MAX} caracteres.`))
      .min(OPCIONES_MIN, `Deja al menos ${OPCIONES_MIN} respuestas.`)
      .max(OPCIONES_MAX, `Puedes tener hasta ${OPCIONES_MAX} respuestas.`),
    correcta: z.number().int().min(0).max(OPCIONES_MAX - 1).nullable(),
    explicacion: z.string().max(EXPLICACION_MAX, `La explicación admite hasta ${EXPLICACION_MAX} caracteres.`),
  })
  .strict()
  .refine((p) => p.correcta == null || p.correcta < p.opciones.length, { message: "La respuesta correcta no existe.", path: ["correcta"] })
  .refine((p) => p.tipo !== "verdadero_falso" || (p.opciones.length === 2 && p.opciones[0] === "Verdadero" && p.opciones[1] === "Falso"), {
    message: "Verdadero o falso usa las respuestas «Verdadero» y «Falso».",
    path: ["opciones"],
  });

export const quizSchema = z
  .array(preguntaSchema)
  .max(QUIZ_MAX, `El quiz admite hasta ${QUIZ_MAX} preguntas.`)
  .refine((ps) => new Set(ps.map((p) => p.id)).size === ps.length, { message: "Hay preguntas repetidas." });