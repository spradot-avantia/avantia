// Registro de eventos de producto del lado del alumno (RQ-26). Best-effort:
// un fallo al registrar nunca debe romper la acción del estudiante.
import { capturarServidor } from "../analitica/servidor";
import { supabaseAdmin } from "../supabase/admin";

export type TipoEventoAlumno =
  | "cuenta_creada"
  | "inscripcion_creada"
  | "inscripcion_activada"
  | "leccion_completada"
  | "curso_completado"
  | "intento_quiz"
  | "leccion_abierta"
  | "correo_cambiado"
  | "pago_registrado";

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
  // Misma señal hacia PostHog (ADR 040); su propio try/catch: nunca rompe la acción del alumno.
  await capturarServidor(tenantId, e.alumnoId, e.tipo, {
    curso_id: e.cursoId ?? undefined,
    leccion_id: e.entidadTipo === "leccion" ? e.entidadId : undefined,
    modulo_id: e.entidadTipo === "quiz" ? e.entidadId : undefined,
  });
}
