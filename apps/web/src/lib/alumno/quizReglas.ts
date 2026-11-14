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

export interface FilaRespuesta {
  pregunta_id: string;
  acierto: boolean;
  primer_intento: boolean;
}

/**
 * Estado de un módulo a partir de TODAS las respuestas guardadas del alumno (no solo las de la
 * pasada actual): «dominado» exige haber respondido todo y 80 % o más de aciertos al primer intento.
 * Es la única fuente de verdad: la insignia de /progreso y el mensaje final del quiz usan esto.
 */
export function estadoDeModulo(moduloId: string, total: number, filas: Iterable<FilaRespuesta>): EstadoQuizModulo {
  const lista = Array.from(filas);
  const respondidas = new Set(lista.map((r) => r.pregunta_id)).size;
  const aciertosPrimerIntento = lista.filter((r) => r.primer_intento && r.acierto).length;
  return {
    moduloId,
    total,
    respondidas,
    aciertosPrimerIntento,
    dominado: total > 0 && respondidas >= total && aciertosPrimerIntento / total >= UMBRAL_DOMINADO,
  };
}

/** XP del quiz: +5 por pregunta respondida (una vez) y +5 por acierto al primer intento. */
export function xpDeQuiz(estados: Iterable<EstadoQuizModulo>): number {
  let xp = 0;
  for (const e of estados) xp += e.respondidas * XP_RESPONDER + e.aciertosPrimerIntento * XP_ACIERTO;
  return xp;
}

