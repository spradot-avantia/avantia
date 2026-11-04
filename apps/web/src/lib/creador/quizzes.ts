// Repo del quiz de repaso por módulo (ADR 022). Filtra siempre por tenant.id
// (además de RLS). El tenant sale de la sesión (tenantActual.ts).
import type { SupabaseClient } from "@supabase/supabase-js";
import { quizSchema, type PreguntaQuiz } from "./quiz";
import { requireCreadorContext } from "./tenantActual";
import type { Resultado } from "./types";

const COLS = "id, modulo_id, orden, tipo, texto, opciones, correcta, explicacion";

export function mapPregunta(r: any): PreguntaQuiz {
  return {
    id: r.id,
    tipo: r.tipo === "verdadero_falso" ? "verdadero_falso" : "opcion_multiple",
    texto: r.texto ?? "",
    opciones: Array.isArray(r.opciones) ? r.opciones.map(String) : [],
    correcta: typeof r.correcta === "number" ? r.correcta : null,
    explicacion: r.explicacion ?? "",
  };
}

/** Preguntas de todos los módulos de un curso, agrupadas por módulo y en orden. */
export async function preguntasPorModulo(db: SupabaseClient, tenantId: string, cursoId: string): Promise<Map<string, PreguntaQuiz[]>> {
  const { data } = await db.from("quiz_preguntas").select(COLS).eq("tenant_id", tenantId).eq("curso_id", cursoId).order("orden");
  const m = new Map<string, PreguntaQuiz[]>();
  for (const r of data ?? []) {
    const lista = m.get(r.modulo_id) ?? [];
    lista.push(mapPregunta(r));
    m.set(r.modulo_id, lista);
  }
  return m;
}

/**
 * Reemplaza el quiz de un módulo por las preguntas dadas (autoguardado del
 * editor): actualiza las que siguen, crea las nuevas y borra las que se quitaron.
 */
export async function guardarQuiz(moduloId: string, preguntas: PreguntaQuiz[]): Promise<Resultado<PreguntaQuiz[]>> {
  const p = quizSchema.safeParse(preguntas);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Revisa las preguntas." };

  const { tenant, db } = await requireCreadorContext();
  const { data: m } = await db.from("modulos").select("curso_id").eq("tenant_id", tenant.id).eq("id", moduloId).maybeSingle();
  if (!m) return { ok: false, error: "Módulo no encontrado." };

  const ids = p.data.map((q) => q.id);
  // Borra las que ya no están (si no queda ninguna, borra todas las del módulo).
  let borrar = db.from("quiz_preguntas").delete().eq("tenant_id", tenant.id).eq("modulo_id", moduloId);
  if (ids.length) borrar = borrar.not("id", "in", `(${ids.join(",")})`);
  const b = await borrar;
  if (b.error) return { ok: false, error: "No pudimos guardar el quiz. Inténtalo de nuevo." };

  if (p.data.length) {
    const filas = p.data.map((q, i) => ({
      id: q.id,
      tenant_id: tenant.id,
      curso_id: m.curso_id,
      modulo_id: moduloId,
      orden: i,
      tipo: q.tipo,
      texto: q.texto,
      opciones: q.opciones,
      correcta: q.correcta,
      explicacion: q.explicacion,
    }));
    const u = await db.from("quiz_preguntas").upsert(filas, { onConflict: "id" });
    if (u.error) {
      console.error("[quiz] no se pudo guardar", u.error.code, u.error.message);
      return { ok: false, error: "No pudimos guardar el quiz. Inténtalo de nuevo." };
    }
  }
  const { data } = await db.from("quiz_preguntas").select(COLS).eq("tenant_id", tenant.id).eq("modulo_id", moduloId).order("orden");
  return { ok: true, data: (data ?? []).map(mapPregunta) };
}