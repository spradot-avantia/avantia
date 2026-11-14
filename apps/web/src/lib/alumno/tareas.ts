// Tareas, entregas y clases en vivo, lado alumno (ADR 038 y 039). Service role con
// .eq("tenant_id", tenantId) en cada query, como el resto de lib/alumno (ADR 018). El tenant sale
// del host y el alumno de su sesión: nada de lo que manda el cliente decide de quién es una entrega.
import { randomUUID } from "node:crypto";
import { cabeEnCuota, nombreVisible } from "../creador/archivosReglas";
import { bytesUsados } from "../creador/archivos";
import type { Resultado } from "../creador/types";
import { supabaseAdmin } from "../supabase/admin";
import {
  COMENTARIO_ALUMNO_MAX,
  RUTA_ENTREGA,
  puedeEntregar,
  validarArchivoEntrega,
} from "../tareas/reglas";
import { cargarCurso } from "./catalogo";
import { getTenantPublico } from "./contexto";
import { inscripcionDe } from "./inscripciones";
import { leccionLiberada, hoyEnZona } from "./liberacion";
import { getAlumnoActual } from "./sesion";

const BUCKET = "entregas";
const ERR = "No pudimos guardar tu entrega. Inténtalo de nuevo.";

export interface TareaAlumno {
  id: string;
  titulo: string;
  instrucciones: string;
  puntajeMaximo: number;
  fechaLimite: string | null;
  permiteReenvio: boolean;
}

export interface EntregaAlumno {
  id: string;
  numero: number;
  archivoNombre: string;
  comentario: string;
  enviadaAt: string;
  atrasada: boolean;
  /** Solo si el creador ya la publicó. */
  revision: { puntaje: number; comentario: string } | null;
}

const COLS_TAREA = "id, titulo, instrucciones, puntaje_maximo, fecha_limite, permite_reenvio";

function mapTarea(r: any): TareaAlumno {
  return {
    id: r.id,
    titulo: r.titulo,
    instrucciones: r.instrucciones ?? "",
    puntajeMaximo: Number(r.puntaje_maximo),
    fechaLimite: r.fecha_limite ?? null,
    permiteReenvio: !!r.permite_reenvio,
  };
}

/** Tarea de una lección. Solo para páginas que ya comprobaron sesión, inscripción y liberación. */
export async function tareaDeLeccion(tenantId: string, cursoId: string, leccionId: string): Promise<TareaAlumno | null> {
  const { data } = await supabaseAdmin
    .from("tareas")
    .select(COLS_TAREA)
    .eq("tenant_id", tenantId)
    .eq("curso_id", cursoId)
    .eq("leccion_id", leccionId)
    .maybeSingle();
  return data ? mapTarea(data) : null;
}

/** Entregas del alumno en una tarea (de la más reciente a la más antigua), con la revisión solo si está publicada. */
export async function entregasDelAlumno(tenantId: string, alumnoId: string, tarea: TareaAlumno): Promise<EntregaAlumno[]> {
  const { data: ents } = await supabaseAdmin
    .from("entregas")
    .select("id, numero, archivo_nombre, comentario_alumno, enviada_at")
    .eq("tenant_id", tenantId)
    .eq("tarea_id", tarea.id)
    .eq("alumno_id", alumnoId)
    .order("numero", { ascending: false });
  const lista = ents ?? [];
  if (lista.length === 0) return [];
  const { data: revs } = await supabaseAdmin
    .from("revisiones")
    .select("entrega_id, puntaje, comentario")
    .eq("tenant_id", tenantId)
    .not("publicada_at", "is", null)
    .in("entrega_id", lista.map((e) => e.id));
  const porEntrega = new Map((revs ?? []).map((r) => [r.entrega_id as string, r]));
  return lista.map((e) => {
    const r = porEntrega.get(e.id);
    return {
      id: e.id,
      numero: e.numero,
      archivoNombre: e.archivo_nombre,
      comentario: e.comentario_alumno ?? "",
      enviadaAt: e.enviada_at,
      atrasada: !!tarea.fechaLimite && new Date(e.enviada_at) > new Date(tarea.fechaLimite),
      revision: r ? { puntaje: Number(r.puntaje), comentario: r.comentario ?? "" } : null,
    };
  });
}

// ---- Guardia de las acciones ----------------------------------------------------------------
type Guardia =
  | { ok: true; tenantId: string; alumnoId: string; tarea: TareaAlumno; cursoId: string }
  | { ok: false; error: string };

/** Sesión + inscripción ACTIVA + lección liberada, para la tarea indicada. */
async function guardiaDeTarea(tareaId: string): Promise<Guardia> {
  const tenant = await getTenantPublico();
  const alumno = await getAlumnoActual();
  if (!tenant || !alumno) return { ok: false, error: "Inicia sesión para entregar tu tarea." };
  const { data } = await supabaseAdmin
    .from("tareas")
    .select(`${COLS_TAREA}, curso_id, leccion_id`)
    .eq("tenant_id", tenant.id)
    .eq("id", tareaId)
    .maybeSingle();
  if (!data) return { ok: false, error: "Tarea no encontrada." };
  const insc = await inscripcionDe(tenant.id, alumno.id, data.curso_id);
  if (!insc || insc.estado !== "activa") return { ok: false, error: "Tu inscripción en este curso no está activa." };
  const curso = await cargarCurso(tenant.id, { id: data.curso_id });
  if (!curso || !leccionLiberada(curso, curso.diaLiberacion.get(data.leccion_id) ?? null, hoyEnZona())) {
    return { ok: false, error: "Esta lección aún no está disponible." };
  }
  return { ok: true, tenantId: tenant.id, alumnoId: alumno.id, tarea: mapTarea(data), cursoId: data.curso_id };
}

async function contarPrevias(tenantId: string, alumnoId: string, tareaId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from("entregas")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("tarea_id", tareaId)
    .eq("alumno_id", alumnoId);
  return count ?? 0;
}

// ---- Paso 1: validar y emitir la URL firmada de subida ----------------------------------------
export async function prepararEntrega(
  tareaId: string,
  archivo: { nombre: string; bytes: number },
): Promise<Resultado<{ ruta: string; token: string; mime: string }>> {
  const g = await guardiaDeTarea(tareaId);
  if (!g.ok) return g;
  const permiso = puedeEntregar(g.tarea, await contarPrevias(g.tenantId, g.alumnoId, tareaId));
  if (!permiso.ok) return permiso;
  const v = validarArchivoEntrega(archivo.nombre, archivo.bytes);
  if (!v.ok) return v;
  const cuota = cabeEnCuota(await bytesUsados(supabaseAdmin, g.tenantId), archivo.bytes);
  // El alumno no ve los números de la academia: mensaje genérico.
  if (!cuota.ok) return { ok: false, error: "Tu profesor no tiene espacio disponible para recibir archivos ahora. Avísale." };

  const ruta = `${g.tenantId}/${tareaId}/${g.alumnoId}/${randomUUID()}.${v.ext}`;
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(ruta);
  if (error || !data) return { ok: false, error: ERR };
  return { ok: true, data: { ruta, token: data.token, mime: v.mime } };
}

// ---- Paso 3: verificar el objeto y registrar la entrega ---------------------------------------
export async function confirmarEntrega(
  tareaId: string,
  ruta: string,
  nombreOriginal: string,
  comentario: string,
): Promise<Resultado<{ numero: number }>> {
  const g = await guardiaDeTarea(tareaId);
  if (!g.ok) return g;

  // La ruta debe ser de ESTE tenant, ESTA tarea y ESTE alumno: nunca se confía en el cliente.
  const m = RUTA_ENTREGA.exec(ruta);
  if (!m || m[1] !== g.tenantId || m[2] !== tareaId || m[3] !== g.alumnoId) return { ok: false, error: "Archivo no válido." };
  const comentarioLimpio = comentario.trim().slice(0, COMENTARIO_ALUMNO_MAX);

  const descartar = async (error: string) => {
    await supabaseAdmin.storage.from(BUCKET).remove([ruta]);
    return { ok: false as const, error };
  };

  const carpeta = `${m[1]}/${m[2]}/${m[3]}`;
  const nombreEnBucket = `${m[4]}.${m[5]}`;
  const { data: lista } = await supabaseAdmin.storage.from(BUCKET).list(carpeta, { search: nombreEnBucket, limit: 5 });
  const obj = lista?.find((o) => o.name === nombreEnBucket);
  const bytes = Number((obj?.metadata as { size?: number } | undefined)?.size ?? 0);
  if (!obj || !bytes) return { ok: false, error: "No encontramos el archivo subido. Inténtalo de nuevo." };

  const v = validarArchivoEntrega(`x.${m[5]}`, bytes);
  if (!v.ok) return descartar(v.error);
  // El objeto ya está subido y cuenta en el bucket, pero no en `entregas` hasta insertarla.
  if (!cabeEnCuota(await bytesUsados(supabaseAdmin, g.tenantId), bytes).ok) {
    return descartar("Tu profesor no tiene espacio disponible para recibir archivos ahora. Avísale.");
  }
  const permiso = puedeEntregar(g.tarea, await contarPrevias(g.tenantId, g.alumnoId, tareaId));
  if (!permiso.ok) return descartar(permiso.error);

  const { error } = await supabaseAdmin.from("entregas").insert({
    tenant_id: g.tenantId,
    tarea_id: tareaId,
    alumno_id: g.alumnoId,
    numero: permiso.numero,
    storage_path: ruta,
    archivo_nombre: nombreVisible(nombreOriginal),
    mime: v.mime,
    bytes,
    comentario_alumno: comentarioLimpio || null,
  });
  if (error) return descartar(ERR);
  return { ok: true, data: { numero: permiso.numero } };
}

/** URL firmada de 60 s de una entrega PROPIA del alumno. Null si no es suya o de esta academia. */
export async function urlDeMiEntrega(tenantId: string, alumnoId: string, entregaId: string): Promise<string | null> {
  const { data: e } = await supabaseAdmin
    .from("entregas")
    .select("storage_path, archivo_nombre")
    .eq("tenant_id", tenantId)
    .eq("alumno_id", alumnoId)
    .eq("id", entregaId)
    .maybeSingle();
  if (!e) return null;
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(e.storage_path, 60, { download: e.archivo_nombre });
  return error || !data ? null : data.signedUrl;
}

// ---- Clases en vivo ---------------------------------------------------------------------------
export interface ClaseAlumno {
  id: string;
  titulo: string;
  descripcion: string;
  iniciaAt: string;
  duracionMin: number;
  enlaceMeet: string | null;
  grabacionUrl: string | null;
  resumen: string;
}

/** Clases del curso. Solo para páginas con guardia de inscripción activa. */
export async function clasesDeCurso(tenantId: string, cursoId: string): Promise<ClaseAlumno[]> {
  const { data } = await supabaseAdmin
    .from("clases_en_vivo")
    .select("id, titulo, descripcion, inicia_at, duracion_min, enlace_meet, grabacion_url, resumen")
    .eq("tenant_id", tenantId)
    .eq("curso_id", cursoId)
    .order("inicia_at", { ascending: false })
    .limit(100);
  return (data ?? []).map((c) => ({
    id: c.id,
    titulo: c.titulo,
    descripcion: c.descripcion ?? "",
    iniciaAt: c.inicia_at,
    duracionMin: c.duracion_min,
    enlaceMeet: c.enlace_meet ?? null,
    grabacionUrl: c.grabacion_url ?? null,
    resumen: c.resumen ?? "",
  }));
}
