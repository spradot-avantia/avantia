// Repo de modulos y lecciones. Filtra siempre por tenant.id.
// Reordenar = intercambiar con el vecino y renormalizar 0..n (sin transaccion:
// son pocas filas y el orden es idempotente; ver ADR 006).
import { requireCreadorContext } from "./tenantActual";
import type { Resultado, TipoLeccion } from "./types";
import { textoLeccion, tituloLeccion, tituloModulo, validarUrlLeccion } from "./validacion";

const ERR = "No pudimos guardar el cambio. Inténtalo de nuevo.";

export async function crearModulo(cursoId: string, titulo: string): Promise<Resultado<{ id: string }>> {
  const { tenant, db } = await requireCreadorContext();
  const t = tituloModulo.safeParse(titulo);
  if (!t.success) return { ok: false, error: t.error.issues[0].message, campos: { titulo: t.error.issues[0].message } };
  const { data: ult } = await db
    .from("modulos").select("orden").eq("tenant_id", tenant.id).eq("curso_id", cursoId)
    .order("orden", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await db
    .from("modulos")
    .insert({ tenant_id: tenant.id, curso_id: cursoId, titulo: t.data, orden: (ult?.orden ?? -1) + 1 })
    .select("id").single();
  return error || !data ? { ok: false, error: ERR } : { ok: true, data: { id: data.id } };
}

export async function renombrarModulo(moduloId: string, titulo: string): Promise<Resultado> {
  const { tenant, db } = await requireCreadorContext();
  const t = tituloModulo.safeParse(titulo);
  if (!t.success) return { ok: false, error: t.error.issues[0].message, campos: { titulo: t.error.issues[0].message } };
  const { error } = await db.from("modulos").update({ titulo: t.data }).eq("tenant_id", tenant.id).eq("id", moduloId);
  return error ? { ok: false, error: ERR } : { ok: true, data: undefined };
}

export async function moverModulo(moduloId: string, direccion: "subir" | "bajar"): Promise<Resultado> {
  const { tenant, db } = await requireCreadorContext();
  const { data: m } = await db.from("modulos").select("curso_id").eq("tenant_id", tenant.id).eq("id", moduloId).maybeSingle();
  if (!m) return { ok: false, error: "Módulo no encontrado." };
  const { data: hermanos } = await db
    .from("modulos").select("id").eq("tenant_id", tenant.id).eq("curso_id", m.curso_id).order("orden").order("created_at");
  return reordenar("modulos", hermanos?.map((h) => h.id) ?? [], moduloId, direccion);
}

export async function eliminarModulo(moduloId: string): Promise<Resultado> {
  const { tenant, db } = await requireCreadorContext();
  const { error } = await db.from("modulos").delete().eq("tenant_id", tenant.id).eq("id", moduloId);
  return error ? { ok: false, error: ERR } : { ok: true, data: undefined };
}

export async function crearLeccion(moduloId: string, input: { titulo: string; tipo: TipoLeccion }): Promise<Resultado<{ id: string }>> {
  const { tenant, db } = await requireCreadorContext();
  const t = tituloLeccion.safeParse(input.titulo);
  if (!t.success) return { ok: false, error: t.error.issues[0].message, campos: { titulo: t.error.issues[0].message } };
  const { data: m } = await db.from("modulos").select("curso_id").eq("tenant_id", tenant.id).eq("id", moduloId).maybeSingle();
  if (!m) return { ok: false, error: "Módulo no encontrado." };
  const { data: ult } = await db
    .from("lecciones").select("orden").eq("tenant_id", tenant.id).eq("modulo_id", moduloId)
    .order("orden", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await db
    .from("lecciones")
    .insert({ tenant_id: tenant.id, curso_id: m.curso_id, modulo_id: moduloId, titulo: t.data, tipo: input.tipo, orden: (ult?.orden ?? -1) + 1 })
    .select("id").single();
  return error || !data ? { ok: false, error: ERR } : { ok: true, data: { id: data.id } };
}

export interface LeccionPatch {
  titulo?: string;
  tipo?: TipoLeccion;
  contenidoUrl?: string | null;
  contenidoTexto?: string | null;
}

/** Actualiza titulo, tipo o contenido. Valida URL contra la lista blanca. */
export async function actualizarLeccion(leccionId: string, patch: LeccionPatch): Promise<Resultado> {
  const { tenant, db } = await requireCreadorContext();
  const { data: actual } = await db.from("lecciones").select("tipo").eq("tenant_id", tenant.id).eq("id", leccionId).maybeSingle();
  if (!actual) return { ok: false, error: "Lección no encontrada." };
  const tipo = patch.tipo ?? (actual.tipo as TipoLeccion);
  const fila: Record<string, unknown> = {};

  if (patch.titulo !== undefined) {
    const t = tituloLeccion.safeParse(patch.titulo);
    if (!t.success) return { ok: false, error: t.error.issues[0].message, campos: { titulo: t.error.issues[0].message } };
    fila.titulo = t.data;
  }
  if (patch.tipo !== undefined && patch.tipo !== actual.tipo) {
    // Cambiar de tipo descarta el contenido del tipo anterior.
    fila.tipo = patch.tipo;
    fila.contenido_url = null;
    fila.contenido_texto = null;
  }
  if (patch.contenidoUrl !== undefined) {
    if (patch.contenidoUrl === null || patch.contenidoUrl.trim() === "") fila.contenido_url = null;
    else {
      const u = validarUrlLeccion(tipo, patch.contenidoUrl);
      if (!u.ok) return { ok: false, error: u.error, campos: { contenidoUrl: u.error } };
      fila.contenido_url = u.url;
    }
  }
  if (patch.contenidoTexto !== undefined) {
    if (tipo !== "texto") return { ok: false, error: "Esta lección no es de texto." };
    const x = textoLeccion.safeParse(patch.contenidoTexto ?? "");
    if (!x.success) return { ok: false, error: x.error.issues[0].message, campos: { contenidoTexto: x.error.issues[0].message } };
    fila.contenido_texto = x.data;
  }
  if (Object.keys(fila).length === 0) return { ok: true, data: undefined };
  const { error } = await db.from("lecciones").update(fila).eq("tenant_id", tenant.id).eq("id", leccionId);
  return error ? { ok: false, error: ERR } : { ok: true, data: undefined };
}

export async function renombrarLeccion(leccionId: string, titulo: string): Promise<Resultado> {
  return actualizarLeccion(leccionId, { titulo });
}

export async function moverLeccion(leccionId: string, direccion: "subir" | "bajar"): Promise<Resultado> {
  const { tenant, db } = await requireCreadorContext();
  const { data: l } = await db.from("lecciones").select("modulo_id").eq("tenant_id", tenant.id).eq("id", leccionId).maybeSingle();
  if (!l) return { ok: false, error: "Lección no encontrada." };
  const { data: hermanas } = await db
    .from("lecciones").select("id").eq("tenant_id", tenant.id).eq("modulo_id", l.modulo_id).order("orden").order("created_at");
  return reordenar("lecciones", hermanas?.map((h) => h.id) ?? [], leccionId, direccion);
}

export async function eliminarLeccion(leccionId: string): Promise<Resultado> {
  const { tenant, db } = await requireCreadorContext();
  const { error } = await db.from("lecciones").delete().eq("tenant_id", tenant.id).eq("id", leccionId);
  return error ? { ok: false, error: ERR } : { ok: true, data: undefined };
}

async function reordenar(tabla: "modulos" | "lecciones", ids: string[], id: string, dir: "subir" | "bajar"): Promise<Resultado> {
  const { tenant, db } = await requireCreadorContext();
  const i = ids.indexOf(id);
  const j = dir === "subir" ? i - 1 : i + 1;
  if (i === -1 || j < 0 || j >= ids.length) return { ok: true, data: undefined };
  [ids[i], ids[j]] = [ids[j], ids[i]];
  const res = await Promise.all(
    ids.map((x, orden) => db.from(tabla).update({ orden }).eq("tenant_id", tenant.id).eq("id", x)),
  );
  return res.some((r) => r.error) ? { ok: false, error: ERR } : { ok: true, data: undefined };
}
