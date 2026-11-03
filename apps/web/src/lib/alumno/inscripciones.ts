// Inscripciones del alumno (ADR 018). Todo con service role y SIEMPRE filtrado
// por el tenant del host; el alumno nunca elige tenant ni estado.
import { supabaseAdmin } from "../supabase/admin";
import { registrarEvento } from "./eventos";

export type EstadoInscripcion = "pendiente" | "activa" | "rechazada" | "vencida" | "cancelada";
export type OrigenInscripcion = "invitacion" | "anuncio" | "pagina";

export interface InscripcionAlumno {
  id: string;
  cursoId: string;
  estado: EstadoInscripcion;
  origen: OrigenInscripcion;
  createdAt: string;
}

function mapInsc(r: any): InscripcionAlumno {
  return { id: r.id, cursoId: r.curso_id, estado: r.estado, origen: r.origen, createdAt: r.created_at };
}

export async function inscripcionDe(tenantId: string, alumnoId: string, cursoId: string): Promise<InscripcionAlumno | null> {
  const { data } = await supabaseAdmin
    .from("inscripciones")
    .select("id, curso_id, estado, origen, created_at")
    .eq("tenant_id", tenantId)
    .eq("alumno_id", alumnoId)
    .eq("curso_id", cursoId)
    .maybeSingle();
  return data ? mapInsc(data) : null;
}

export async function inscripcionesDe(tenantId: string, alumnoId: string): Promise<InscripcionAlumno[]> {
  const { data } = await supabaseAdmin
    .from("inscripciones")
    .select("id, curso_id, estado, origen, created_at")
    .eq("tenant_id", tenantId)
    .eq("alumno_id", alumnoId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapInsc);
}

/**
 * Convierte en inscripciones ACTIVAS las invitaciones vigentes del correo. Solo
 * para correos ya confirmados (si no, cualquiera heredaría la invitación de otra
 * persona). Una inscripción rechazada por el creador no se reactiva sola.
 */
export async function aplicarInvitaciones(tenantId: string, alumnoId: string, correo: string): Promise<number> {
  const { data: invs } = await supabaseAdmin
    .from("invitaciones")
    .select("id, curso_id")
    .eq("tenant_id", tenantId)
    .eq("email", correo.toLowerCase())
    .eq("estado", "pendiente");
  let aplicadas = 0;
  for (const inv of invs ?? []) {
    const actual = await inscripcionDe(tenantId, alumnoId, inv.curso_id);
    const ahora = new Date().toISOString();
    if (!actual) {
      const { error } = await supabaseAdmin.from("inscripciones").insert({
        tenant_id: tenantId,
        curso_id: inv.curso_id,
        alumno_id: alumnoId,
        estado: "activa",
        origen: "invitacion",
        activada_por: "invitacion",
        activada_en: ahora,
      });
      if (error) continue;
      await registrarEvento(tenantId, { tipo: "inscripcion_creada", alumnoId, cursoId: inv.curso_id, entidadTipo: "curso", entidadId: inv.curso_id });
      await registrarEvento(tenantId, { tipo: "inscripcion_activada", alumnoId, cursoId: inv.curso_id, entidadTipo: "curso", entidadId: inv.curso_id });
    } else if (actual.estado === "pendiente") {
      await supabaseAdmin
        .from("inscripciones")
        .update({ estado: "activa", activada_por: "invitacion", activada_en: ahora })
        .eq("tenant_id", tenantId)
        .eq("id", actual.id);
      await registrarEvento(tenantId, { tipo: "inscripcion_activada", alumnoId, cursoId: inv.curso_id, entidadTipo: "curso", entidadId: inv.curso_id });
    } else if (actual.estado === "rechazada") {
      continue;
    }
    await supabaseAdmin.from("invitaciones").update({ estado: "aceptada" }).eq("tenant_id", tenantId).eq("id", inv.id);
    aplicadas += 1;
  }
  return aplicadas;
}

export interface CursoParaInscribir {
  id: string;
  acceso: "invitados" | "enlace";
  estado: "borrador" | "publicado";
}

export type ResultadoInscripcion =
  | { ok: true; inscripcion: InscripcionAlumno; creada: boolean }
  | { ok: false; error: string };

/**
 * El alumno pide entrar a un curso. Sin invitación vigente queda `pendiente` hasta
 * que el creador la active (o la pasarela, a futuro). Cursos "solo invitados" no
 * admiten autoinscripción.
 */
export async function solicitarInscripcion(
  tenantId: string,
  alumno: { id: string; correo: string; verificado: boolean },
  curso: CursoParaInscribir,
  origen: { origen: OrigenInscripcion; campana: string | null },
): Promise<ResultadoInscripcion> {
  if (curso.estado !== "publicado") return { ok: false, error: "Este curso aún no está disponible." };

  const existente = await inscripcionDe(tenantId, alumno.id, curso.id);
  if (existente) return { ok: true, inscripcion: existente, creada: false };

  if (curso.acceso === "invitados") {
    if (alumno.verificado) await aplicarInvitaciones(tenantId, alumno.id, alumno.correo);
    const tras = await inscripcionDe(tenantId, alumno.id, curso.id);
    if (tras) return { ok: true, inscripcion: tras, creada: true };
    return {
      ok: false,
      error: "Este curso es solo para personas invitadas. Pídele a la academia que te invite con este mismo correo.",
    };
  }

  const { data, error } = await supabaseAdmin
    .from("inscripciones")
    .insert({
      tenant_id: tenantId,
      curso_id: curso.id,
      alumno_id: alumno.id,
      estado: "pendiente",
      origen: origen.origen,
      campana: origen.campana,
    })
    .select("id, curso_id, estado, origen, created_at")
    .single();
  if (error || !data) return { ok: false, error: "No pudimos crear tu inscripción. Inténtalo de nuevo en unos minutos." };
  await registrarEvento(tenantId, { tipo: "inscripcion_creada", alumnoId: alumno.id, cursoId: curso.id, entidadTipo: "curso", entidadId: curso.id });
  return { ok: true, inscripcion: mapInsc(data), creada: true };
}
