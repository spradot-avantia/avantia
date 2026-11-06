// Lectura de materiales para el alumno (ADR 029 F3, ADR 030). Service role con
// .eq("tenant_id", tenantId) en cada query, como el resto de lib/alumno (ADR 018).
// El alumno nunca lee el bucket directo: los archivos se entregan con URL firmada de 60 s,
// emitida solo después de comprobar sesión, inscripción activa y lección liberada.
import { supabaseAdmin } from "../supabase/admin";
import { aMaterialAlumno, esCompleto, type FilaMaterial, type MaterialAlumno } from "./materialesReglas";

const BUCKET = "materiales";
const COLS = "id, modulo_id, leccion_id, titulo, nota, origen, url, storage_path, archivo_nombre, mime, bytes";
const SEGUNDOS_URL = 60;

/** Materiales completos del curso, en orden, sin la ruta interna. Solo para páginas con guardia de inscripción. */
export async function materialesDeCurso(tenantId: string, cursoId: string): Promise<MaterialAlumno[]> {
  const { data } = await supabaseAdmin
    .from("materiales")
    .select(COLS)
    .eq("tenant_id", tenantId)
    .eq("curso_id", cursoId)
    .order("orden");
  return ((data ?? []) as FilaMaterial[]).filter(esCompleto).map(aMaterialAlumno);
}

/** Un material de archivo del curso (para validar permisos antes de firmar). Null si no existe en ese tenant y curso. */
export async function materialDeArchivo(tenantId: string, cursoId: string, materialId: string) {
  const { data } = await supabaseAdmin
    .from("materiales")
    .select(COLS)
    .eq("tenant_id", tenantId)
    .eq("curso_id", cursoId)
    .eq("id", materialId)
    .eq("origen", "archivo")
    .maybeSingle();
  const fila = data as FilaMaterial | null;
  if (!fila || !esCompleto(fila)) return null;
  return { material: aMaterialAlumno(fila), storagePath: fila.storage_path as string };
}

/** Archivo propio de una lección de tipo documento (ADR 030). Null si no existe en ese tenant y curso. */
export async function archivoDeLeccion(tenantId: string, cursoId: string, leccionId: string) {
  const { data } = await supabaseAdmin
    .from("lecciones")
    .select("storage_path")
    .eq("tenant_id", tenantId)
    .eq("curso_id", cursoId)
    .eq("id", leccionId)
    .eq("tipo", "documento")
    .not("storage_path", "is", null)
    .maybeSingle();
  return data?.storage_path ? { storagePath: data.storage_path as string } : null;
}

/** URL firmada de corta duración (no se guarda ni se cachea). */
export async function firmarArchivo(storagePath: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(storagePath, SEGUNDOS_URL);
  return error || !data ? null : data.signedUrl;
}
