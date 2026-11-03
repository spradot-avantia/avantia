// Inscripciones de alumnos vistas por el creador (diseño 04 · Estudiantes).
// Cliente con RLS del creador (nunca service role) + filtro explícito por tenant.
import { calcularXp, porcentaje } from "../alumno/xp";
import { MEDIOS_PAGO } from "./mediosPago";
import { requireCreadorContext } from "./tenantActual";
import type { Resultado } from "./types";

export type EstadoInscripcion = "pendiente" | "activa" | "rechazada" | "vencida" | "cancelada";
export interface FilaInscripcion {
  id: string;
  alumnoId: string;
  nombre: string;
  correo: string;
  cursoId: string;
  cursoTitulo: string;
  precioCentavos: number;
  estado: EstadoInscripcion;
  origen: "invitacion" | "anuncio" | "pagina";
  campana: string | null;
  creadaEn: string;
  avance: number;
  completadas: number;
  totalLecciones: number;
  xp: number;
  ultimaActividad: string | null;
  /** Activa y sin entrar hace 7 días o más. */
  sinActividad: boolean;
}

const DIAS_SIN_ACTIVIDAD = 7;

export async function listarInscripciones(): Promise<FilaInscripcion[]> {
  const { tenant, db } = await requireCreadorContext();
  const { data: insc } = await db
    .from("inscripciones")
    .select("id, alumno_id, curso_id, estado, origen, campana, created_at")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });
  if (!insc?.length) return [];

  const [alumnos, cursos, mods, lecs, prog] = await Promise.all([
    db.from("alumnos").select("id, nombre, correo, ultimo_ingreso_at").eq("tenant_id", tenant.id),
    db.from("cursos").select("id, titulo, precio_centavos").eq("tenant_id", tenant.id),
    db.from("modulos").select("id, curso_id").eq("tenant_id", tenant.id),
    db.from("lecciones").select("id, curso_id, modulo_id").eq("tenant_id", tenant.id),
    db.from("progreso").select("alumno_id, curso_id, leccion_id, completada_at, ultimo_acceso_at").eq("tenant_id", tenant.id),
  ]);
  const porAlumno = new Map((alumnos.data ?? []).map((a) => [a.id as string, a]));
  const porCurso = new Map((cursos.data ?? []).map((c) => [c.id as string, c]));
  const limite = Date.now() - DIAS_SIN_ACTIVIDAD * 86400000;

  return insc.map((i) => {
    const a = porAlumno.get(i.alumno_id);
    const c = porCurso.get(i.curso_id);
    const estructura = {
      modulos: (mods.data ?? [])
        .filter((m) => m.curso_id === i.curso_id)
        .map((m) => ({ lecciones: (lecs.data ?? []).filter((l) => l.modulo_id === m.id).map((l) => ({ id: l.id as string })) })),
    };
    const propios = (prog.data ?? []).filter((p) => p.alumno_id === i.alumno_id && p.curso_id === i.curso_id);
    const hechas = new Set(propios.filter((p) => p.completada_at).map((p) => p.leccion_id as string));
    const d = calcularXp(estructura, hechas);
    const ultimaProg = propios.map((p) => String(p.ultimo_acceso_at)).sort().pop() ?? null;
    const ultima = [ultimaProg, a?.ultimo_ingreso_at ?? null].filter(Boolean).sort().pop() ?? null;
    return {
      id: i.id,
      alumnoId: i.alumno_id,
      nombre: a?.nombre ?? "Sin nombre",
      correo: a?.correo ?? "",
      cursoId: i.curso_id,
      cursoTitulo: c?.titulo ?? "Curso",
      precioCentavos: c?.precio_centavos ?? 0,
      estado: i.estado,
      origen: i.origen,
      campana: i.campana,
      creadaEn: i.created_at,
      avance: porcentaje(d.lecciones, d.totalLecciones),
      completadas: d.lecciones,
      totalLecciones: d.totalLecciones,
      xp: d.xp,
      ultimaActividad: ultima,
      sinActividad: i.estado === "activa" && (!ultima || new Date(ultima).getTime() < limite),
    };
  });
}

/** Activa una inscripción pendiente y registra el pago manual (diseño 04.1). */
export async function activarInscripcion(inscripcionId: string, medio: string, confirmaPago: boolean): Promise<Resultado> {
  const { tenant, db } = await requireCreadorContext();
  if (!MEDIOS_PAGO.some((m) => m.id === medio)) return { ok: false, error: "Elige cómo se pagó." };
  if (!confirmaPago) return { ok: false, error: "Marca que confirmas el pago recibido fuera de la plataforma." };

  const { data: insc } = await db
    .from("inscripciones")
    .select("id, alumno_id, curso_id, estado")
    .eq("tenant_id", tenant.id)
    .eq("id", inscripcionId)
    .maybeSingle();
  if (!insc) return { ok: false, error: "No encontramos esa inscripción." };
  if (insc.estado !== "pendiente") return { ok: false, error: "Esta inscripción ya no está pendiente." };

  const { data: curso } = await db.from("cursos").select("precio_centavos").eq("tenant_id", tenant.id).eq("id", insc.curso_id).maybeSingle();
  const { data: actualizada, error } = await db
    .from("inscripciones")
    .update({ estado: "activa", activada_por: "creador", activada_en: new Date().toISOString() })
    .eq("tenant_id", tenant.id)
    .eq("id", inscripcionId)
    .eq("estado", "pendiente")
    .select("id")
    .maybeSingle();
  if (error || !actualizada) return { ok: false, error: "No pudimos activar la inscripción. Inténtalo de nuevo." };

  const { error: errPago } = await db.from("pagos").insert({
    tenant_id: tenant.id,
    inscripcion_id: inscripcionId,
    monto_centavos: medio === "sin_costo" ? 0 : (curso?.precio_centavos ?? 0),
    medio,
    registrado_por: "creador",
  });
  if (errPago) console.error("[inscripciones] pago no registrado", errPago.message);

  await db.from("eventos").insert([
    { tenant_id: tenant.id, alumno_id: insc.alumno_id, curso_id: insc.curso_id, tipo: "inscripcion_activada", entidad_tipo: "curso", entidad_id: insc.curso_id },
    { tenant_id: tenant.id, alumno_id: insc.alumno_id, curso_id: insc.curso_id, tipo: "pago_registrado", entidad_tipo: "curso", entidad_id: insc.curso_id },
  ]);
  return { ok: true, data: undefined };
}

export async function rechazarInscripcion(inscripcionId: string): Promise<Resultado> {
  const { tenant, db } = await requireCreadorContext();
  const { data: insc } = await db
    .from("inscripciones")
    .update({ estado: "rechazada" })
    .eq("tenant_id", tenant.id)
    .eq("id", inscripcionId)
    .eq("estado", "pendiente")
    .select("alumno_id, curso_id")
    .maybeSingle();
  if (!insc) return { ok: false, error: "No pudimos rechazar la inscripción: ya no está pendiente." };
  await db.from("eventos").insert({
    tenant_id: tenant.id,
    alumno_id: insc.alumno_id,
    curso_id: insc.curso_id,
    tipo: "inscripcion_rechazada",
    entidad_tipo: "curso",
    entidad_id: insc.curso_id,
  });
  return { ok: true, data: undefined };
}
