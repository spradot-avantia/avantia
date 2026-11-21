// Actividad reciente de los alumnos para el Inicio del creador.
// Cliente con RLS del creador (nunca service role) + filtro explícito por tenant en cada query.
import { armarActividad, temasConDificultad, type ItemActividad, type TemaDificil, type Titulos } from "./actividadReglas";
import { requireCreadorContext } from "./tenantActual";

const TIPOS = ["leccion_completada", "curso_completado", "inscripcion_activada", "pago_registrado", "intento_quiz"];
/** Eventos crudos a leer: los quiz llegan uno por respuesta y se agrupan después. */
const MAX_EVENTOS = 120;
const MAX_ENTREGAS = 10;
const MAX_RESPUESTAS = 600;

export async function cargarActividadReciente(limite = 15): Promise<ItemActividad[]> {
  const { tenant, db } = await requireCreadorContext();
  const T = tenant.id;

  const [ev, ent] = await Promise.all([
    db
      .from("eventos")
      .select("id, alumno_id, curso_id, tipo, entidad_id, created_at")
      .eq("tenant_id", T)
      .in("tipo", TIPOS)
      .not("alumno_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(MAX_EVENTOS),
    db
      .from("entregas")
      .select("id, alumno_id, tarea_id, numero, enviada_at")
      .eq("tenant_id", T)
      .order("enviada_at", { ascending: false })
      .limit(MAX_ENTREGAS),
  ]);
  const eventos = (ev.data ?? []).map((e) => ({
    id: e.id as string,
    alumnoId: e.alumno_id as string,
    cursoId: (e.curso_id as string | null) ?? null,
    tipo: e.tipo as string,
    entidadId: (e.entidad_id as string | null) ?? null,
    fecha: e.created_at as string,
  }));
  const entregas = (ent.data ?? []).map((e) => ({
    id: e.id as string,
    alumnoId: e.alumno_id as string,
    tareaId: e.tarea_id as string,
    numero: (e.numero as number) ?? 1,
    fecha: e.enviada_at as string,
  }));
  if (!eventos.length && !entregas.length) return [];

  const ids = (f: (x: (typeof eventos)[number]) => string | null, tipos?: string[]) =>
    Array.from(new Set(eventos.filter((e) => !tipos || tipos.includes(e.tipo)).map(f).filter((x): x is string => !!x)));
  const alumnoIds = Array.from(new Set([...eventos.map((e) => e.alumnoId), ...entregas.map((e) => e.alumnoId)]));
  const leccionIds = ids((e) => e.entidadId, ["leccion_completada"]);
  const moduloIds = ids((e) => e.entidadId, ["intento_quiz"]);
  const cursoIds = ids((e) => e.cursoId);
  const tareaIds = Array.from(new Set(entregas.map((e) => e.tareaId)));
  const quizAlumnos = ids((e) => e.alumnoId, ["intento_quiz"]);
  const desde = eventos.filter((e) => e.tipo === "intento_quiz").map((e) => e.fecha).sort()[0];

  const vacio = Promise.resolve({ data: [] as Record<string, unknown>[] });
  const [al, cu, le, mo, ta, re] = await Promise.all([
    alumnoIds.length ? db.from("alumnos").select("id, nombre").eq("tenant_id", T).in("id", alumnoIds) : vacio,
    cursoIds.length ? db.from("cursos").select("id, titulo").eq("tenant_id", T).in("id", cursoIds) : vacio,
    leccionIds.length ? db.from("lecciones").select("id, titulo").eq("tenant_id", T).in("id", leccionIds) : vacio,
    moduloIds.length ? db.from("modulos").select("id, titulo").eq("tenant_id", T).in("id", moduloIds) : vacio,
    tareaIds.length ? db.from("tareas").select("id, titulo").eq("tenant_id", T).in("id", tareaIds) : vacio,
    quizAlumnos.length && desde
      ? db
          .from("quiz_respuestas")
          .select("alumno_id, modulo_id, acierto, created_at")
          .eq("tenant_id", T)
          .in("alumno_id", quizAlumnos)
          .gte("created_at", `${desde.slice(0, 10)}T00:00:00Z`)
          .order("created_at", { ascending: false })
          .limit(MAX_RESPUESTAS)
      : vacio,
  ]);

  const mapa = (rows: Record<string, unknown>[] | null, campo: string) =>
    new Map((rows ?? []).map((r) => [r.id as string, ((r[campo] as string) ?? "").trim()]));
  const titulos: Titulos = {
    alumnos: mapa(al.data, "nombre"),
    cursos: mapa(cu.data, "titulo"),
    lecciones: mapa(le.data, "titulo"),
    modulos: mapa(mo.data, "titulo"),
    tareas: mapa(ta.data, "titulo"),
  };
  const respuestas = (re.data ?? []).map((r) => ({
    alumnoId: r.alumno_id as string,
    moduloId: r.modulo_id as string,
    acierto: !!r.acierto,
    fecha: r.created_at as string,
  }));
  return armarActividad(eventos, respuestas, entregas, titulos, limite);
}

const MAX_RESPUESTAS_TEMAS = 3000;

export interface TemaDificilConTitulo extends TemaDificil {
  modulo: string;
  curso: string;
  cursoId: string;
}

/** Los módulos donde más se equivocan al primer intento (todas las preguntas del tenant, las más recientes). */
export async function cargarTemasDificiles(): Promise<TemaDificilConTitulo[]> {
  const { tenant, db } = await requireCreadorContext();
  const T = tenant.id;
  const { data } = await db
    .from("quiz_respuestas")
    .select("alumno_id, modulo_id, acierto")
    .eq("tenant_id", T)
    .eq("primer_intento", true)
    .order("created_at", { ascending: false })
    .limit(MAX_RESPUESTAS_TEMAS);
  const temas = temasConDificultad(
    (data ?? []).map((r) => ({ alumnoId: r.alumno_id as string, moduloId: r.modulo_id as string, acierto: !!r.acierto })),
  );
  if (!temas.length) return [];
  const { data: mods } = await db
    .from("modulos")
    .select("id, titulo, curso_id")
    .eq("tenant_id", T)
    .in(
      "id",
      temas.map((t) => t.moduloId),
    );
  const cursoIds = Array.from(new Set((mods ?? []).map((m) => m.curso_id as string)));
  const { data: cursos } = cursoIds.length
    ? await db.from("cursos").select("id, titulo").eq("tenant_id", T).in("id", cursoIds)
    : { data: [] as { id: string; titulo: string }[] };
  const porId = new Map((mods ?? []).map((m) => [m.id as string, m]));
  const tituloCurso = new Map((cursos ?? []).map((c) => [c.id as string, (c.titulo as string) ?? "Curso"]));
  return temas.map((t) => {
    const m = porId.get(t.moduloId);
    const cursoId = (m?.curso_id as string) ?? "";
    return { ...t, modulo: (m?.titulo as string) || "Módulo", curso: tituloCurso.get(cursoId) ?? "Curso", cursoId };
  });
}
