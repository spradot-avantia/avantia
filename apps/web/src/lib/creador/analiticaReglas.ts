// Reglas puras de la analítica de aprendizaje del creador (ADR 040): sin acceso a datos.
// Cada función recibe filas ya filtradas por tenant y curso.

export function mediana(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : null);

/* ---------- Aprendizaje: embudo por lección ---------- */
export interface LeccionBase {
  id: string;
  titulo: string;
  moduloTitulo: string;
  /** Orden global dentro del curso. */
  orden: number;
}
export interface FilaLeccion {
  leccionId: string;
  titulo: string;
  modulo: string;
  /** Alumnos que abrieron la lección (tienen fila de progreso). */
  abrieron: number;
  completaron: number;
  /** 0–100: de los que abrieron, los que no la completaron; null si nadie la abrió. */
  abandono: number | null;
  /** Mediana de segundos de tiempo activo por visita; null sin mediciones. */
  tiempoMedianoSeg: number | null;
}

export function embudoPorLeccion(
  lecciones: LeccionBase[],
  progreso: { leccionId: string; alumnoId: string; completada: boolean }[],
  tiempos: { leccionId: string; activoSeg: number }[],
): FilaLeccion[] {
  return [...lecciones]
    .sort((a, b) => a.orden - b.orden)
    .map((l) => {
      const p = progreso.filter((x) => x.leccionId === l.id);
      const abrieron = new Set(p.map((x) => x.alumnoId)).size;
      const completaron = new Set(p.filter((x) => x.completada).map((x) => x.alumnoId)).size;
      const t = tiempos.filter((x) => x.leccionId === l.id && x.activoSeg > 0).map((x) => x.activoSeg);
      return {
        leccionId: l.id,
        titulo: l.titulo,
        modulo: l.moduloTitulo,
        abrieron,
        completaron,
        abandono: abrieron > 0 ? 100 - (pct(completaron, abrieron) ?? 0) : null,
        tiempoMedianoSeg: mediana(t),
      };
    });
}

/* ---------- Evaluación: preguntas ---------- */
export interface FilaPregunta {
  preguntaId: string;
  texto: string;
  modulo: string;
  alumnos: number;
  /** 0–100 sobre primeros intentos; null sin respuestas. */
  acierto: number | null;
  tiempoMedianoSeg: number | null;
  /** Respuestas por alumno por encima de la primera (promedio). */
  reintentos: number;
}

export function resultadosPorPregunta(
  preguntas: { id: string; texto: string; moduloTitulo: string; orden: number }[],
  respuestas: { preguntaId: string; alumnoId: string; acierto: boolean; primerIntento: boolean; duracionMs: number | null }[],
): FilaPregunta[] {
  return [...preguntas]
    .sort((a, b) => a.orden - b.orden)
    .map((q) => {
      const r = respuestas.filter((x) => x.preguntaId === q.id);
      const primeros = r.filter((x) => x.primerIntento);
      const alumnos = new Set(r.map((x) => x.alumnoId)).size;
      const ms = primeros.filter((x) => x.duracionMs != null).map((x) => x.duracionMs as number);
      const med = mediana(ms);
      return {
        preguntaId: q.id,
        texto: q.texto,
        modulo: q.moduloTitulo,
        alumnos,
        acierto: pct(primeros.filter((x) => x.acierto).length, primeros.length),
        tiempoMedianoSeg: med == null ? null : Math.round(med / 1000),
        reintentos: alumnos > 0 ? Math.round(((r.length - alumnos) / alumnos) * 10) / 10 : 0,
      };
    });
}

/* ---------- Evaluación: tareas ---------- */
export interface FilaTarea {
  tareaId: string;
  titulo: string;
  /** Alumnos distintos que entregaron. */
  entregaron: number;
  /** Inscritos activos al curso. */
  inscritos: number;
  /** Alumnos que enviaron más de una versión. */
  conReenvio: number;
  /** Mediana de horas entre abrir la lección y la primera entrega; null sin datos. */
  horasMedianas: number | null;
}

export function resumenTareas(
  tareas: { id: string; titulo: string; leccionId: string }[],
  entregas: { tareaId: string; alumnoId: string; numero: number; enviadaAt: string }[],
  aperturas: { leccionId: string; alumnoId: string; at: string }[],
  inscritos: number,
): FilaTarea[] {
  return tareas.map((t) => {
    const e = entregas.filter((x) => x.tareaId === t.id);
    const horas: number[] = [];
    for (const primera of e.filter((x) => x.numero === 1)) {
      const aperturas1 = aperturas
        .filter((a) => a.leccionId === t.leccionId && a.alumnoId === primera.alumnoId)
        .map((a) => new Date(a.at).getTime());
      if (aperturas1.length === 0) continue;
      const h = (new Date(primera.enviadaAt).getTime() - Math.min(...aperturas1)) / 3_600_000;
      if (h >= 0) horas.push(Math.round(h * 10) / 10);
    }
    return {
      tareaId: t.id,
      titulo: t.titulo,
      entregaron: new Set(e.map((x) => x.alumnoId)).size,
      inscritos,
      conReenvio: new Set(e.filter((x) => x.numero > 1).map((x) => x.alumnoId)).size,
      horasMedianas: mediana(horas),
    };
  });
}

/* ---------- Retención: cohortes semanales ---------- */
const SEMANA_MS = 7 * 24 * 3_600_000;

/** Lunes 00:00 UTC de la semana de `t`. */
export function inicioDeSemana(t: number): number {
  const d = new Date(t);
  const dia = (d.getUTCDay() + 6) % 7;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - dia * 24 * 3_600_000;
}

export interface FilaCohorte {
  semanaInicio: string; // AAAA-MM-DD
  alumnos: number;
  /** Retención en las semanas +1 a +4: 0–100, o null si esa semana aún no termina. */
  retencion: (number | null)[];
}

export function cohortesSemanales(
  inscritos: { alumnoId: string; desde: string }[],
  actividad: Map<string, number[]>,
  ahora: number,
  maxCohortes = 8,
): FilaCohorte[] {
  const porSemana = new Map<number, Set<string>>();
  for (const i of inscritos) {
    const s = inicioDeSemana(new Date(i.desde).getTime());
    if (!porSemana.has(s)) porSemana.set(s, new Set());
    porSemana.get(s)!.add(i.alumnoId);
  }
  return [...porSemana.entries()]
    .sort((a, b) => b[0] - a[0])
    .slice(0, maxCohortes)
    .map(([semana, alumnos]) => ({
      semanaInicio: new Date(semana).toISOString().slice(0, 10),
      alumnos: alumnos.size,
      retencion: [1, 2, 3, 4].map((n) => {
        const desde = semana + n * SEMANA_MS;
        if (desde + SEMANA_MS > ahora) return null;
        const volvieron = [...alumnos].filter((a) => (actividad.get(a) ?? []).some((t) => t >= desde && t < desde + SEMANA_MS)).length;
        return pct(volvieron, alumnos.size);
      }),
    }));
}

/** Alumnos activos sin actividad hace `dias` días o más. */
export function sinActividadHace(ultima: (string | null)[], dias: number, ahora: number): number {
  const limite = ahora - dias * 24 * 3_600_000;
  return ultima.filter((u) => !u || new Date(u).getTime() < limite).length;
}

/* ---------- Exportación CSV (RQ-27) ---------- */
/** Escapa una celda y neutraliza fórmulas de hoja de cálculo (= + - @). */
export function celdaCsv(v: string | number | null): string {
  if (v === null || v === undefined) return "";
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export function aCsv(encabezados: string[], filas: (string | number | null)[][]): string {
  return "﻿" + [encabezados, ...filas].map((f) => f.map(celdaCsv).join(",")).join("\r\n") + "\r\n";
}

/* ---------- Resúmenes por módulo (vista compacta del panel) ---------- */
export interface FilaModulo {
  modulo: string;
  lecciones: FilaLeccion[];
  abrieron: number;
  completaron: number;
  /** 0–100 sobre lo abierto; null si nadie abrió nada del módulo. */
  abandono: number | null;
}

/** Agrupa las lecciones por módulo (en orden de aparición) y suma aperturas y completadas. */
export function resumenPorModulo(lecciones: FilaLeccion[]): FilaModulo[] {
  const orden: string[] = [];
  const grupos = new Map<string, FilaLeccion[]>();
  for (const l of lecciones) {
    if (!grupos.has(l.modulo)) {
      grupos.set(l.modulo, []);
      orden.push(l.modulo);
    }
    grupos.get(l.modulo)!.push(l);
  }
  return orden.map((modulo) => {
    const ls = grupos.get(modulo)!;
    const abrieron = ls.reduce((s, l) => s + l.abrieron, 0);
    const completaron = ls.reduce((s, l) => s + l.completaron, 0);
    return { modulo, lecciones: ls, abrieron, completaron, abandono: abrieron > 0 ? 100 - (pct(completaron, abrieron) ?? 0) : null };
  });
}

export interface FilaQuizModulo {
  modulo: string;
  preguntas: FilaPregunta[];
  /** Acierto medio al primer intento, ponderado por alumnos; null sin respuestas. */
  acierto: number | null;
  /** Máximo de alumnos que respondieron alguna pregunta del módulo. */
  alumnos: number;
}

export function resumenQuizPorModulo(preguntas: FilaPregunta[]): FilaQuizModulo[] {
  const orden: string[] = [];
  const grupos = new Map<string, FilaPregunta[]>();
  for (const q of preguntas) {
    if (!grupos.has(q.modulo)) {
      grupos.set(q.modulo, []);
      orden.push(q.modulo);
    }
    grupos.get(q.modulo)!.push(q);
  }
  return orden.map((modulo) => {
    const qs = grupos.get(modulo)!;
    const con = qs.filter((q) => q.acierto != null && q.alumnos > 0);
    const peso = con.reduce((s, q) => s + q.alumnos, 0);
    return {
      modulo,
      preguntas: qs,
      acierto: peso > 0 ? Math.round(con.reduce((s, q) => s + (q.acierto as number) * q.alumnos, 0) / peso) : null,
      alumnos: Math.max(0, ...qs.map((q) => q.alumnos)),
    };
  });
}

/** Avance medio: lecciones completadas sobre las posibles (lecciones × inscritos activos); null sin datos. */
export function avanceMedio(lecciones: FilaLeccion[], inscritosActivos: number): number | null {
  const posibles = lecciones.length * inscritosActivos;
  if (posibles === 0) return null;
  return Math.min(100, Math.round((lecciones.reduce((s, l) => s + l.completaron, 0) / posibles) * 100));
}

/** Acierto medio global al primer intento, ponderado por alumnos. */
export function aciertoMedio(preguntas: FilaPregunta[]): number | null {
  const con = preguntas.filter((q) => q.acierto != null && q.alumnos > 0);
  const peso = con.reduce((s, q) => s + q.alumnos, 0);
  return peso > 0 ? Math.round(con.reduce((s, q) => s + (q.acierto as number) * q.alumnos, 0) / peso) : null;
}
