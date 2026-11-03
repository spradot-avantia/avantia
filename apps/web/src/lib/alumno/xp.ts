// XP, niveles y avance del estudiante (puro). Reglas: "Reglas de gamificación
// estructural" del Mapa General (docs/2026-11-03 Creador y Alumno). Todo se
// DERIVA del progreso guardado: no hay tabla de XP que pueda desfasarse y
// fallar nunca descuenta. Fuera de esta versión (aún no hay tablas): XP por
// actividad, quiz y repaso espaciado.

export const XP_LECCION = 10;
export const XP_MODULO = 20;
export const XP_CURSO = 50;

export const NIVELES: ReadonlyArray<{ nivel: number; desde: number }> = [
  { nivel: 1, desde: 0 },
  { nivel: 2, desde: 100 },
  { nivel: 3, desde: 250 },
  { nivel: 4, desde: 450 },
  { nivel: 5, desde: 700 },
];

export interface EstructuraXp {
  modulos: { lecciones: { id: string }[] }[];
}

export interface DesgloseXp {
  xp: number;
  lecciones: number;
  modulosCompletos: number;
  cursoCompleto: boolean;
  totalLecciones: number;
}

export function calcularXp(curso: EstructuraXp, completadas: ReadonlySet<string>): DesgloseXp {
  let lecciones = 0;
  let modulosCompletos = 0;
  let total = 0;
  for (const m of curso.modulos) {
    const hechas = m.lecciones.filter((l) => completadas.has(l.id)).length;
    lecciones += hechas;
    total += m.lecciones.length;
    if (m.lecciones.length > 0 && hechas === m.lecciones.length) modulosCompletos += 1;
  }
  const cursoCompleto = total > 0 && lecciones === total;
  const xp = lecciones * XP_LECCION + modulosCompletos * XP_MODULO + (cursoCompleto ? XP_CURSO : 0);
  return { xp, lecciones, modulosCompletos, cursoCompleto, totalLecciones: total };
}

export interface InfoNivel {
  nivel: number;
  /** XP que faltan para el siguiente nivel; null en el máximo. */
  faltan: number | null;
  /** 0 a 100 dentro del nivel actual. */
  pct: number;
  siguiente: number | null;
}

export function nivelDe(xp: number): InfoNivel {
  let actual = NIVELES[0];
  for (const n of NIVELES) if (xp >= n.desde) actual = n;
  const sig = NIVELES.find((n) => n.nivel === actual.nivel + 1) ?? null;
  if (!sig) return { nivel: actual.nivel, faltan: null, pct: 100, siguiente: null };
  const pct = Math.min(100, Math.round(((xp - actual.desde) / (sig.desde - actual.desde)) * 100));
  return { nivel: actual.nivel, faltan: sig.desde - xp, pct, siguiente: sig.nivel };
}

export function porcentaje(parte: number, total: number): number {
  return total <= 0 ? 0 : Math.round((parte / total) * 100);
}
