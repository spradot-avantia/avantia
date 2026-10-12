// Carga de datos (solo servidor) para el editor y la vista previa. Degrada sin
// romper: sin Supabase configurado o sin academia devuelve un estado, no lanza.
import { getCurso } from "./cursos";
import { urlPublicaCurso } from "./publicacion";
import { getCreadorContext } from "./tenantActual";
import type { CursoCompleto, TenantCreador } from "./types";

export type CargaEditor =
  | { estado: "ok"; curso: CursoCompleto; tenant: TenantCreador; urlPublica: string }
  | { estado: "sin_academia" }
  | { estado: "no_encontrado" }
  | { estado: "error" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function cargarCursoParaEditor(cursoId: string): Promise<CargaEditor> {
  if (!UUID.test(cursoId)) return { estado: "no_encontrado" };
  try {
    const ctx = await getCreadorContext();
    if (!ctx) return { estado: "sin_academia" };
    const curso = await getCurso(cursoId);
    if (!curso) return { estado: "no_encontrado" };
    return { estado: "ok", curso, tenant: ctx.tenant, urlPublica: urlPublicaCurso(ctx.tenant, curso.slug) };
  } catch (e) {
    console.error("[creador/editor] no se pudo cargar el curso", e);
    return { estado: "error" };
  }
}
