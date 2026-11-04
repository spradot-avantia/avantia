// Repaso espaciado (ADR 024). Servidor: service role + tenant del host + alumno de la sesión.
// Lectura acotada: la función SQL solo mira preguntas falladas del alumno y sus últimas N respuestas.
import { supabaseAdmin } from "../supabase/admin";
import { quizzesCompletos, type PreguntaParaAlumno } from "./quiz";
import { MAX_REPASO_DIARIO, preguntasDeRepaso } from "./repasoReglas";

export interface PreguntaRepaso extends PreguntaParaAlumno {
  cursoId: string;
  moduloId: string;
}

interface FilaRepaso {
  curso_id: string;
  modulo_id: string;
  pregunta_id: string;
  acierto: boolean;
  created_at: string;
}

/** Preguntas que vencen hoy, solo de cursos con inscripción activa. Tolera que la migración 0012 no exista. */
export async function repasoDeHoy(tenantId: string, alumnoId: string, cursosActivos: string[], ahora: Date = new Date()): Promise<PreguntaRepaso[]> {
  if (cursosActivos.length === 0) return [];
  const { data, error } = await supabaseAdmin.rpc("quiz_respuestas_para_repaso", { p_tenant: tenantId, p_alumno: alumnoId, p_ventana: 8 });
  if (error || !data?.length) return [];

  const permitidos = new Set(cursosActivos);
  const filas = (data as FilaRepaso[]).filter((r) => permitidos.has(r.curso_id));
  const ids = preguntasDeRepaso(
    filas.map((r) => ({ preguntaId: r.pregunta_id, acierto: r.acierto, creadaEn: r.created_at })),
    ahora,
    MAX_REPASO_DIARIO,
  );
  if (ids.length === 0) return [];

  const ubicacion = new Map(filas.map((r) => [r.pregunta_id, { cursoId: r.curso_id, moduloId: r.modulo_id }]));
  const cursos = Array.from(new Set(ids.map((id) => ubicacion.get(id)!.cursoId)));
  const quizzes = new Map(await Promise.all(cursos.map(async (c) => [c, await quizzesCompletos(tenantId, c)] as const)));

  const out: PreguntaRepaso[] = [];
  for (const id of ids) {
    const { cursoId, moduloId } = ubicacion.get(id)!;
    const p = quizzes.get(cursoId)?.get(moduloId)?.find((x) => x.id === id);
    if (p) out.push({ id: p.id, tipo: p.tipo, texto: p.texto, opciones: p.opciones, cursoId, moduloId });
  }
  return out;
}
