// Publicacion de cursos. Las reglas puras viven en reglasPublicacion.ts.
import { getCurso } from "./cursos";
import { validarPublicacion } from "./reglasPublicacion";
import { requireCreadorContext } from "./tenantActual";
import type { Resultado, ResultadoValidacionPublicacion, TenantCreador } from "./types";

export { validarPublicacion, leccionLista } from "./reglasPublicacion";

/** Enlace publico del curso: dominio propio si existe, si no <subdominio>.<root>. */
export function urlPublicaCurso(tenant: Pick<TenantCreador, "customDomain" | "subdomain">, slugCurso: string): string {
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "avantia.app";
  const host = tenant.customDomain ?? `${tenant.subdomain}.${root}`;
  return `https://${host}/curso/${slugCurso}`;
}

async function contarEstudiantes(cursoId: string): Promise<number> {
  const { tenant, db } = await requireCreadorContext();
  const { count } = await db
    .from("invitaciones").select("id", { count: "exact", head: true })
    .eq("tenant_id", tenant.id).eq("curso_id", cursoId).neq("estado", "revocada");
  return count ?? 0;
}

/** Valida el curso guardado en base (bloqueos + recomendaciones). */
export async function validarCursoParaPublicar(cursoId: string): Promise<Resultado<ResultadoValidacionPublicacion>> {
  const curso = await getCurso(cursoId);
  if (!curso) return { ok: false, error: "Curso no encontrado." };
  return { ok: true, data: validarPublicacion(curso, { estudiantesRegistrados: await contarEstudiantes(cursoId) }) };
}

/** Publica si no hay bloqueos. Revalida en el servidor siempre. */
export async function publicarCurso(cursoId: string): Promise<Resultado<{ url: string; slug: string }>> {
  const { tenant, db } = await requireCreadorContext();
  const curso = await getCurso(cursoId);
  if (!curso) return { ok: false, error: "Curso no encontrado." };
  const v = validarPublicacion(curso);
  if (!v.puedePublicar) return { ok: false, error: `Faltan ${v.bloqueos.length} cosas para publicar: ${v.bloqueos[0].mensaje}` };
  const { error } = await db
    .from("cursos")
    .update({ estado: "publicado", published_at: curso.publishedAt ?? new Date().toISOString() })
    .eq("tenant_id", tenant.id).eq("id", cursoId);
  if (error) return { ok: false, error: "No pudimos publicar. Tu borrador sigue guardado: reintenta." };
  return { ok: true, data: { url: urlPublicaCurso(tenant, curso.slug), slug: curso.slug } };
}

export async function despublicarCurso(cursoId: string): Promise<Resultado> {
  const { tenant, db } = await requireCreadorContext();
  const { error } = await db.from("cursos").update({ estado: "borrador" }).eq("tenant_id", tenant.id).eq("id", cursoId);
  return error ? { ok: false, error: "No pudimos pasar el curso a borrador." } : { ok: true, data: undefined };
}
