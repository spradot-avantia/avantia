// Datos del panel de analítica del creador (ADR 040, RQ-27). Cliente con RLS del creador (nunca
// service role) + filtro explícito por tenant. Lee de Supabase, no de PostHog. Tolera que la
// migración 0023 no exista todavía (tiempos vacíos).
import {
  cohortesSemanales,
  embudoPorLeccion,
  resultadosPorPregunta,
  resumenTareas,
  sinActividadHace,
  type FilaCohorte,
  type FilaLeccion,
  type FilaPregunta,
  type FilaTarea,
} from "./analiticaReglas";
import { listarInscripciones } from "./inscripciones";
import { requireCreadorContext } from "./tenantActual";
import { todasLasFilas } from "./todasLasFilas";

export interface AnaliticaCurso {
  cursos: { id: string; titulo: string }[];
  cursoId: string | null;
  lecciones: FilaLeccion[];
  preguntas: FilaPregunta[];
  tareas: FilaTarea[];
  retencion: {
    inscritosActivos: number;
    sinActividad7: number;
    sinActividad14: number;
    cohortes: FilaCohorte[];
  };
  /** Hay mediciones de tiempo (sesiones de lección o duración de respuestas). */
  hayTiempos: boolean;
}

const todas = todasLasFilas;

export async function cargarAnalitica(cursoPedido?: string): Promise<AnaliticaCurso> {
  const { tenant, db } = await requireCreadorContext();
  const T = tenant.id;
  const { data: cursosRows } = await db.from("cursos").select("id, titulo").eq("tenant_id", T).order("created_at");
  const cursos = (cursosRows ?? []).map((c) => ({ id: c.id as string, titulo: (c.titulo as string) ?? "Curso" }));
  const cursoId = cursos.find((c) => c.id === cursoPedido)?.id ?? cursos[0]?.id ?? null;
  const vacio: AnaliticaCurso = {
    cursos,
    cursoId,
    lecciones: [],
    preguntas: [],
    tareas: [],
    retencion: { inscritosActivos: 0, sinActividad7: 0, sinActividad14: 0, cohortes: [] },
    hayTiempos: false,
  };
  if (!cursoId) return vacio;

  const [mods, lecs, preguntasRows, tareasRows, inscripciones] = await Promise.all([
    db.from("modulos").select("id, titulo, orden").eq("tenant_id", T).eq("curso_id", cursoId),
    db.from("lecciones").select("id, titulo, modulo_id, orden").eq("tenant_id", T).eq("curso_id", cursoId),
    db.from("quiz_preguntas").select("id, modulo_id, texto, orden").eq("tenant_id", T).eq("curso_id", cursoId),
    db.from("tareas").select("id, titulo, leccion_id").eq("tenant_id", T).eq("curso_id", cursoId),
    listarInscripciones({ conQuiz: false }),
  ]);
  const modulos = new Map((mods.data ?? []).map((m) => [m.id as string, { titulo: (m.titulo as string) ?? "", orden: (m.orden as number) ?? 0 }]));
  const lecciones = [...(lecs.data ?? [])]
    .map((l) => ({ ...l, mo: modulos.get(l.modulo_id as string) }))
    .sort((a, b) => (a.mo?.orden ?? 0) - (b.mo?.orden ?? 0) || ((a.orden as number) ?? 0) - ((b.orden as number) ?? 0))
    .map((l, i) => ({ id: l.id as string, titulo: (l.titulo as string) ?? "", moduloTitulo: l.mo?.titulo ?? "", orden: i }));

  const [progreso, sesiones, respuestas, entregas, aperturas, eventos] = await Promise.all([
    todas<{ leccion_id: string; alumno_id: string; completada_at: string | null; ultimo_acceso_at: string | null }>((a, b) =>
      db.from("progreso").select("leccion_id, alumno_id, completada_at, ultimo_acceso_at").eq("tenant_id", T).eq("curso_id", cursoId).range(a, b),
    ),
    todas<{ leccion_id: string; alumno_id: string; activo_seg: number; created_at: string }>((a, b) =>
      db.from("sesiones_leccion").select("leccion_id, alumno_id, activo_seg, created_at").eq("tenant_id", T).eq("curso_id", cursoId).range(a, b),
    ),
    todas<{ pregunta_id: string; alumno_id: string; acierto: boolean; primer_intento: boolean; duracion_ms: number | null }>((a, b) =>
      db.from("quiz_respuestas").select("pregunta_id, alumno_id, acierto, primer_intento, duracion_ms").eq("tenant_id", T).eq("curso_id", cursoId).range(a, b),
    ),
    todas<{ tarea_id: string; alumno_id: string; numero: number; enviada_at: string }>((a, b) =>
      db.from("entregas").select("tarea_id, alumno_id, numero, enviada_at").eq("tenant_id", T).range(a, b),
    ),
    todas<{ entidad_id: string; alumno_id: string; created_at: string }>((a, b) =>
      db.from("eventos").select("entidad_id, alumno_id, created_at").eq("tenant_id", T).eq("curso_id", cursoId).eq("tipo", "leccion_abierta").range(a, b),
    ),
    todas<{ alumno_id: string; created_at: string }>((a, b) =>
      db.from("eventos").select("alumno_id, created_at").eq("tenant_id", T).eq("curso_id", cursoId).range(a, b),
    ),
  ]);

  const leccionIds = new Set(lecciones.map((l) => l.id));
  const tareasDelCurso = (tareasRows.data ?? []).map((t) => ({ id: t.id as string, titulo: (t.titulo as string) ?? "Tarea", leccionId: t.leccion_id as string }));
  const idsTarea = new Set(tareasDelCurso.map((t) => t.id));
  const delCurso = inscripciones.filter((i) => i.cursoId === cursoId);
  const activas = delCurso.filter((i) => i.estado === "activa");
  const ahora = Date.now();

  // Actividad por alumno: progreso, sesiones y eventos (para la retención por cohorte).
  const actividad = new Map<string, number[]>();
  const anotar = (alumno: string, iso: string | null) => {
    if (!iso) return;
    const arr = actividad.get(alumno) ?? [];
    arr.push(new Date(iso).getTime());
    actividad.set(alumno, arr);
  };
  progreso.forEach((p) => {
    anotar(p.alumno_id, p.ultimo_acceso_at);
    anotar(p.alumno_id, p.completada_at);
  });
  sesiones.forEach((s) => anotar(s.alumno_id, s.created_at));
  eventos.forEach((e) => anotar(e.alumno_id, e.created_at));

  const preguntasBase = (preguntasRows.data ?? []).map((q) => ({
    id: q.id as string,
    texto: (q.texto as string) ?? "",
    moduloTitulo: modulos.get(q.modulo_id as string)?.titulo ?? "",
    orden: (modulos.get(q.modulo_id as string)?.orden ?? 0) * 1000 + ((q.orden as number) ?? 0),
  }));

  return {
    cursos,
    cursoId,
    lecciones: embudoPorLeccion(
      lecciones,
      progreso.filter((p) => leccionIds.has(p.leccion_id)).map((p) => ({ leccionId: p.leccion_id, alumnoId: p.alumno_id, completada: !!p.completada_at })),
      sesiones.map((s) => ({ leccionId: s.leccion_id, activoSeg: s.activo_seg })),
    ),
    preguntas: resultadosPorPregunta(
      preguntasBase,
      respuestas.map((r) => ({ preguntaId: r.pregunta_id, alumnoId: r.alumno_id, acierto: r.acierto, primerIntento: r.primer_intento, duracionMs: r.duracion_ms })),
    ),
    tareas: resumenTareas(
      tareasDelCurso,
      entregas.filter((e) => idsTarea.has(e.tarea_id)).map((e) => ({ tareaId: e.tarea_id, alumnoId: e.alumno_id, numero: e.numero, enviadaAt: e.enviada_at })),
      aperturas.map((a) => ({ leccionId: a.entidad_id, alumnoId: a.alumno_id, at: a.created_at })),
      activas.length,
    ),
    retencion: {
      inscritosActivos: activas.length,
      sinActividad7: sinActividadHace(activas.map((i) => i.ultimaActividad), 7, ahora),
      sinActividad14: sinActividadHace(activas.map((i) => i.ultimaActividad), 14, ahora),
      cohortes: cohortesSemanales(activas.map((i) => ({ alumnoId: i.alumnoId, desde: i.creadaEn })), actividad, ahora),
    },
    hayTiempos: sesiones.length > 0 || respuestas.some((r) => r.duracion_ms != null),
  };
}
