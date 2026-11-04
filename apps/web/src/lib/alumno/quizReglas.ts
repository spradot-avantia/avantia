// Reglas puras del quiz del estudiante (ADR 023): XP y umbral de «Módulo dominado».

export const XP_RESPONDER = 5;
export const XP_ACIERTO = 5;
export const UMBRAL_DOMINADO = 0.8;

export interface EstadoQuizModulo {
  moduloId: string;
  total: number;
  /** Preguntas distintas respondidas alguna vez. */
  respondidas: number;
  /** Aciertos al primer intento. */
  aciertosPrimerIntento: number;
  dominado: boolean;
}

/** XP del quiz: +5 por pregunta respondida (una vez) y +5 por acierto al primer intento. */
export function xpDeQuiz(estados: Iterable<EstadoQuizModulo>): number {
  let xp = 0;
  for (const e of estados) xp += e.respondidas * XP_RESPONDER + e.aciertosPrimerIntento * XP_ACIERTO;
  return xp;
}

