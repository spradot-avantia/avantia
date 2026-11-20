// Completitud del contenido de un curso (Inicio del creador): cuánto está listo para el alumno.
// Reglas puras; reutiliza las mismas que validan la publicación (leccionLista, estadoQuiz).
import { estadoQuiz } from "./quiz";
import { leccionLista } from "./reglasPublicacion";
import type { Modulo } from "./types";

export type EstadoModulo = "completo" | "en_edicion" | "pendiente";

export interface CompletitudModulo {
  id: string;
  titulo: string;
  estado: EstadoModulo;
  /** Lecciones con contenido listo. */
  listas: number;
  lecciones: number;
}

export interface CompletitudCurso {
  /** 0–100: (lecciones listas + quizzes completos) / (lecciones + quizzes empezados). */
  pct: number;
  modulos: CompletitudModulo[];
  completos: number;
  enEdicion: number;
  pendientes: number;
}

type ModuloContenido = Pick<Modulo, "id" | "titulo" | "lecciones" | "quiz">;

/**
 * Pendiente: sin lecciones o ninguna lista. Completo: todas las lecciones listas y el quiz, si
 * se empezó, completo. Lo demás está en edición.
 */
export function completitudModulo(m: ModuloContenido): CompletitudModulo {
  const listas = m.lecciones.filter((l) => leccionLista(l)).length;
  const q = estadoQuiz(m.quiz);
  let estado: EstadoModulo;
  if (m.lecciones.length === 0 || listas === 0) estado = "pendiente";
  else if (listas === m.lecciones.length && (q.total === 0 || q.completo)) estado = "completo";
  else estado = "en_edicion";
  return { id: m.id, titulo: m.titulo.trim() || "Módulo sin nombre", estado, listas, lecciones: m.lecciones.length };
}

export function completitudCurso(curso: { modulos: ModuloContenido[] }): CompletitudCurso {
  let total = 0;
  let listos = 0;
  for (const m of curso.modulos) {
    total += m.lecciones.length;
    listos += m.lecciones.filter((l) => leccionLista(l)).length;
    const q = estadoQuiz(m.quiz);
    if (q.total > 0) {
      total += 1;
      if (q.completo) listos += 1;
    }
  }
  const modulos = curso.modulos.map(completitudModulo);
  return {
    pct: total ? Math.round((listos / total) * 100) : 0,
    modulos,
    completos: modulos.filter((m) => m.estado === "completo").length,
    enEdicion: modulos.filter((m) => m.estado === "en_edicion").length,
    pendientes: modulos.filter((m) => m.estado === "pendiente").length,
  };
}

/** «2 completos · 1 en edición · 1 pendiente» o «3 de 3 módulos completos». */
export function resumenModulos(c: Pick<CompletitudCurso, "completos" | "enEdicion" | "pendientes">): string {
  const n = c.completos + c.enEdicion + c.pendientes;
  if (n === 0) return "Sin módulos todavía";
  if (c.completos === n) return `${n} de ${n} ${n === 1 ? "módulo completo" : "módulos completos"}`;
  const partes: string[] = [];
  if (c.completos) partes.push(`${c.completos} ${c.completos === 1 ? "completo" : "completos"}`);
  if (c.enEdicion) partes.push(`${c.enEdicion} en edición`);
  if (c.pendientes) partes.push(`${c.pendientes} ${c.pendientes === 1 ? "pendiente" : "pendientes"}`);
  return partes.join(" · ");
}
