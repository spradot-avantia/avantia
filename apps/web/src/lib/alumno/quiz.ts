// Quiz de repaso del estudiante (ADR 023). Servidor: service role con .eq("tenant_id")
// en cada query. Las preguntas salen SIN la respuesta correcta; se corrige aquí.
import { supabaseAdmin } from "../supabase/admin";
import { estadoQuiz, type PreguntaQuiz } from "../creador/quiz";
import { mapPregunta } from "../creador/quizzes";
import { inscripcionDe } from "./inscripciones";
import { registrarEvento } from "./eventos";
import { UMBRAL_DOMINADO, XP_ACIERTO, XP_RESPONDER, type EstadoQuizModulo } from "./quizReglas";

export { UMBRAL_DOMINADO, XP_ACIERTO, XP_RESPONDER, xpDeQuiz, type EstadoQuizModulo } from "./quizReglas";


export interface PreguntaParaAlumno {
  id: string;
  tipo: PreguntaQuiz["tipo"];
  texto: string;
  opciones: string[];
}

export interface QuizDeModulo {
  moduloId: string;
  preguntas: PreguntaParaAlumno[];
}

interface RespuestaFila {
  modulo_id: string;
  pregunta_id: string;
  acierto: boolean;
  primer_intento: boolean;
}

/** Preguntas del curso por módulo; solo los quizzes completos (3 a 5 preguntas listas). */
export async function quizzesCompletos(tenantId: string, cursoId: string): Promise<Map<string, PreguntaQuiz[]>> {
  const { data } = await supabaseAdmin
    .from("quiz_preguntas")
    .select("id, modulo_id, orden, tipo, texto, opciones, correcta, explicacion")
    .eq("tenant_id", tenantId)
    .eq("curso_id", cursoId)
    .order("orden");
  const por = new Map<string, PreguntaQuiz[]>();
  for (const r of data ?? []) {
    const l = por.get(r.modulo_id) ?? [];
    l.push(mapPregunta(r));
    por.set(r.modulo_id, l);
  }
  for (const [m, ps] of Array.from(por)) if (!estadoQuiz(ps).completo) por.delete(m);
  return por;
}

const sinCorrecta = (p: PreguntaQuiz): PreguntaParaAlumno => ({ id: p.id, tipo: p.tipo, texto: p.texto, opciones: p.opciones });

/** Quiz del módulo para responder (sin correctas), o null si no hay un quiz completo. */
export async function quizDelModulo(tenantId: string, cursoId: string, moduloId: string): Promise<QuizDeModulo | null> {
  const ps = (await quizzesCompletos(tenantId, cursoId)).get(moduloId);
  return ps ? { moduloId, preguntas: ps.map(sinCorrecta) } : null;
}

async function respuestasDelCurso(tenantId: string, alumnoId: string, cursoId: string): Promise<RespuestaFila[]> {
  const { data, error } = await supabaseAdmin
    .from("quiz_respuestas")
    .select("modulo_id, pregunta_id, acierto, primer_intento")
    .eq("tenant_id", tenantId)
    .eq("alumno_id", alumnoId)
    .eq("curso_id", cursoId);
  // Si la tabla aún no existe (migración 0011 sin aplicar) el curso sigue funcionando sin quiz.
  return error ? [] : ((data ?? []) as RespuestaFila[]);
}

/** Estado del quiz por módulo (solo módulos con quiz completo). */
export async function estadoQuizzes(tenantId: string, alumnoId: string, cursoId: string): Promise<Map<string, EstadoQuizModulo>> {
  const [quizzes, resp] = await Promise.all([quizzesCompletos(tenantId, cursoId), respuestasDelCurso(tenantId, alumnoId, cursoId)]);
  const out = new Map<string, EstadoQuizModulo>();
  for (const [moduloId, ps] of Array.from(quizzes)) {
    const delModulo = resp.filter((r) => r.modulo_id === moduloId);
    const respondidas = new Set(delModulo.map((r) => r.pregunta_id)).size;
    const aciertos = delModulo.filter((r) => r.primer_intento && r.acierto).length;
    out.set(moduloId, {
      moduloId,
      total: ps.length,
      respondidas,
      aciertosPrimerIntento: aciertos,
      dominado: respondidas >= ps.length && aciertos / ps.length >= UMBRAL_DOMINADO,
    });
  }
  return out;
}

export type ResultadoResponder =
  | { ok: true; acierto: boolean; correcta: number; explicacion: string; xpGanada: number }
  | { ok: false; error: string };

/** Corrige y guarda una respuesta. Valida inscripción activa y que la pregunta sea del módulo/curso. */
export async function responderPregunta(
  tenantId: string,
  alumnoId: string,
  cursoId: string,
  moduloId: string,
  preguntaId: string,
  opcion: number,
): Promise<ResultadoResponder> {
  const insc = await inscripcionDe(tenantId, alumnoId, cursoId);
  if (!insc || insc.estado !== "activa") return { ok: false, error: "Tu inscripción aún no está activa." };
  const quizzes = await quizzesCompletos(tenantId, cursoId);
  const p = quizzes.get(moduloId)?.find((x) => x.id === preguntaId);
  if (!p || p.correcta == null) return { ok: false, error: "No encontramos esa pregunta." };
  if (!Number.isInteger(opcion) || opcion < 0 || opcion >= p.opciones.length) return { ok: false, error: "Elige una de las respuestas." };

  const { count } = await supabaseAdmin
    .from("quiz_respuestas")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("alumno_id", alumnoId)
    .eq("pregunta_id", preguntaId);
  const primera = (count ?? 0) === 0;
  const acierto = opcion === p.correcta;
  const { error } = await supabaseAdmin.from("quiz_respuestas").insert({
    tenant_id: tenantId,
    curso_id: cursoId,
    modulo_id: moduloId,
    alumno_id: alumnoId,
    pregunta_id: preguntaId,
    opcion,
    acierto,
    primer_intento: primera,
  });
  if (error) return { ok: false, error: "No pudimos guardar tu respuesta. Inténtalo de nuevo." };
  await registrarEvento(tenantId, { tipo: "intento_quiz", alumnoId, cursoId, entidadTipo: "quiz", entidadId: moduloId });
  return {
    ok: true,
    acierto,
    correcta: p.correcta,
    explicacion: p.explicacion,
    xpGanada: primera ? XP_RESPONDER + (acierto ? XP_ACIERTO : 0) : 0,
  };
}
