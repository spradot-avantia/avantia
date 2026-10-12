"use server";

// Server Actions propias del editor de curso (complementan actions.ts, que no
// se toca). Ninguna recibe tenant_id: sale de la sesion (tenantActual.ts).
import { getCurso } from "./cursos";
import { crearModulo } from "./estructura";
import type { CursoCompleto, Resultado } from "./types";

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
