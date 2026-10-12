// Estudiantes registrados por el creador (tabla invitaciones, ADR 007).
import { requireCreadorContext } from "./tenantActual";
import type { Invitacion, Resultado } from "./types";
import { parsearCorreos } from "./validacion";

function mapInv(r: any): Invitacion {
  return { id: r.id, cursoId: r.curso_id, email: r.email, estado: r.estado, createdAt: r.created_at };
}

/** Lista registros de la academia; opcionalmente de un curso. */
export async function listarEstudiantes(cursoId?: string): Promise<Invitacion[]> {
  const { tenant, db } = await requireCreadorContext();
  let q = db
    .from("invitaciones").select("id, curso_id, email, estado, created_at")
    .eq("tenant_id", tenant.id).order("created_at", { ascending: false });
  if (cursoId) q = q.eq("curso_id", cursoId);
  const { data } = await q;
  return (data ?? []).map(mapInv);
}

export interface ResumenRegistro {
  agregados: string[];
  yaRegistrados: string[];
  invalidos: string[];
}

/** Registra correos pegados (coma, espacio o salto de linea) en un curso. */
export async function registrarEstudiantes(cursoId: string, texto: string): Promise<Resultado<ResumenRegistro>> {
  const { tenant, db } = await requireCreadorContext();
  const { validos, invalidos } = parsearCorreos(texto);
  if (validos.length === 0) {
    return { ok: false, error: invalidos.length ? "Ningún correo es válido. Revisa que tengan formato nombre@dominio." : "Pega al menos un correo." };
  }
  if (validos.length > 500) return { ok: false, error: "Registra hasta 500 correos por vez." };

  const { data: curso } = await db.from("cursos").select("id").eq("tenant_id", tenant.id).eq("id", cursoId).maybeSingle();
  if (!curso) return { ok: false, error: "Curso no encontrado." };

  const { data: existentes } = await db
    .from("invitaciones").select("email").eq("tenant_id", tenant.id).eq("curso_id", cursoId).in("email", validos);
  const ya = new Set((existentes ?? []).map((e) => e.email as string));
  const nuevos = validos.filter((e) => !ya.has(e));
  if (nuevos.length) {
    const { error } = await db
      .from("invitaciones")
      .insert(nuevos.map((email) => ({ tenant_id: tenant.id, curso_id: cursoId, email })));
    if (error) return { ok: false, error: "No pudimos registrar a los estudiantes. Inténtalo de nuevo." };
  }
  return { ok: true, data: { agregados: nuevos, yaRegistrados: [...ya], invalidos } };
}

export async function quitarEstudiante(invitacionId: string): Promise<Resultado> {
  const { tenant, db } = await requireCreadorContext();
  const { error } = await db.from("invitaciones").delete().eq("tenant_id", tenant.id).eq("id", invitacionId);
  return error ? { ok: false, error: "No pudimos quitar al estudiante." } : { ok: true, data: undefined };
}
