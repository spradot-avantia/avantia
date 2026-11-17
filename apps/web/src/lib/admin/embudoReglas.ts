// Reglas puras de la analítica de creadores en /admin (ADR 043): sin acceso a datos.
// Reciben un resumen por academia ya armado por `analiticaCreadores.ts`.
import { mediana } from "../creador/analiticaReglas";

export const DIA_MS = 86_400_000;

/** Etapas de la cascada de creación, en orden. La postulación aceptada es previa a la academia. */
export const ETAPAS = [
  { id: "academia", label: "Academia creada" },
  { id: "identidad", label: "Identidad lista" },
  { id: "curso", label: "Primer curso" },
  { id: "contenido", label: "Con lecciones" },
  { id: "publicado", label: "Curso publicado" },
  { id: "alumno", label: "Primer alumno" },
  { id: "pago", label: "Primer pago o activación" },
] as const;
export type EtapaId = (typeof ETAPAS)[number]["id"];

export interface ResumenAcademia {
  tenantId: string;
  nombre: string;
  subdomain: string;
  dueno: string;
  creadaAt: string;
  onboardingAt: string | null;
  dominioPropio: boolean;
  cursosTotal: number;
  cursosPublicados: number;
  leccionesTotal: number;
  primerCursoAt: string | null;
  primerPublicadoAt: string | null;
  primerAlumnoAt: string | null;
  primerPagoAt: string | null;
  /** Alumnos con inscripción activa. */
  alumnos: number;
  /** Alumnos con ingreso en los últimos 30 días. */
  alumnosActivos30: number;
  /** Último login del dueño (auth.users.last_sign_in_at). */
  ultimoLogin: string | null;
  /** Última edición real: máximo updated_at de curso, módulo, lección, academia y página. */
  ultimaEdicion: string | null;
}

/** Índice (0-based) de la última etapa alcanzada en secuencia; la academia ya existe, así que ≥ 0. */
export function indiceEtapa(a: ResumenAcademia): number {
  const cumplidas = [
    true,
    a.onboardingAt !== null,
    a.cursosTotal > 0,
    a.leccionesTotal > 0,
    a.cursosPublicados > 0,
    a.primerAlumnoAt !== null,
    a.primerPagoAt !== null,
  ];
  let i = 0;
  while (i + 1 < cumplidas.length && cumplidas[i + 1]) i++;
  return i;
}

export function etapaDe(a: ResumenAcademia) {
  return ETAPAS[indiceEtapa(a)];
}

const t = (s: string | null) => (s ? new Date(s).getTime() : null);

/** Última señal de vida del creador: la más reciente entre login, edición y alta. */
export function ultimaActividad(a: ResumenAcademia): number {
  return Math.max(t(a.ultimoLogin) ?? 0, t(a.ultimaEdicion) ?? 0, t(a.creadaAt) ?? 0);
}

export function diasDesde(iso: string | number | null, ahora: number): number | null {
  const ms = typeof iso === "string" ? t(iso) : iso;
  if (ms === null || ms === 0) return null;
  return Math.max(0, Math.floor((ahora - ms) / DIA_MS));
}

/** Estancada: no ha llegado a la última etapa y no muestra actividad hace `dias` o más. */
export function estancada(a: ResumenAcademia, ahora: number, dias = 14): boolean {
  if (indiceEtapa(a) >= ETAPAS.length - 1) return false;
  return (diasDesde(ultimaActividad(a), ahora) ?? Infinity) >= dias;
}

export interface FilaEmbudo {
  id: EtapaId | "postulacion";
  label: string;
  cantidad: number;
  /** % respecto de la etapa anterior; null en la primera o si la anterior es 0. */
  pasoPct: number | null;
}

/** Embudo: cuántas academias alcanzaron al menos cada etapa. Antepone las postulaciones aceptadas. */
export function embudo(academias: ResumenAcademia[], aceptadas: number): FilaEmbudo[] {
  const filas: FilaEmbudo[] = [{ id: "postulacion", label: "Postulación aceptada", cantidad: aceptadas, pasoPct: null }];
  const idx = academias.map(indiceEtapa);
  ETAPAS.forEach((e, i) => {
    filas.push({ id: e.id, label: e.label, cantidad: idx.filter((x) => x >= i).length, pasoPct: null });
  });
  for (let i = 1; i < filas.length; i++) {
    const prev = filas[i - 1].cantidad;
    filas[i].pasoPct = prev > 0 ? Math.round((filas[i].cantidad / prev) * 100) : null;
  }
  return filas;
}

/** Días medianos desde el alta de la academia hasta cada hito (solo las que lo alcanzaron). */
export function medianasDias(academias: ResumenAcademia[]) {
  const hasta = (campo: "primerCursoAt" | "primerPublicadoAt" | "primerAlumnoAt" | "primerPagoAt") =>
    mediana(
      academias
        .filter((a) => a[campo])
        .map((a) => Math.max(0, Math.round((new Date(a[campo] as string).getTime() - new Date(a.creadaAt).getTime()) / DIA_MS))),
    );
  return {
    primerCurso: hasta("primerCursoAt"),
    publicado: hasta("primerPublicadoAt"),
    primerAlumno: hasta("primerAlumnoAt"),
    primerPago: hasta("primerPagoAt"),
  };
}

export function kpis(academias: ResumenAcademia[], ahora: number, dias = 14) {
  return {
    academias: academias.length,
    conPublicado: academias.filter((a) => a.cursosPublicados > 0).length,
    conAlumno: academias.filter((a) => a.primerAlumnoAt !== null).length,
    alumnos: academias.reduce((s, a) => s + a.alumnos, 0),
    estancadas: academias.filter((a) => estancada(a, ahora, dias)).length,
  };
}
