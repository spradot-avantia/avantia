// Repo de materiales de módulo y de lección (ADR 029, F2). Filtra siempre por tenant.id
// (además de RLS) y nunca recibe el tenant desde la request. Reordenar = intercambiar con el
// vecino y renormalizar 0..n, como en estructura.ts.
import { mapMaterial } from "./cursos";
import { requireCreadorContext } from "./tenantActual";
import type { Material, Resultado, TipoMaterial } from "./types";
import {
  MATERIALES_MODULO_MAX,
  notaMaterial,
  tipoMaterial,
  tituloMaterial,
  validarUrlMaterial,
} from "./validacion";

const ERR = "No pudimos guardar el cambio. Inténtalo de nuevo.";
const COLS = "id, curso_id, modulo_id, leccion_id, titulo, url, tipo, nota, orden";

/** Agrega un material vacío al módulo (o a una de sus lecciones); el creador lo completa luego. */
export async function crearMaterial(
  moduloId: string,
  opciones: { leccionId?: string | null; tipo?: TipoMaterial } = {},
): Promise<Resultado<Material>> {
  const { tenant, db } = await requireCreadorContext();
  const { data: m } = await db.from("modulos").select("curso_id").eq("tenant_id", tenant.id).eq("id", moduloId).maybeSingle();
  if (!m) return { ok: false, error: "Módulo no encontrado." };

  const leccionId = opciones.leccionId ?? null;
  if (leccionId) {
    // La lección debe ser de este mismo módulo y de este tenant.
    const { data: l } = await db
      .from("lecciones").select("id").eq("tenant_id", tenant.id).eq("modulo_id", moduloId).eq("id", leccionId).maybeSingle();
    if (!l) return { ok: false, error: "Lección no encontrada." };
  }
  const tipo = tipoMaterial.safeParse(opciones.tipo ?? "enlace");
  if (!tipo.success) return { ok: false, error: "Tipo de material no válido." };

  const { data: existentes } = await db
    .from("materiales").select("orden").eq("tenant_id", tenant.id).eq("modulo_id", moduloId).order("orden", { ascending: false });
  if ((existentes?.length ?? 0) >= MATERIALES_MODULO_MAX) {
    return { ok: false, error: `Un módulo admite hasta ${MATERIALES_MODULO_MAX} materiales (incluidos los de sus lecciones).` };
  }
  const orden = (existentes?.[0]?.orden ?? -1) + 1;

  const { data, error } = await db
    .from("materiales")
    .insert({
      tenant_id: tenant.id,
      curso_id: m.curso_id,
      modulo_id: moduloId,
      leccion_id: leccionId,
      titulo: "Nuevo material",
      tipo: tipo.data,
      orden,
    })
    .select(COLS)
    .single();
  return error || !data ? { ok: false, error: ERR } : { ok: true, data: mapMaterial(data) };
}

export interface MaterialPatch {
  titulo?: string;
  url?: string | null;
  tipo?: TipoMaterial;
  nota?: string | null;
}

export async function actualizarMaterial(materialId: string, patch: MaterialPatch): Promise<Resultado> {
  const { tenant, db } = await requireCreadorContext();
  const fila: Record<string, unknown> = {};
  if (patch.titulo !== undefined) {
    const t = tituloMaterial.safeParse(patch.titulo);
    if (!t.success) return { ok: false, error: t.error.issues[0].message, campos: { titulo: t.error.issues[0].message } };
    fila.titulo = t.data;
  }
  if (patch.url !== undefined) {
    if (patch.url === null || patch.url.trim() === "") fila.url = null;
    else {
      const u = validarUrlMaterial(patch.url);
      if (!u.ok) return { ok: false, error: u.error, campos: { url: u.error } };
      fila.url = u.url;
    }
  }
  if (patch.tipo !== undefined) {
    const t = tipoMaterial.safeParse(patch.tipo);
    if (!t.success) return { ok: false, error: "Tipo de material no válido.", campos: { tipo: "Tipo de material no válido." } };
    fila.tipo = t.data;
  }
  if (patch.nota !== undefined) {
    const n = notaMaterial.safeParse(patch.nota ?? "");
    if (!n.success) return { ok: false, error: n.error.issues[0].message, campos: { nota: n.error.issues[0].message } };
    fila.nota = n.data;
  }
  if (Object.keys(fila).length === 0) return { ok: true, data: undefined };
  const { error } = await db.from("materiales").update(fila).eq("tenant_id", tenant.id).eq("id", materialId);
  return error ? { ok: false, error: ERR } : { ok: true, data: undefined };
}

/** Sube o baja un material dentro de su grupo (los del módulo, o los de una misma lección). */
export async function moverMaterial(materialId: string, direccion: "subir" | "bajar"): Promise<Resultado> {
  const { tenant, db } = await requireCreadorContext();
  const { data: m } = await db
    .from("materiales").select("modulo_id, leccion_id").eq("tenant_id", tenant.id).eq("id", materialId).maybeSingle();
  if (!m) return { ok: false, error: "Material no encontrado." };
  let q = db.from("materiales").select("id").eq("tenant_id", tenant.id).eq("modulo_id", m.modulo_id);
  q = m.leccion_id ? q.eq("leccion_id", m.leccion_id) : q.is("leccion_id", null);
  const { data: hermanos } = await q.order("orden").order("created_at");
  const ids = hermanos?.map((h) => h.id) ?? [];
  const i = ids.indexOf(materialId);
  const j = direccion === "subir" ? i - 1 : i + 1;
  if (i === -1 || j < 0 || j >= ids.length) return { ok: true, data: undefined };
  // Se intercambian los valores de `orden` de los dos vecinos; el resto no se toca.
  const { data: filas } = await db
    .from("materiales").select("id, orden").eq("tenant_id", tenant.id).in("id", [ids[i], ids[j]]);
  const oi = filas?.find((f) => f.id === ids[i])?.orden;
  const oj = filas?.find((f) => f.id === ids[j])?.orden;
  if (oi === undefined || oj === undefined) return { ok: false, error: ERR };
  const orden = oi === oj ? [j, i] : [oj, oi];
  const res = await Promise.all([
    db.from("materiales").update({ orden: orden[0] }).eq("tenant_id", tenant.id).eq("id", ids[i]),
    db.from("materiales").update({ orden: orden[1] }).eq("tenant_id", tenant.id).eq("id", ids[j]),
  ]);
  return res.some((r) => r.error) ? { ok: false, error: ERR } : { ok: true, data: undefined };
}

export async function eliminarMaterial(materialId: string): Promise<Resultado> {
  const { tenant, db } = await requireCreadorContext();
  const { error } = await db.from("materiales").delete().eq("tenant_id", tenant.id).eq("id", materialId);
  return error ? { ok: false, error: ERR } : { ok: true, data: undefined };
}
