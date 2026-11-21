// Reglas puras del Inicio del creador: actividad reciente por alumno, dominio medio y
// quién necesita ayuda. Sin base de datos: la carga vive en actividadReciente.ts.
import type { FilaInscripcion } from "./inscripciones";

/** Dominio bajo: menos de este % de las preguntas dominadas. */
export const DOMINIO_BAJO = 60;
/** Acierto bajo en una sesión de quiz (marca el ítem como alerta). */
export const ACIERTO_BAJO = 60;

export type TipoActividad = "leccion" | "quiz" | "curso" | "inscripcion" | "pago" | "tarea";
export type TonoActividad = "ok" | "alerta" | "neutro";

export interface ItemActividad {
  id: string;
  alumnoId: string;
  alumno: string;
  tipo: TipoActividad;
  /** Frase después del nombre: «completó la lección X». */
  texto: string;
  /** Dato extra (p. ej. «4 de 5 correctas»). */
  detalle: string | null;
  tono: TonoActividad;
  fecha: string;
}

export interface EventoCrudo {
  id: string;
  alumnoId: string;
  cursoId: string | null;
  tipo: string;
  entidadId: string | null;
  fecha: string;
}
export interface RespuestaCruda {
  alumnoId: string;
  moduloId: string;
  acierto: boolean;
  fecha: string;
}
export interface EntregaCruda {
  id: string;
  alumnoId: string;
  tareaId: string;
  numero: number;
  fecha: string;
}
export interface Titulos {
  alumnos: Map<string, string>;
  cursos: Map<string, string>;
  lecciones: Map<string, string>;
  modulos: Map<string, string>;
  tareas: Map<string, string>;
}

const dia = (iso: string) => iso.slice(0, 10);
const comillas = (t: string | undefined, resp: string) => (t ? `«${t}»` : resp);

/**
 * Une eventos, respuestas de quiz y entregas en un feed ordenado (lo más nuevo primero).
 * Las respuestas de un quiz se registran una por una: se agrupan por alumno, módulo y día
 * en un solo ítem con su acierto.
 */
export function armarActividad(
  eventos: EventoCrudo[],
  respuestas: RespuestaCruda[],
  entregas: EntregaCruda[],
  t: Titulos,
  limite = 20,
): ItemActividad[] {
  const items: ItemActividad[] = [];
  const nombre = (id: string) => t.alumnos.get(id) ?? "Un estudiante";

  const quizVisto = new Set<string>();
  for (const e of eventos) {
    switch (e.tipo) {
      case "leccion_completada":
        items.push({
          id: e.id, alumnoId: e.alumnoId, alumno: nombre(e.alumnoId), tipo: "leccion",
          texto: `completó ${comillas(t.lecciones.get(e.entidadId ?? ""), "una lección")}`,
          detalle: null, tono: "neutro", fecha: e.fecha,
        });
        break;
      case "curso_completado":
        items.push({
          id: e.id, alumnoId: e.alumnoId, alumno: nombre(e.alumnoId), tipo: "curso",
          texto: `terminó el curso ${comillas(t.cursos.get(e.cursoId ?? ""), "")}`.trim(),
          detalle: null, tono: "ok", fecha: e.fecha,
        });
        break;
      case "inscripcion_activada":
        items.push({
          id: e.id, alumnoId: e.alumnoId, alumno: nombre(e.alumnoId), tipo: "inscripcion",
          texto: `se inscribió en ${comillas(t.cursos.get(e.cursoId ?? ""), "un curso")}`,
          detalle: null, tono: "neutro", fecha: e.fecha,
        });
        break;
      case "pago_registrado":
        items.push({
          id: e.id, alumnoId: e.alumnoId, alumno: nombre(e.alumnoId), tipo: "pago",
          texto: `pagó ${comillas(t.cursos.get(e.cursoId ?? ""), "un curso")}`,
          detalle: "Mercado Pago", tono: "ok", fecha: e.fecha,
        });
        break;
      case "intento_quiz": {
        const modulo = e.entidadId ?? "";
        const clave = `${e.alumnoId}:${modulo}:${dia(e.fecha)}`;
        if (quizVisto.has(clave)) break; // ya hay un ítem más nuevo de esta sesión
        quizVisto.add(clave);
        const suyas = respuestas.filter((r) => r.alumnoId === e.alumnoId && r.moduloId === modulo && dia(r.fecha) === dia(e.fecha));
        const bien = suyas.filter((r) => r.acierto).length;
        const pct = suyas.length ? Math.round((bien / suyas.length) * 100) : null;
        items.push({
          id: e.id, alumnoId: e.alumnoId, alumno: nombre(e.alumnoId), tipo: "quiz",
          texto: `practicó el quiz de ${comillas(t.modulos.get(modulo), "un módulo")}`,
          detalle: suyas.length ? `${bien} de ${suyas.length} correctas` : null,
          tono: pct === null ? "neutro" : pct < ACIERTO_BAJO ? "alerta" : "ok",
          fecha: e.fecha,
        });
        break;
      }
    }
  }
  for (const en of entregas) {
    items.push({
      id: en.id, alumnoId: en.alumnoId, alumno: nombre(en.alumnoId), tipo: "tarea",
      texto: `${en.numero > 1 ? "reenvió" : "envió"} la tarea ${comillas(t.tareas.get(en.tareaId), "")}`.trim(),
      detalle: null, tono: "neutro", fecha: en.fecha,
    });
  }
  return items.sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, limite);
}

/** Promedio del % de dominio de las inscripciones activas que ya tienen dominio; null si ninguna. */
export function dominioMedio(insc: FilaInscripcion[]): number | null {
  const con = insc.filter((i) => i.estado === "activa" && i.dominio);
  if (!con.length) return null;
  return Math.round(con.reduce((s, i) => s + i.dominio!.pct, 0) / con.length);
}

/** Dominio alto: este % o más de las preguntas dominadas. */
export const DOMINIO_ALTO = 80;

export interface AlumnoEnRiesgo {
  alumnoId: string;
  alumno: string;
  correo: string;
  /** Cursos en riesgo de este alumno (sin repetir). */
  cursos: string[];
  /** Motivo de la inscripción más urgente. */
  motivo: string;
  dominioBajo: boolean;
  sinEntrar: boolean;
  /** Mayor = más urgente. */
  gravedad: number;
}

/**
 * Estudiantes (no inscripciones) que necesitan al creador: dominio bajo (aprende poco) o 7+ días
 * sin entrar (se está yendo) en alguna inscripción activa. Un estudiante en dos cursos cuenta una
 * vez, con su motivo más urgente; así «Necesitan ayuda» nunca supera a «Estudiantes activos».
 */
export function necesitanAyuda(insc: FilaInscripcion[]): AlumnoEnRiesgo[] {
  const porAlumno = new Map<string, AlumnoEnRiesgo>();
  for (const i of insc) {
    if (i.estado !== "activa") continue;
    const bajo = i.dominio !== null && i.dominio.pct < DOMINIO_BAJO;
    if (!bajo && !i.sinActividad) continue;
    const motivos: string[] = [];
    if (bajo) motivos.push(`domina ${i.dominio!.pct} % (${i.dominio!.dominadas} de ${i.dominio!.total} preguntas)`);
    if (i.sinActividad) motivos.push(i.ultimaActividad ? "7 días o más sin entrar" : "no ha entrado al curso");
    const gravedad = (bajo ? 2 : 0) + (i.sinActividad ? 1 : 0) + (bajo ? (DOMINIO_BAJO - i.dominio!.pct) / 100 : 0);
    const previo = porAlumno.get(i.alumnoId);
    if (!previo) {
      porAlumno.set(i.alumnoId, {
        alumnoId: i.alumnoId, alumno: i.nombre, correo: i.correo, cursos: [i.cursoTitulo],
        motivo: motivos.join(" · "), dominioBajo: bajo, sinEntrar: i.sinActividad, gravedad,
      });
      continue;
    }
    if (!previo.cursos.includes(i.cursoTitulo)) previo.cursos.push(i.cursoTitulo);
    previo.dominioBajo ||= bajo;
    previo.sinEntrar ||= i.sinActividad;
    if (gravedad > previo.gravedad) {
      previo.gravedad = gravedad;
      previo.motivo = motivos.join(" · ");
    }
  }
  return Array.from(porAlumno.values()).sort((a, b) => b.gravedad - a.gravedad);
}

export interface DistribucionAvance {
  terminaron: number;
  enProgreso: number;
  sinIniciar: number;
  total: number;
}

/** Inscripciones activas según avance: 100 % terminaron, 0 % sin iniciar, el resto en progreso. */
export function distribucionAvance(insc: FilaInscripcion[]): DistribucionAvance {
  const d = { terminaron: 0, enProgreso: 0, sinIniciar: 0, total: 0 };
  for (const i of insc) {
    if (i.estado !== "activa") continue;
    d.total += 1;
    if (i.avance >= 100) d.terminaron += 1;
    else if (i.avance <= 0) d.sinIniciar += 1;
    else d.enProgreso += 1;
  }
  return d;
}

export interface DistribucionDominio {
  bajo: number;
  medio: number;
  alto: number;
  sinQuiz: number;
  total: number;
}

/** Inscripciones activas según dominio: bajo (< 60 %), medio, alto (≥ 80 %) o sin quiz respondido. */
export function distribucionDominio(insc: FilaInscripcion[]): DistribucionDominio {
  const d = { bajo: 0, medio: 0, alto: 0, sinQuiz: 0, total: 0 };
  for (const i of insc) {
    if (i.estado !== "activa") continue;
    d.total += 1;
    if (!i.dominio) d.sinQuiz += 1;
    else if (i.dominio.pct < DOMINIO_BAJO) d.bajo += 1;
    else if (i.dominio.pct >= DOMINIO_ALTO) d.alto += 1;
    else d.medio += 1;
  }
  return d;
}

/** Estudiantes con inscripción activa por curso, el curso con más primero. */
export function estudiantesPorCurso(insc: FilaInscripcion[]): { cursoId: string; curso: string; n: number }[] {
  const m = new Map<string, { cursoId: string; curso: string; alumnos: Set<string> }>();
  for (const i of insc) {
    if (i.estado !== "activa") continue;
    const g = m.get(i.cursoId) ?? { cursoId: i.cursoId, curso: i.cursoTitulo, alumnos: new Set<string>() };
    g.alumnos.add(i.alumnoId);
    m.set(i.cursoId, g);
  }
  return Array.from(m.values(), (g) => ({ cursoId: g.cursoId, curso: g.curso, n: g.alumnos.size })).sort((a, b) => b.n - a.n);
}

export interface ActividadAlumno {
  alumnoId: string;
  alumno: string;
  /** Su acción más reciente. */
  ultima: ItemActividad;
  /** Cuántas acciones más tiene en el feed. */
  mas: number;
}

/** Una fila por estudiante (su última acción + cuántas más), los más recientes primero. */
export function agruparPorAlumno(items: ItemActividad[], maxAlumnos = 5): ActividadAlumno[] {
  const grupos = new Map<string, ActividadAlumno>();
  const ordenados = [...items].sort((a, b) => b.fecha.localeCompare(a.fecha));
  for (const it of ordenados) {
    const g = grupos.get(it.alumnoId);
    if (g) g.mas += 1;
    else grupos.set(it.alumnoId, { alumnoId: it.alumnoId, alumno: it.alumno, ultima: it, mas: 0 });
  }
  return Array.from(grupos.values()).slice(0, maxAlumnos);
}

export interface TemaDificil {
  moduloId: string;
  /** Acierto al primer intento, 0–100. */
  acierto: number;
  respuestas: number;
  alumnos: number;
}

/** Mínimo de respuestas para opinar de un módulo (con 1 o 2 el % no dice nada). */
export const MIN_RESPUESTAS_TEMA = 5;

/** Módulos con menor acierto al primer intento, solo los bajo `umbral`; los peores primero. */
export function temasConDificultad(
  respuestas: { moduloId: string; alumnoId: string; acierto: boolean }[],
  umbral = 70,
  max = 3,
): TemaDificil[] {
  const grupos = new Map<string, { bien: number; n: number; alumnos: Set<string> }>();
  for (const r of respuestas) {
    const g = grupos.get(r.moduloId) ?? { bien: 0, n: 0, alumnos: new Set<string>() };
    g.n += 1;
    if (r.acierto) g.bien += 1;
    g.alumnos.add(r.alumnoId);
    grupos.set(r.moduloId, g);
  }
  return Array.from(grupos, ([moduloId, g]) => ({
    moduloId,
    acierto: Math.round((g.bien / g.n) * 100),
    respuestas: g.n,
    alumnos: g.alumnos.size,
  }))
    .filter((t) => t.respuestas >= MIN_RESPUESTAS_TEMA && t.acierto < umbral)
    .sort((a, b) => a.acierto - b.acierto)
    .slice(0, max);
}

/** «hace 5 min», «hace 3 h», «ayer», «hace 4 días», o la fecha corta. */
export function haceCuanto(iso: string, ahora: number): string {
  const min = Math.max(0, Math.round((ahora - new Date(iso).getTime()) / 60000));
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return "ayer";
  if (d < 7) return `hace ${d} días`;
  return new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}
