// Progreso del alumno: lecciones completadas, resumen por curso y XP derivada.
import { supabaseAdmin } from "../supabase/admin";
import { cargarCurso, leccionesEnOrden, type CursoParaAlumno } from "./catalogo";
import { registrarEvento } from "./eventos";
import { inscripcionDe } from "./inscripciones";
import { hoyEnZona, leccionLiberada } from "./liberacion";
import { calcularDominio, type Dominio } from "./dominioReglas";
import { estadoQuizzes, xpDeQuiz } from "./quiz";
import { enRepasoPorCurso } from "./repaso";
import { calcularXp, porcentaje, type DesgloseXp } from "./xp";

export async function leccionesCompletadas(tenantId: string, alumnoId: string, cursoId: string): Promise<Set<string>> {
  const { data } = await supabaseAdmin
    .from("progreso")
    .select("leccion_id")
    .eq("tenant_id", tenantId)
    .eq("alumno_id", alumnoId)
    .eq("curso_id", cursoId)
    .not("completada_at", "is", null);
  return new Set((data ?? []).map((r) => r.leccion_id as string));
}

/** Última lección abierta (para "continuar donde quedó"). */
export async function ultimaLeccionAbierta(tenantId: string, alumnoId: string, cursoId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("progreso")
    .select("leccion_id")
    .eq("tenant_id", tenantId)
    .eq("alumno_id", alumnoId)
    .eq("curso_id", cursoId)
    .order("ultimo_acceso_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.leccion_id ?? null;
}

/** Anota que abrió la lección sin pisar una completada previa. */
export async function marcarAcceso(tenantId: string, alumnoId: string, cursoId: string, leccionId: string): Promise<void> {
  const ahora = new Date().toISOString();
  const { data: existe } = await supabaseAdmin
    .from("progreso")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("alumno_id", alumnoId)
    .eq("leccion_id", leccionId)
    .maybeSingle();
  if (existe) {
    await supabaseAdmin.from("progreso").update({ ultimo_acceso_at: ahora }).eq("tenant_id", tenantId).eq("id", existe.id);
  } else {
    await supabaseAdmin
      .from("progreso")
      .insert({ tenant_id: tenantId, curso_id: cursoId, leccion_id: leccionId, alumno_id: alumnoId, ultimo_acceso_at: ahora });
  }
}

export type ResultadoCompletar =
  | { ok: true; siguienteId: string | null; cursoCompleto: boolean; xpGanada: number }
  | { ok: false; error: string };

/**
 * Marca la lección como completada. Valida en el servidor: inscripción ACTIVA,
 * curso publicado, lección del curso y ya liberada. Idempotente.
 */
export async function completarLeccion(
  tenantId: string,
  alumnoId: string,
  cursoId: string,
  leccionId: string,
): Promise<ResultadoCompletar> {
  const insc = await inscripcionDe(tenantId, alumnoId, cursoId);
  if (!insc || insc.estado !== "activa") return { ok: false, error: "Tu inscripción aún no está activa." };
  const curso = await cargarCurso(tenantId, { id: cursoId });
  if (!curso) return { ok: false, error: "Este curso no está disponible." };
  const orden = leccionesEnOrden(curso);
  const idx = orden.findIndex((l) => l.id === leccionId);
  if (idx < 0) return { ok: false, error: "No encontramos esa lección." };
  if (!leccionLiberada(curso, curso.diaLiberacion.get(leccionId) ?? null, hoyEnZona())) {
    return { ok: false, error: "Esta lección todavía no se libera." };
  }

  const antes = await leccionesCompletadas(tenantId, alumnoId, cursoId);
  const xpAntes = calcularXp(curso, antes).xp;
  const yaEstaba = antes.has(leccionId);
  if (!yaEstaba) {
    const ahora = new Date().toISOString();
    const { data: existe } = await supabaseAdmin
      .from("progreso")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("alumno_id", alumnoId)
      .eq("leccion_id", leccionId)
      .maybeSingle();
    const { error } = existe
      ? await supabaseAdmin.from("progreso").update({ completada_at: ahora, ultimo_acceso_at: ahora }).eq("tenant_id", tenantId).eq("id", existe.id)
      : await supabaseAdmin.from("progreso").insert({
          tenant_id: tenantId,
          curso_id: cursoId,
          leccion_id: leccionId,
          alumno_id: alumnoId,
          completada_at: ahora,
          ultimo_acceso_at: ahora,
        });
    if (error) return { ok: false, error: "No pudimos guardar tu avance. Inténtalo de nuevo." };
    await registrarEvento(tenantId, { tipo: "leccion_completada", alumnoId, cursoId, entidadTipo: "leccion", entidadId: leccionId });
  }

  const despues = new Set(antes).add(leccionId);
  const d = calcularXp(curso, despues);
  if (d.cursoCompleto && !yaEstaba) {
    await registrarEvento(tenantId, { tipo: "curso_completado", alumnoId, cursoId, entidadTipo: "curso", entidadId: cursoId });
  }
  // La siguiente lección sin completar, empezando por la que viene después de esta.
  const siguiente =
    [...orden.slice(idx + 1), ...orden.slice(0, idx)].find((l) => !despues.has(l.id)) ?? null;
  return { ok: true, siguienteId: siguiente?.id ?? null, cursoCompleto: d.cursoCompleto, xpGanada: d.xp - xpAntes };
}

export interface ResumenCursoAlumno {
  cursoId: string;
  slug: string;
  titulo: string;
  estadoInscripcion: "pendiente" | "activa" | "rechazada" | "vencida" | "cancelada";
  totalLecciones: number;
  completadas: number;
  avance: number;
  desglose: DesgloseXp;
  /** Lección a la que "Continuar" lleva. */
  continuarId: string | null;
  totalModulos: number;
  /** Lo que domina de los quizzes del curso (ADR 025); null sin quiz o sin respuestas. */
  dominio: Dominio | null;
}

/** Resumen de todos los cursos del alumno (Mis cursos y Mi progreso). */
export async function resumenDelAlumno(
  tenantId: string,
  alumnoId: string,
  inscripciones: { cursoId: string; estado: ResumenCursoAlumno["estadoInscripcion"] }[],
): Promise<ResumenCursoAlumno[]> {
  if (inscripciones.length === 0) return [];
  const ids = inscripciones.map((i) => i.cursoId);
  const [{ data: cursos }, { data: mods }, { data: lecs }, { data: prog }] = await Promise.all([
    supabaseAdmin.from("cursos").select("id, slug, titulo").eq("tenant_id", tenantId).eq("estado", "publicado").in("id", ids),
    supabaseAdmin.from("modulos").select("id, curso_id, orden").eq("tenant_id", tenantId).in("curso_id", ids).order("orden"),
    supabaseAdmin.from("lecciones").select("id, curso_id, modulo_id, orden").eq("tenant_id", tenantId).in("curso_id", ids).order("orden"),
    supabaseAdmin
      .from("progreso")
      .select("leccion_id, curso_id, completada_at, ultimo_acceso_at")
      .eq("tenant_id", tenantId)
      .eq("alumno_id", alumnoId)
      .in("curso_id", ids),
  ]);

  const enRepaso = inscripciones.some((i) => i.estado === "activa") ? await enRepasoPorCurso(tenantId, alumnoId) : new Map<string, number>();
  const out: ResumenCursoAlumno[] = [];
  for (const c of cursos ?? []) {
    const insc = inscripciones.find((i) => i.cursoId === c.id);
    if (!insc) continue;
    const modulos = (mods ?? []).filter((m) => m.curso_id === c.id);
    const estructura = {
      modulos: modulos.map((m) => ({
        lecciones: (lecs ?? []).filter((l) => l.modulo_id === m.id).map((l) => ({ id: l.id as string })),
      })),
    };
    const hechas = new Set((prog ?? []).filter((p) => p.curso_id === c.id && p.completada_at).map((p) => p.leccion_id as string));
    const base = calcularXp(estructura, hechas);
    // El quiz de repaso suma XP aparte de las lecciones (ADR 023).
    const estados = Array.from((await estadoQuizzes(tenantId, alumnoId, c.id)).values());
    const xpQuiz = xpDeQuiz(estados);
    const dominio = calcularDominio(
      estados.reduce((n, e) => n + e.total, 0),
      estados.reduce((n, e) => n + e.respondidas, 0),
      enRepaso.get(c.id) ?? 0,
    );
    const desglose = { ...base, xp: base.xp + xpQuiz };
    const orden = estructura.modulos.flatMap((m) => m.lecciones.map((l) => l.id));
    const ultimo = (prog ?? [])
      .filter((p) => p.curso_id === c.id)
      .sort((a, b) => String(b.ultimo_acceso_at).localeCompare(String(a.ultimo_acceso_at)))[0]?.leccion_id as string | undefined;
    const pendiente = orden.find((id) => !hechas.has(id)) ?? null;
    const continuarId = ultimo && !hechas.has(ultimo) ? ultimo : pendiente ?? orden[0] ?? null;
    out.push({
      cursoId: c.id,
      slug: c.slug,
      titulo: c.titulo,
      estadoInscripcion: insc.estado,
      totalLecciones: desglose.totalLecciones,
      completadas: desglose.lecciones,
      avance: porcentaje(desglose.lecciones, desglose.totalLecciones),
      desglose,
      continuarId,
      totalModulos: modulos.length,
      dominio,
    });
  }
  return out;
}

export type { CursoParaAlumno };
