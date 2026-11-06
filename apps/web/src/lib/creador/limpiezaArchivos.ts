// Limpieza de archivos del bucket `materiales` (ADR 030). Al borrar una lección, un módulo o un
// curso, la base elimina en cascada las filas de `materiales`, pero NO los objetos de Storage:
// hay que quitarlos aparte, o quedan huérfanos ocupando espacio. Se recogen las rutas ANTES de
// borrar (después ya no se pueden consultar) y se quitan DESPUÉS de que el borrado salió bien.
// Sin dependencias del resto del repo para poder usarlo desde cursos.ts y estructura.ts.
import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "materiales";

export type AlcanceMateriales = { cursoId: string } | { moduloId: string } | { leccionId: string };

/** Rutas de los archivos subidos que cuelgan de un curso, módulo o lección del tenant. */
export async function rutasDeArchivos(db: SupabaseClient, tenantId: string, alcance: AlcanceMateriales): Promise<string[]> {
  let q = db.from("materiales").select("storage_path").eq("tenant_id", tenantId).eq("origen", "archivo").not("storage_path", "is", null);
  if ("cursoId" in alcance) q = q.eq("curso_id", alcance.cursoId);
  else if ("moduloId" in alcance) q = q.eq("modulo_id", alcance.moduloId);
  else q = q.eq("leccion_id", alcance.leccionId);
  const { data } = await q;
  return (data ?? []).map((r) => r.storage_path as string);
}

/** Quita los objetos del bucket. Un fallo aquí no debe deshacer el borrado ya hecho: solo se registra. */
export async function quitarArchivos(db: SupabaseClient, rutas: string[]): Promise<void> {
  if (rutas.length === 0) return;
  const { error } = await db.storage.from(BUCKET).remove(rutas);
  if (error) console.error("[creador/archivos] no se pudieron quitar objetos huérfanos", rutas.length, error.message);
}
