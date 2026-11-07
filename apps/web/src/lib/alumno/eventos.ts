// Registro de eventos de producto del lado del alumno (RQ-26). Best-effort:
// un fallo al registrar nunca debe romper la acción del estudiante.
import { supabaseAdmin } from "../supabase/admin";

export type TipoEventoAlumno =
  | "cuenta_creada"
  | "inscripcion_creada"
  | "inscripcion_activada"
  | "leccion_completada"
  | "curso_completado"
  | "intento_quiz"
  | "correo_cambiado";

export async function registrarEvento(
  tenantId: string,
  e: { tipo: TipoEventoAlumno; alumnoId: string; cursoId?: string | null; entidadTipo?: "curso" | "leccion" | "quiz"; entidadId?: string },
): Promise<void> {
  try {
    await supabaseAdmin.from("eventos").insert({
      tenant_id: tenantId,
      alumno_id: e.alumnoId,
      curso_id: e.cursoId ?? null,
      tipo: e.tipo,
      entidad_tipo: e.entidadTipo ?? null,
      entidad_id: e.entidadId ?? null,
    });
  } catch (err) {
    console.error("[eventos] no se pudo registrar", e.tipo, err instanceof Error ? err.message : err);
  }
}
