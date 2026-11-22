// Ritmo por módulo de cada estudiante: cuánto tiempo activo le tomó y cómo le fue en el quiz al
// primer intento. Cruzado con el resto de la clase detecta a quien «avanza rápido sin dominar»:
// completa el módulo en mucho menos tiempo que sus compañeros y falla el repaso. Sin base de datos.

/** Rápido = menos de esta fracción de la mediana del módulo en el curso. */
export const FACTOR_RAPIDO = 0.5;
/** Mínimo de estudiantes con el módulo completo y tiempo medido para comparar contra la mediana. */
export const MIN_COMPARABLES = 3;
/** Acierto al primer intento bajo (%): bajo esto el módulo no está dominado. */
export const ACIERTO_MODULO_BAJO = 60;

export interface ModuloRitmo {
  moduloId: string;
  titulo: string;
  /** Todas sus lecciones completadas (y tiene al menos una). */
  completo: boolean;
  /** Tiempo activo en sus lecciones más el tiempo respondiendo el quiz al primer intento. */
  activoSeg: number;
  /** Preguntas del quiz respondidas al primer intento y cuántas acertó. */
  respondidas: number;
  aciertos: number;
}

export interface AvanceSinDominio {
  moduloId: string;
  moduloTitulo: string;
  activoSeg: number;
  medianaSeg: number;
  aciertos: number;
  respondidas: number;
}

export interface ModuloEstructura {
  id: string;
  titulo: string;
  leccionIds: string[];
}
export interface RespuestaRitmo {
  moduloId: string;
  acierto: boolean;
  /** Solo cuentan las del primer intento: los reintentos del repaso no miden lo que sabía. */
  primerIntento: boolean;
  duracionMs: number | null;
}

/** Ritmo de un estudiante en cada módulo de un curso, en el orden recibido. */
export function ritmoPorModulo(
  modulos: ModuloEstructura[],
  completadas: Set<string>,
  segPorLeccion: Map<string, number>,
  respuestas: RespuestaRitmo[],
): ModuloRitmo[] {
  return modulos.map((m) => {
    const primeras = respuestas.filter((r) => r.moduloId === m.id && r.primerIntento);
    const segLecciones = m.leccionIds.reduce((s, id) => s + (segPorLeccion.get(id) ?? 0), 0);
    const segQuiz = primeras.reduce((s, r) => s + (r.duracionMs ?? 0), 0) / 1000;
    return {
      moduloId: m.id,
      titulo: m.titulo,
      completo: m.leccionIds.length > 0 && m.leccionIds.every((id) => completadas.has(id)),
      activoSeg: Math.round(segLecciones + segQuiz),
      respondidas: primeras.length,
      aciertos: primeras.filter((r) => r.acierto).length,
    };
  });
}

function mediana(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * Para cada inscripción (por `clave`), el módulo donde avanzó rápido sin dominar, o null.
 * Rápido: completo y con menos de FACTOR_RAPIDO × la mediana de quienes lo completaron en ese curso
 * (se necesitan MIN_COMPARABLES). Sin dominar: respondió el quiz y acertó menos de
 * ACIERTO_MODULO_BAJO % al primer intento. Un tiempo 0 es «sin medición», no «rápido».
 * Si hay varios módulos así, gana el de menor acierto (y luego el más rápido respecto de la mediana).
 */
export function avanceSinDominio(
  inscripciones: { clave: string; cursoId: string; modulos: ModuloRitmo[] }[],
): Map<string, AvanceSinDominio | null> {
  const tiempos = new Map<string, number[]>();
  for (const i of inscripciones) {
    for (const m of i.modulos) {
      if (!m.completo || m.activoSeg <= 0) continue;
      const k = `${i.cursoId}:${m.moduloId}`;
      (tiempos.get(k) ?? tiempos.set(k, []).get(k)!).push(m.activoSeg);
    }
  }
  const medianas = new Map<string, number>();
  tiempos.forEach((ts, k) => {
    if (ts.length >= MIN_COMPARABLES) medianas.set(k, mediana(ts));
  });

  const out = new Map<string, AvanceSinDominio | null>();
  for (const i of inscripciones) {
    let peor: { v: AvanceSinDominio; pct: number; ratio: number } | null = null;
    for (const m of i.modulos) {
      const med = medianas.get(`${i.cursoId}:${m.moduloId}`);
      if (!med || !m.completo || m.activoSeg <= 0 || m.respondidas === 0) continue;
      const pct = (m.aciertos / m.respondidas) * 100;
      const ratio = m.activoSeg / med;
      if (ratio >= FACTOR_RAPIDO || pct >= ACIERTO_MODULO_BAJO) continue;
      if (!peor || pct < peor.pct || (pct === peor.pct && ratio < peor.ratio)) {
        const v = { moduloId: m.moduloId, moduloTitulo: m.titulo, activoSeg: m.activoSeg, medianaSeg: med, aciertos: m.aciertos, respondidas: m.respondidas };
        peor = { v, pct, ratio };
      }
    }
    out.set(i.clave, peor?.v ?? null);
  }
  return out;
}

/** «45 s», «4 min», «1 h 10 min». */
export function duracionCorta(seg: number): string {
  if (seg < 60) return `${Math.max(0, Math.round(seg))} s`;
  const min = Math.round(seg / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return min % 60 ? `${h} h ${min % 60} min` : `${h} h`;
}
