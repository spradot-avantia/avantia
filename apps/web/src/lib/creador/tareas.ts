// Tareas con entrega y revisión, lado creador (ADR 038). Todo pasa por el cliente con la sesión
// del creador (RLS por tenant) y filtra además por tenant.id, que sale de la sesión.
// Una sola excepción: los objetos del bucket `entregas` los lee y borra el servidor con el
// cliente admin, siempre después de comprobar con RLS que la fila es de la academia.
import { supabaseAdmin } from "../supabase/admin";
import {
  validarRevision,
  validarTarea,
  utcALocal,
  type EntradaTarea,
} from "../tareas/reglas";
import { requireCreadorContext } from "./tenantActual";
import type { Resultado } from "./types";

const BUCKET = "entregas";
const ERR = "No pudimos guardar el cambio. Inténtalo de nuevo.";
const COLS_TAREA = "id, leccion_id, curso_id, titulo, instrucciones, puntaje_maximo, fecha_limite, permite_reenvio";

export interface TareaCreador {
  id: string;
  leccionId: string;
  cursoId: string;
  titulo: string;
  instrucciones: string;
  puntajeMaximo: number;
  /** `YYYY-MM-DDTHH:mm` en hora de la academia (para el input), o "". */
  fechaLimite: string;
  permiteReenvio: boolean;
  totalEntregas: number;
}

function mapTarea(r: any, totalEntregas = 0): TareaCreador {
  return {
    id: r.id,
    leccionId: r.leccion_id,
    cursoId: r.curso_id,
    titulo: r.titulo,
    instrucciones: r.instrucciones ?? "",
    puntajeMaximo: Number(r.puntaje_maximo),
    fechaLimite: r.fecha_limite ? utcALocal(r.fecha_limite) : "",
    permiteReenvio: !!r.permite_reenvio,
    totalEntregas,
  };
}

export async function tareaDeLeccion(leccionId: string): Promise<Resultado<TareaCreador | null>> {
  const { tenant, db } = await requireCreadorContext();
  const { data } = await db.from("tareas").select(COLS_TAREA).eq("tenant_id", tenant.id).eq("leccion_id", leccionId).maybeSingle();
  if (!data) return { ok: true, data: null };
  const { count } = await db.from("entregas").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id).eq("tarea_id", data.id);
  return { ok: true, data: mapTarea(data, count ?? 0) };
}

/** Crea la tarea de la lección o actualiza la que ya tiene (una tarea por lección). */
export async function guardarTarea(leccionId: string, entrada: EntradaTarea): Promise<Resultado<TareaCreador>> {
  const v = validarTarea(entrada);
  if (!v.ok) return { ok: false, error: v.error, campos: v.campos };
  const { tenant, db } = await requireCreadorContext();
  const { data: lec } = await db.from("lecciones").select("id, curso_id").eq("tenant_id", tenant.id).eq("id", leccionId).maybeSingle();
  if (!lec) return { ok: false, error: "Lección no encontrada." };

  const fila = {
    titulo: v.data.titulo,
    instrucciones: v.data.instrucciones,
    puntaje_maximo: v.data.puntajeMaximo,
    fecha_limite: v.data.fechaLimite,
    permite_reenvio: v.data.permiteReenvio,
  };
  const { data: previa } = await db.from("tareas").select("id").eq("tenant_id", tenant.id).eq("leccion_id", leccionId).maybeSingle();
  const q = previa
    ? db.from("tareas").update(fila).eq("tenant_id", tenant.id).eq("id", previa.id)
    : db.from("tareas").insert({ ...fila, tenant_id: tenant.id, curso_id: lec.curso_id, leccion_id: leccionId });
  const { data, error } = await q.select(COLS_TAREA).single();
  if (error || !data) {
    // Bajar el puntaje máximo por debajo de una revisión ya hecha rompería la coherencia.
    return { ok: false, error: ERR };
  }
  const { count } = await db.from("entregas").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id).eq("tarea_id", data.id);
  return { ok: true, data: mapTarea(data, count ?? 0) };
}

/** Borra la tarea y, con ella, sus entregas y los archivos del bucket. */
export async function eliminarTarea(tareaId: string): Promise<Resultado> {
  const { tenant, db } = await requireCreadorContext();
  const { data: ents } = await db.from("entregas").select("storage_path").eq("tenant_id", tenant.id).eq("tarea_id", tareaId);
  const rutas = (ents ?? []).map((e) => e.storage_path as string);
  const { error } = await db.from("tareas").delete().eq("tenant_id", tenant.id).eq("id", tareaId);
  if (error) return { ok: false, error: "No pudimos quitar la tarea. Inténtalo de nuevo." };
  if (rutas.length) {
    const { error: e2 } = await supabaseAdmin.storage.from(BUCKET).remove(rutas);
    if (e2) console.error("[creador/tareas] no se pudieron quitar archivos de entregas", rutas.length, e2.message);
  }
  return { ok: true, data: undefined };
}

// ---- Cola de revisión -----------------------------------------------------------------------
export type EstadoRevision = "por_revisar" | "borrador" | "publicada";

export interface FilaRevision {
  entregaId: string;
  tareaId: string;
  tareaTitulo: string;
  cursoId: string;
  cursoTitulo: string;
  alumnoNombre: string;
  alumnoCorreo: string;
  numero: number;
  enviadaAt: string;
  atrasada: boolean;
  estado: EstadoRevision;
  puntaje: number | null;
  puntajeMaximo: number;
}

/** Última entrega de cada alumno en cada tarea, con el estado de su revisión. */
export async function listarRevisiones(): Promise<FilaRevision[]> {
  const { tenant, db } = await requireCreadorContext();
  const { data: ents } = await db
    .from("entregas")
    .select("id, tarea_id, alumno_id, numero, enviada_at")
    .eq("tenant_id", tenant.id)
    .order("enviada_at", { ascending: false })
    .limit(500);
  const todas = ents ?? [];
  if (todas.length === 0) return [];

  const ultimas = new Map<string, (typeof todas)[number]>();
  for (const e of todas) {
    const k = `${e.tarea_id}:${e.alumno_id}`;
    if (!ultimas.has(k)) ultimas.set(k, e); // vienen de la más nueva a la más antigua
  }
  const lista = [...ultimas.values()];
  const tareaIds = [...new Set(lista.map((e) => e.tarea_id))];
  const alumnoIds = [...new Set(lista.map((e) => e.alumno_id))];

  const [tareas, alumnos, revs] = await Promise.all([
    db.from("tareas").select("id, titulo, curso_id, puntaje_maximo, fecha_limite").eq("tenant_id", tenant.id).in("id", tareaIds),
    db.from("alumnos").select("id, nombre, correo").eq("tenant_id", tenant.id).in("id", alumnoIds),
    db.from("revisiones").select("entrega_id, puntaje, publicada_at").eq("tenant_id", tenant.id).in("entrega_id", lista.map((e) => e.id)),
  ]);
  const cursoIds = [...new Set((tareas.data ?? []).map((t) => t.curso_id as string))];
  const cursos = await db.from("cursos").select("id, titulo").eq("tenant_id", tenant.id).in("id", cursoIds);

  const tPorId = new Map((tareas.data ?? []).map((t) => [t.id as string, t]));
  const aPorId = new Map((alumnos.data ?? []).map((a) => [a.id as string, a]));
  const rPorEntrega = new Map((revs.data ?? []).map((r) => [r.entrega_id as string, r]));
  const cPorId = new Map((cursos.data ?? []).map((c) => [c.id as string, c.titulo as string]));

  const filas: FilaRevision[] = [];
  for (const e of lista) {
    const t = tPorId.get(e.tarea_id);
    const a = aPorId.get(e.alumno_id);
    if (!t || !a) continue;
    const r = rPorEntrega.get(e.id);
    filas.push({
      entregaId: e.id,
      tareaId: e.tarea_id,
      tareaTitulo: t.titulo,
      cursoId: t.curso_id,
      cursoTitulo: cPorId.get(t.curso_id) ?? "Curso",
      alumnoNombre: a.nombre,
      alumnoCorreo: a.correo,
      numero: e.numero,
      enviadaAt: e.enviada_at,
      atrasada: !!t.fecha_limite && new Date(e.enviada_at) > new Date(t.fecha_limite),
      estado: !r ? "por_revisar" : r.publicada_at ? "publicada" : "borrador",
      puntaje: r ? Number(r.puntaje) : null,
      puntajeMaximo: Number(t.puntaje_maximo),
    });
  }
  // Primero lo que falta revisar (la más antigua arriba), luego borradores y publicadas.
  const peso: Record<EstadoRevision, number> = { por_revisar: 0, borrador: 1, publicada: 2 };
  return filas.sort((x, y) => peso[x.estado] - peso[y.estado] || (x.estado === "por_revisar" ? x.enviadaAt.localeCompare(y.enviadaAt) : y.enviadaAt.localeCompare(x.enviadaAt)));
}

export interface DetalleRevision {
  entrega: { id: string; numero: number; archivoNombre: string; bytes: number; comentarioAlumno: string; enviadaAt: string; atrasada: boolean };
  historial: Array<{ id: string; numero: number; enviadaAt: string; puntaje: number | null }>;
  tarea: { id: string; titulo: string; instrucciones: string; puntajeMaximo: number; cursoId: string; cursoTitulo: string };
  alumno: { nombre: string; correo: string };
  revision: { puntaje: number; comentario: string; publicada: boolean } | null;
}

export async function detalleDeRevision(entregaId: string): Promise<DetalleRevision | null> {
  const { tenant, db } = await requireCreadorContext();
  const { data: e } = await db
    .from("entregas")
    .select("id, tarea_id, alumno_id, numero, archivo_nombre, bytes, comentario_alumno, enviada_at")
    .eq("tenant_id", tenant.id)
    .eq("id", entregaId)
    .maybeSingle();
  if (!e) return null;
  const [t, a, rev, todas] = await Promise.all([
    db.from("tareas").select("id, titulo, instrucciones, puntaje_maximo, curso_id, fecha_limite").eq("tenant_id", tenant.id).eq("id", e.tarea_id).maybeSingle(),
    db.from("alumnos").select("nombre, correo").eq("tenant_id", tenant.id).eq("id", e.alumno_id).maybeSingle(),
    db.from("revisiones").select("puntaje, comentario, publicada_at").eq("tenant_id", tenant.id).eq("entrega_id", e.id).maybeSingle(),
    db.from("entregas").select("id, numero, enviada_at").eq("tenant_id", tenant.id).eq("tarea_id", e.tarea_id).eq("alumno_id", e.alumno_id).order("numero"),
  ]);
  if (!t.data || !a.data) return null;
  const { data: curso } = await db.from("cursos").select("titulo").eq("tenant_id", tenant.id).eq("id", t.data.curso_id).maybeSingle();
  const ids = (todas.data ?? []).map((x) => x.id as string);
  const { data: revs } = await db.from("revisiones").select("entrega_id, puntaje").eq("tenant_id", tenant.id).in("entrega_id", ids);
  const pPorEntrega = new Map((revs ?? []).map((r) => [r.entrega_id as string, Number(r.puntaje)]));
  return {
    entrega: {
      id: e.id,
      numero: e.numero,
      archivoNombre: e.archivo_nombre,
      bytes: e.bytes,
      comentarioAlumno: e.comentario_alumno ?? "",
      enviadaAt: e.enviada_at,
      atrasada: !!t.data.fecha_limite && new Date(e.enviada_at) > new Date(t.data.fecha_limite),
    },
    historial: (todas.data ?? []).map((x) => ({ id: x.id, numero: x.numero, enviadaAt: x.enviada_at, puntaje: pPorEntrega.get(x.id) ?? null })),
    tarea: {
      id: t.data.id,
      titulo: t.data.titulo,
      instrucciones: t.data.instrucciones ?? "",
      puntajeMaximo: Number(t.data.puntaje_maximo),
      cursoId: t.data.curso_id,
      cursoTitulo: curso?.titulo ?? "Curso",
    },
    alumno: { nombre: a.data.nombre, correo: a.data.correo },
    revision: rev.data ? { puntaje: Number(rev.data.puntaje), comentario: rev.data.comentario ?? "", publicada: !!rev.data.publicada_at } : null,
  };
}

/**
 * Guarda la revisión. `publicar` la hace visible al alumno; guardar sin publicar deja borrador
 * (o conserva la publicación si ya estaba publicada: corregir no la oculta).
 */
export async function guardarRevision(
  entregaId: string,
  entrada: { puntaje: string; comentario: string },
  publicar: boolean,
): Promise<Resultado<{ publicada: boolean }>> {
  const { tenant, db } = await requireCreadorContext();
  const { data: e } = await db.from("entregas").select("id, tarea_id").eq("tenant_id", tenant.id).eq("id", entregaId).maybeSingle();
  if (!e) return { ok: false, error: "Entrega no encontrada." };
  const { data: t } = await db.from("tareas").select("puntaje_maximo").eq("tenant_id", tenant.id).eq("id", e.tarea_id).maybeSingle();
  if (!t) return { ok: false, error: "Tarea no encontrada." };

  const v = validarRevision({ ...entrada, puntajeMaximo: Number(t.puntaje_maximo) });
  if (!v.ok) return { ok: false, error: v.error, campos: v.campos };

  const { data: previa } = await db.from("revisiones").select("id, publicada_at").eq("tenant_id", tenant.id).eq("entrega_id", entregaId).maybeSingle();
  const ahora = new Date().toISOString();
  const publicada_at = publicar ? (previa?.publicada_at ?? ahora) : (previa?.publicada_at ?? null);
  const fila = { puntaje: v.data.puntaje, comentario: v.data.comentario, revisada_at: ahora, publicada_at };
  const q = previa
    ? db.from("revisiones").update(fila).eq("tenant_id", tenant.id).eq("id", previa.id)
    : db.from("revisiones").insert({ ...fila, tenant_id: tenant.id, entrega_id: entregaId });
  const { error } = await q;
  if (error) return { ok: false, error: ERR };
  return { ok: true, data: { publicada: !!publicada_at } };
}

/** URL firmada de 60 s para que el creador abra la entrega de un alumno de SU academia. */
export async function urlDeEntrega(entregaId: string): Promise<string | null> {
  const { tenant, db } = await requireCreadorContext();
  const { data: e } = await db.from("entregas").select("storage_path, archivo_nombre").eq("tenant_id", tenant.id).eq("id", entregaId).maybeSingle();
  if (!e) return null;
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(e.storage_path, 60, { download: e.archivo_nombre });
  return error || !data ? null : data.signedUrl;
}

/** Entregas por revisar (para el aviso del menú o del inicio). */
export async function contarPorRevisar(): Promise<number> {
  return (await listarRevisiones()).filter((f) => f.estado === "por_revisar").length;
}
