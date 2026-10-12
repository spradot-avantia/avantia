// Repo de cursos. Toda query filtra por tenant.id (ademas de RLS).
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireCreadorContext } from "./tenantActual";
import type {
  CampoCurso,
  Curso,
  CursoCompleto,
  CursoResumen,
  Leccion,
  ModoCreacionCurso,
  Modulo,
  PasoEditor,
  Resultado,
} from "./types";
import { slugify, validarCampoCurso, validarFechas } from "./validacion";

export function mapCurso(r: any): Curso {
  return {
    id: r.id,
    slug: r.slug,
    titulo: r.titulo,
    descripcion: r.descripcion,
    publico: r.publico,
    estado: r.estado,
    modalidad: r.modalidad,
    fechaInicio: r.fecha_inicio,
    fechaTermino: r.fecha_termino,
    acceso: r.acceso,
    publishedAt: r.published_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function mapLeccion(r: any): Leccion {
  return {
    id: r.id,
    moduloId: r.modulo_id,
    cursoId: r.curso_id,
    titulo: r.titulo,
    tipo: r.tipo,
    contenidoUrl: r.contenido_url,
    contenidoTexto: r.contenido_texto,
    storagePath: r.storage_path,
    contenidoTipo: r.contenido_tipo,
    orden: r.orden,
  };
}

const COLS_CURSO =
  "id, slug, titulo, descripcion, publico, estado, modalidad, fecha_inicio, fecha_termino, acceso, published_at, created_at, updated_at";

export async function listarCursos(): Promise<CursoResumen[]> {
  const { tenant, db } = await requireCreadorContext();
  const { data: cursos } = await db
    .from("cursos")
    .select(COLS_CURSO)
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });
  if (!cursos?.length) return [];

  const [mods, lecs, invs] = await Promise.all([
    db.from("modulos").select("curso_id").eq("tenant_id", tenant.id),
    db.from("lecciones").select("curso_id").eq("tenant_id", tenant.id),
    db.from("invitaciones").select("curso_id").eq("tenant_id", tenant.id).neq("estado", "revocada"),
  ]);
  const contar = (filas: { curso_id: string }[] | null) => {
    const m = new Map<string, number>();
    for (const f of filas ?? []) m.set(f.curso_id, (m.get(f.curso_id) ?? 0) + 1);
    return m;
  };
  const cm = contar(mods.data);
  const cl = contar(lecs.data);
  const ci = contar(invs.data);
  return cursos.map((c) => ({
    ...mapCurso(c),
    totalModulos: cm.get(c.id) ?? 0,
    totalLecciones: cl.get(c.id) ?? 0,
    totalEstudiantes: ci.get(c.id) ?? 0,
  }));
}

export async function getCurso(cursoId: string): Promise<CursoCompleto | null> {
  const { tenant, db } = await requireCreadorContext();
  const { data: c } = await db.from("cursos").select(COLS_CURSO).eq("tenant_id", tenant.id).eq("id", cursoId).maybeSingle();
  if (!c) return null;
  const [obj, mods, lecs] = await Promise.all([
    db.from("curso_objetivos").select("texto, orden").eq("tenant_id", tenant.id).eq("curso_id", cursoId).order("orden"),
    db.from("modulos").select("id, curso_id, titulo, orden").eq("tenant_id", tenant.id).eq("curso_id", cursoId).order("orden"),
    db
      .from("lecciones")
      .select("id, modulo_id, curso_id, titulo, tipo, contenido_url, contenido_texto, storage_path, contenido_tipo, orden")
      .eq("tenant_id", tenant.id)
      .eq("curso_id", cursoId)
      .order("orden"),
  ]);
  const lecciones = (lecs.data ?? []).map(mapLeccion);
  const modulos: Modulo[] = (mods.data ?? []).map((m) => ({
    id: m.id,
    cursoId: m.curso_id,
    titulo: m.titulo,
    orden: m.orden,
    lecciones: lecciones.filter((l) => l.moduloId === m.id),
  }));
  return { ...mapCurso(c), objetivos: (obj.data ?? []).map((o) => o.texto), modulos };
}

const ESTRUCTURA_SUGERIDA = ["Contexto", "Casos reales", "Aplicación"];

async function slugLibre(db: SupabaseClient, tenantId: string, base: string): Promise<string> {
  const { data } = await db.from("cursos").select("slug").eq("tenant_id", tenantId).like("slug", `${base}%`);
  const usados = new Set((data ?? []).map((r) => r.slug as string));
  if (!usados.has(base)) return base;
  for (let n = 2; n < 1000; n++) if (!usados.has(`${base}-${n}`)) return `${base}-${n}`;
  return `${base}-${Date.now()}`;
}

/** Crea un curso en borrador. 'estructura_sugerida' agrega 3 modulos vacios. */
export async function crearCurso(input: { titulo?: string; modo: ModoCreacionCurso }): Promise<Resultado<{ id: string }>> {
  const { tenant, db } = await requireCreadorContext();
  const titulo = input.titulo?.trim() || "Curso sin título";
  if (input.titulo?.trim()) {
    const v = validarCampoCurso("titulo", input.titulo);
    if (!v.ok) return { ok: false, error: v.error, campos: { titulo: v.error } };
  }
  const slug = await slugLibre(db, tenant.id, slugify(titulo));
  const { data, error } = await db
    .from("cursos")
    .insert({ tenant_id: tenant.id, slug, titulo, estado: "borrador" })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "No pudimos crear el curso. Inténtalo de nuevo." };

  if (input.modo === "estructura_sugerida") {
    const { error: e2 } = await db.from("modulos").insert(
      ESTRUCTURA_SUGERIDA.map((t, i) => ({ tenant_id: tenant.id, curso_id: data.id, titulo: t, orden: i })),
    );
    if (e2) return { ok: false, error: "El curso se creó, pero no pudimos agregar la estructura sugerida." };
  }
  return { ok: true, data: { id: data.id } };
}

/**
 * Guarda UN campo del curso (autoguardado). Valida con zod; si es invalido no
 * escribe y devuelve el error para mostrarlo junto al campo.
 */
export async function updateCursoCampo(cursoId: string, campo: CampoCurso, valor: unknown): Promise<Resultado> {
  const { tenant, db } = await requireCreadorContext();
  const v = validarCampoCurso(campo, valor);
  if (!v.ok) return { ok: false, error: v.error, campos: { [campo]: v.error } };

  if (campo === "objetivos") {
    const textos = v.valor as string[];
    const del = await db.from("curso_objetivos").delete().eq("tenant_id", tenant.id).eq("curso_id", cursoId);
    if (del.error) return { ok: false, error: "No pudimos guardar los objetivos." };
    const ins = await db
      .from("curso_objetivos")
      .insert(textos.map((texto, i) => ({ tenant_id: tenant.id, curso_id: cursoId, orden: i + 1, texto })));
    if (ins.error) return { ok: false, error: "No pudimos guardar los objetivos." };
    return { ok: true, data: undefined };
  }

  const columnas: Record<string, string> = {
    titulo: "titulo",
    descripcion: "descripcion",
    publico: "publico",
    modalidad: "modalidad",
    acceso: "acceso",
    fechaInicio: "fecha_inicio",
    fechaTermino: "fecha_termino",
  };
  const patch: Record<string, unknown> = { [columnas[campo]]: v.valor };
  if (campo === "modalidad" && v.valor === "a_su_ritmo") {
    patch.fecha_inicio = null;
    patch.fecha_termino = null;
  }
  if (campo === "publico" && v.valor === "") patch.publico = null;

  if (campo === "fechaInicio" || campo === "fechaTermino") {
    const actual = await db.from("cursos").select("fecha_inicio, fecha_termino").eq("tenant_id", tenant.id).eq("id", cursoId).maybeSingle();
    const ini = campo === "fechaInicio" ? (v.valor as string | null) : (actual.data?.fecha_inicio ?? null);
    const ter = campo === "fechaTermino" ? (v.valor as string | null) : (actual.data?.fecha_termino ?? null);
    if (ini && ter && Date.parse(ter) < Date.parse(ini)) {
      const e = validarFechas(ini, ter) ?? "Fechas inválidas.";
      return { ok: false, error: e, campos: { [campo]: e } };
    }
  }

  const { error } = await db.from("cursos").update(patch).eq("tenant_id", tenant.id).eq("id", cursoId);
  if (error) return { ok: false, error: "No pudimos guardar el cambio. Inténtalo de nuevo." };
  return { ok: true, data: undefined };
}

const CAMPOS_POR_PASO: Partial<Record<PasoEditor, CampoCurso[]>> = {
  esencial: ["titulo", "descripcion", "publico"],
  objetivo: ["objetivos"],
  modalidad: ["modalidad", "fechaInicio", "fechaTermino"],
  acceso: ["acceso"],
};

/** Guarda varios campos de un paso, uno por uno; devuelve errores por campo. */
export async function updatePaso(cursoId: string, paso: PasoEditor, datos: Partial<Record<CampoCurso, unknown>>): Promise<Resultado> {
  const permitidos = CAMPOS_POR_PASO[paso] ?? [];
  const campos: Record<string, string> = {};
  for (const campo of permitidos) {
    if (!(campo in datos)) continue;
    const r = await updateCursoCampo(cursoId, campo, datos[campo]);
    if (!r.ok) campos[campo] = r.error;
  }
  if (Object.keys(campos).length) return { ok: false, error: Object.values(campos)[0], campos };
  return { ok: true, data: undefined };
}

export async function eliminarCurso(cursoId: string): Promise<Resultado> {
  const { tenant, db } = await requireCreadorContext();
  const { error } = await db.from("cursos").delete().eq("tenant_id", tenant.id).eq("id", cursoId);
  return error ? { ok: false, error: "No pudimos eliminar el curso." } : { ok: true, data: undefined };
}
