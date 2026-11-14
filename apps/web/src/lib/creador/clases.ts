// Clases en vivo, lado creador (ADR 039, Fase 1): fecha, enlace de Meet pegado a mano,
// grabación y resumen. Sesión + RLS por tenant, y además .eq("tenant_id") en cada query.
import { utcALocal, validarClase, type EntradaClase } from "../tareas/reglas";
import { requireCreadorContext } from "./tenantActual";
import type { Resultado } from "./types";

const COLS = "id, curso_id, titulo, descripcion, inicia_at, duracion_min, enlace_meet, grabacion_url, resumen";

export interface ClaseCreador {
  id: string;
  cursoId: string;
  titulo: string;
  descripcion: string;
  iniciaAt: string;
  /** Para el input datetime-local, en hora de la academia. */
  inicia: string;
  duracionMin: number;
  enlaceMeet: string;
  grabacionUrl: string;
  resumen: string;
}

function mapClase(r: any): ClaseCreador {
  return {
    id: r.id,
    cursoId: r.curso_id,
    titulo: r.titulo,
    descripcion: r.descripcion ?? "",
    iniciaAt: r.inicia_at,
    inicia: utcALocal(r.inicia_at),
    duracionMin: r.duracion_min,
    enlaceMeet: r.enlace_meet ?? "",
    grabacionUrl: r.grabacion_url ?? "",
    resumen: r.resumen ?? "",
  };
}

export async function listarClases(): Promise<ClaseCreador[]> {
  const { tenant, db } = await requireCreadorContext();
  const { data } = await db.from("clases_en_vivo").select(COLS).eq("tenant_id", tenant.id).order("inicia_at", { ascending: false }).limit(200);
  return (data ?? []).map(mapClase);
}

/** Crea (sin `claseId`) o actualiza una clase. El curso debe ser de la academia de la sesión. */
export async function guardarClase(claseId: string | null, cursoId: string, entrada: EntradaClase): Promise<Resultado<ClaseCreador>> {
  const v = validarClase(entrada);
  if (!v.ok) return { ok: false, error: v.error, campos: v.campos };
  const { tenant, db } = await requireCreadorContext();
  const { data: curso } = await db.from("cursos").select("id").eq("tenant_id", tenant.id).eq("id", cursoId).maybeSingle();
  if (!curso) return { ok: false, error: "Elige un curso de tu academia.", campos: { cursoId: "Elige un curso de tu academia." } };

  const fila = {
    curso_id: cursoId,
    titulo: v.data.titulo,
    descripcion: v.data.descripcion,
    inicia_at: v.data.iniciaAt,
    duracion_min: v.data.duracionMin,
    enlace_meet: v.data.enlaceMeet,
    grabacion_url: v.data.grabacionUrl,
    resumen: v.data.resumen,
  };
  const q = claseId
    ? db.from("clases_en_vivo").update(fila).eq("tenant_id", tenant.id).eq("id", claseId)
    : db.from("clases_en_vivo").insert({ ...fila, tenant_id: tenant.id });
  const { data, error } = await q.select(COLS).single();
  if (error || !data) return { ok: false, error: "No pudimos guardar la clase. Inténtalo de nuevo." };
  return { ok: true, data: mapClase(data) };
}

export async function eliminarClase(claseId: string): Promise<Resultado> {
  const { tenant, db } = await requireCreadorContext();
  const { error } = await db.from("clases_en_vivo").delete().eq("tenant_id", tenant.id).eq("id", claseId);
  return error ? { ok: false, error: "No pudimos quitar la clase. Inténtalo de nuevo." } : { ok: true, data: undefined };
}
