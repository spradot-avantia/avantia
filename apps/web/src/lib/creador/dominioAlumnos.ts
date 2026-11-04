// Dominio y XP del quiz por estudiante, para el panel del creador (ADR 026).
// Cliente con RLS del creador + funciones SQL acotadas (migración 0013). Tolera que no existan.
import type { SupabaseClient } from "@supabase/supabase-js";
import { calcularDominio, type Dominio } from "../alumno/dominioReglas";
import { XP_ACIERTO, XP_RESPONDER } from "../alumno/quizReglas";
import { preguntasEnRepaso } from "../alumno/repasoReglas";
import { estadoQuiz } from "./quiz";
import { preguntasPorModulo } from "./quizzes";

/** Máximo de estudiantes por consulta (el mismo tope que las funciones SQL). */
export const MAX_ALUMNOS_DOMINIO = 200;

export interface ResumenQuizAlumno {
  dominio: Dominio | null;
  xpQuiz: number;
}

export const claveAlumnoCurso = (alumnoId: string, cursoId: string) => `${alumnoId}:${cursoId}`;

interface FilaResumen {
  alumno_id: string;
  curso_id: string;
  respondidas: number;
  aciertos_primer_intento: number;
}
interface FilaRepaso {
  alumno_id: string;
  curso_id: string;
  pregunta_id: string;
  acierto: boolean;
  created_at: string;
}

export async function resumenQuizPorAlumno(
  db: SupabaseClient,
  tenantId: string,
  pares: { alumnoId: string; cursoId: string }[],
): Promise<Map<string, ResumenQuizAlumno>> {
  const out = new Map<string, ResumenQuizAlumno>();
  const alumnos = Array.from(new Set(pares.map((p) => p.alumnoId))).slice(0, MAX_ALUMNOS_DOMINIO);
  if (alumnos.length === 0) return out;

  const [res, rep] = await Promise.all([
    db.rpc("quiz_resumen_por_alumno", { p_tenant: tenantId, p_alumnos: alumnos }),
    db.rpc("quiz_respuestas_para_repaso_lote", { p_tenant: tenantId, p_alumnos: alumnos, p_ventana: 8 }),
  ]);
  if (res.error || !res.data?.length) return out; // sin migración 0013 o sin respuestas: sin indicador

  // Preguntas de los quizzes completos de cada curso (la base del porcentaje).
  const cursos = Array.from(new Set((res.data as FilaResumen[]).map((r) => r.curso_id)));
  const totales = new Map<string, number>();
  await Promise.all(
    cursos.map(async (c) => {
      const porModulo = await preguntasPorModulo(db, tenantId, c);
      let n = 0;
      for (const ps of Array.from(porModulo.values())) if (estadoQuiz(ps).completo) n += ps.length;
      totales.set(c, n);
    }),
  );

  // Preguntas en repaso por alumno y curso (misma regla que ve el estudiante).
  const enRepaso = new Map<string, number>();
  if (!rep.error && rep.data?.length) {
    const filas = rep.data as FilaRepaso[];
    for (const alumnoId of alumnos) {
      const suyas = filas.filter((f) => f.alumno_id === alumnoId);
      if (suyas.length === 0) continue;
      const curso = new Map(suyas.map((f) => [f.pregunta_id, f.curso_id]));
      for (const id of Array.from(preguntasEnRepaso(suyas.map((f) => ({ preguntaId: f.pregunta_id, acierto: f.acierto, creadaEn: f.created_at }))))) {
        const k = claveAlumnoCurso(alumnoId, curso.get(id)!);
        enRepaso.set(k, (enRepaso.get(k) ?? 0) + 1);
      }
    }
  }

  for (const r of res.data as FilaResumen[]) {
    const k = claveAlumnoCurso(r.alumno_id, r.curso_id);
    out.set(k, {
      dominio: calcularDominio(totales.get(r.curso_id) ?? 0, r.respondidas, enRepaso.get(k) ?? 0),
      xpQuiz: r.respondidas * XP_RESPONDER + r.aciertos_primer_intento * XP_ACIERTO,
    });
  }
  return out;
}
