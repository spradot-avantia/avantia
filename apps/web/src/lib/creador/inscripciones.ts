// Inscripciones de alumnos vistas por el creador (diseño 04 · Estudiantes).
// Cliente con RLS del creador (nunca service role) + filtro explícito por tenant.
import type { Dominio } from "../alumno/dominioReglas";
import { calcularXp, porcentaje } from "../alumno/xp";
import { claveAlumnoCurso, resumenQuizPorAlumno, type ResumenQuizAlumno } from "./dominioAlumnos";
import { MEDIOS_PAGO } from "./mediosPago";
import { avanceSinDominio, ritmoPorModulo, type AvanceSinDominio, type ModuloRitmo, type RespuestaRitmo } from "./ritmoReglas";
import { requireCreadorContext } from "./tenantActual";
import { todasLasFilas } from "./todasLasFilas";
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
  /** Lo que domina de los quizzes del curso (ADR 026); null sin quiz, sin respuestas o sin migración 0013. */
  dominio: Dominio | null;
  ultimaActividad: string | null;
  /** Activa y sin entrar hace 7 días o más. */
  sinActividad: boolean;
  /** Último pago registrado (manual o por Mercado Pago, ADR 046). */
  pago: { medio: string; referencia: string | null } | null;
  /** Tiempo activo y quiz al primer intento por módulo, en orden (vacío con `conQuiz: false`). */
  modulos: ModuloRitmo[];
  /** Módulo que completó mucho más rápido que la clase sin dominarlo (ritmoReglas); null si no hay. */
  avanceSinDominio: AvanceSinDominio | null;
}

const DIAS_SIN_ACTIVIDAD = 7;

/** `conQuiz: false` omite el XP y el dominio del quiz (p. ej. el Inicio, que solo usa el avance). */
export async function listarInscripciones(opciones: { conQuiz?: boolean } = {}): Promise<FilaInscripcion[]> {
  const conQuiz = opciones.conQuiz ?? true;
  const { tenant, db } = await requireCreadorContext();
  const { data: insc } = await db
    .from("inscripciones")
    .select("id, alumno_id, curso_id, estado, origen, campana, created_at")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });
  if (!insc?.length) return [];

  const [alumnos, cursos, mods, lecs, prog, pagos] = await Promise.all([
    db.from("alumnos").select("id, nombre, correo, ultimo_ingreso_at").eq("tenant_id", tenant.id),
    db.from("cursos").select("id, titulo, precio_centavos").eq("tenant_id", tenant.id),
    db.from("modulos").select("id, curso_id, titulo, orden").eq("tenant_id", tenant.id).order("orden"),
    db.from("lecciones").select("id, curso_id, modulo_id").eq("tenant_id", tenant.id),
    db.from("progreso").select("alumno_id, curso_id, leccion_id, completada_at, ultimo_acceso_at").eq("tenant_id", tenant.id),
    db.from("pagos").select("inscripcion_id, medio, referencia_externa, created_at").eq("tenant_id", tenant.id).order("created_at", { ascending: true }),
  ]);
  // El último pago de cada inscripción gana (orden ascendente + Map).
  const pagoPorInsc = new Map(
    (pagos.data ?? []).map((p) => [p.inscripcion_id as string, { medio: p.medio as string, referencia: (p.referencia_externa as string | null) ?? null }]),
  );
  // XP y dominio del quiz: agregados en la base y solo de inscripciones activas (tope en dominioAlumnos).
  const quiz = conQuiz
    ? await resumenQuizPorAlumno(
        db,
        tenant.id,
        insc.filter((i) => i.estado === "activa").map((i) => ({ alumnoId: i.alumno_id, cursoId: i.curso_id })),
      )
    : new Map<string, ResumenQuizAlumno>();
  // Ritmo por módulo: tiempo activo por lección (migración 0023) y respuestas al primer intento.
  // Tolera que la tabla no exista (sin tiempos). Agregado por alumno y lección / módulo.
  const segPorAlumnoLeccion = new Map<string, number>();
  const respPorAlumnoCurso = new Map<string, RespuestaRitmo[]>();
  if (conQuiz) {
    const [sesiones, respuestas] = await Promise.all([
      todasLasFilas<{ alumno_id: string; leccion_id: string; activo_seg: number }>((a, b) =>
        db.from("sesiones_leccion").select("alumno_id, leccion_id, activo_seg").eq("tenant_id", tenant.id).range(a, b),
      ),
      todasLasFilas<{ alumno_id: string; curso_id: string; modulo_id: string; acierto: boolean; duracion_ms: number | null }>((a, b) =>
        db
          .from("quiz_respuestas")
          .select("alumno_id, curso_id, modulo_id, acierto, duracion_ms")
          .eq("tenant_id", tenant.id)
          .eq("primer_intento", true)
          .range(a, b),
      ),
    ]);
    for (const s of sesiones) {
      const k = `${s.alumno_id}:${s.leccion_id}`;
      segPorAlumnoLeccion.set(k, (segPorAlumnoLeccion.get(k) ?? 0) + (s.activo_seg ?? 0));
    }
    for (const r of respuestas) {
      const k = claveAlumnoCurso(r.alumno_id, r.curso_id);
      (respPorAlumnoCurso.get(k) ?? respPorAlumnoCurso.set(k, []).get(k)!).push({
        moduloId: r.modulo_id, acierto: r.acierto, primerIntento: true, duracionMs: r.duracion_ms,
      });
    }
  }
  const porAlumno = new Map((alumnos.data ?? []).map((a) => [a.id as string, a]));
  const porCurso = new Map((cursos.data ?? []).map((c) => [c.id as string, c]));
  const limite = Date.now() - DIAS_SIN_ACTIVIDAD * 86400000;

  const filas: FilaInscripcion[] = insc.map((i) => {
    const a = porAlumno.get(i.alumno_id);
    const c = porCurso.get(i.curso_id);
    const modulosCurso = (mods.data ?? [])
      .filter((m) => m.curso_id === i.curso_id)
      .map((m) => ({
        id: m.id as string,
        titulo: (m.titulo as string) ?? "Módulo",
        leccionIds: (lecs.data ?? []).filter((l) => l.modulo_id === m.id).map((l) => l.id as string),
      }));
    const estructura = { modulos: modulosCurso.map((m) => ({ lecciones: m.leccionIds.map((id) => ({ id })) })) };
    const propios = (prog.data ?? []).filter((p) => p.alumno_id === i.alumno_id && p.curso_id === i.curso_id);
    const hechas = new Set(propios.filter((p) => p.completada_at).map((p) => p.leccion_id as string));
    const d = calcularXp(estructura, hechas);
    const q = quiz.get(claveAlumnoCurso(i.alumno_id, i.curso_id));
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
      xp: d.xp + (q?.xpQuiz ?? 0),
      dominio: q?.dominio ?? null,
      ultimaActividad: ultima,
      sinActividad: i.estado === "activa" && (!ultima || new Date(ultima).getTime() < limite),
      pago: pagoPorInsc.get(i.id) ?? null,
      modulos:
        conQuiz && i.estado === "activa"
          ? ritmoPorModulo(
              modulosCurso,
              hechas,
              new Map(modulosCurso.flatMap((m) => m.leccionIds).map((id) => [id, segPorAlumnoLeccion.get(`${i.alumno_id}:${id}`) ?? 0])),
              respPorAlumnoCurso.get(claveAlumnoCurso(i.alumno_id, i.curso_id)) ?? [],
            )
          : [],
      avanceSinDominio: null,
    };
  });
  // La comparación es contra la clase: se calcula con todas las inscripciones activas a la vez.
  const marcas = avanceSinDominio(filas.filter((f) => f.modulos.length > 0).map((f) => ({ clave: f.id, cursoId: f.cursoId, modulos: f.modulos })));
  for (const f of filas) f.avanceSinDominio = marcas.get(f.id) ?? null;
  return filas;
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
