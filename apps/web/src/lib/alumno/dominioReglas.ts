// Dominio del curso (ADR 025): preguntas dominadas ÷ preguntas de los quizzes completos.
// Dominada = respondida y que no esté hoy en repaso (falló y aún no la «aprende»).

export interface Dominio {
  dominadas: number;
  total: number;
  /** 0–100. */
  pct: number;
}

/** null si el curso no tiene quiz o el estudiante aún no respondió nada (no se inventa un 0 %). */
export function calcularDominio(total: number, respondidas: number, enRepaso: number): Dominio | null {
  if (total <= 0 || respondidas <= 0) return null;
  const dominadas = Math.max(0, Math.min(total, respondidas - enRepaso));
  return { dominadas, total, pct: Math.round((dominadas / total) * 100) };
}
