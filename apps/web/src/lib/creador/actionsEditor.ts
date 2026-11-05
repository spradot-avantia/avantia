"use server";

// Server Actions propias del editor de curso (complementan actions.ts, que no
// se toca). Ninguna recibe tenant_id: sale de la sesion (tenantActual.ts).
import { getCurso } from "./cursos";
import { actualizarModulo, crearModulo, type ModuloPatch } from "./estructura";
import * as materiales from "./materiales";
import type { PreguntaQuiz } from "./quiz";
import { guardarQuiz } from "./quizzes";
import type { CursoCompleto, Material, Resultado, TipoMaterial } from "./types";

const SUGERIDA = ["Contexto", "Casos reales", "Aplicación"];

async function seguro<T>(fn: () => Promise<Resultado<T>>): Promise<Resultado<T>> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof Error && e.name === "SinTenantError") return { ok: false, error: e.message };
    console.error("[creador/editor] acción falló", e);
    return { ok: false, error: "Algo salió mal. Inténtalo de nuevo." };
  }
}

/** Relee el curso desde la base (para resincronizar tras un error de guardado). */
export async function obtenerCursoAction(cursoId: string): Promise<Resultado<CursoCompleto>> {
  return seguro(async () => {
    const c = await getCurso(cursoId);
    return c ? { ok: true, data: c } : { ok: false, error: "Curso no encontrado." };
  });
}

/** Agrega los 3 modulos de la estructura sugerida a un curso sin modulos. */
export async function aplicarEstructuraSugeridaAction(cursoId: string): Promise<Resultado<CursoCompleto>> {
  return seguro(async () => {
    const actual = await getCurso(cursoId);
    if (!actual) return { ok: false, error: "Curso no encontrado." };
    if (actual.modulos.length === 0) {
      for (const t of SUGERIDA) {
        const r = await crearModulo(cursoId, t);
        if (!r.ok) return r;
      }
    }
    const c = await getCurso(cursoId);
    return c ? { ok: true, data: c } : { ok: false, error: "Curso no encontrado." };
  });
}


/** Guarda el quiz de repaso de un módulo (ADR 022). Reemplaza sus preguntas. */
export async function guardarQuizAction(moduloId: string, preguntas: PreguntaQuiz[]): Promise<Resultado<PreguntaQuiz[]>> {
  return seguro(() => guardarQuiz(moduloId, preguntas));
}

/** Actualiza título y presentación del módulo (descripción, «Qué aprenderás», duración). ADR 029. */
export async function actualizarModuloAction(moduloId: string, patch: ModuloPatch): Promise<Resultado> {
  return seguro(() => actualizarModulo(moduloId, patch));
}

// ---- Materiales (ADR 029, F2) ----------------------------------------------
export async function crearMaterialAction(
  moduloId: string,
  opciones: { leccionId?: string | null; tipo?: TipoMaterial } = {},
): Promise<Resultado<Material>> {
  return seguro(() => materiales.crearMaterial(moduloId, opciones));
}
export async function actualizarMaterialAction(materialId: string, patch: materiales.MaterialPatch): Promise<Resultado> {
  return seguro(() => materiales.actualizarMaterial(materialId, patch));
}
export async function moverMaterialAction(materialId: string, direccion: "subir" | "bajar"): Promise<Resultado> {
  return seguro(() => materiales.moverMaterial(materialId, direccion));
}
export async function eliminarMaterialAction(materialId: string): Promise<Resultado> {
  return seguro(() => materiales.eliminarMaterial(materialId));
}
