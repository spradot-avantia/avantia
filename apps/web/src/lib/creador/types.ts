// Tipos del dominio del Espacio del Creador (camelCase en la app; columnas
// snake_case en la base, ver db/migrations/0001_espacio_creador.sql).

export type LogoModo = "logo_y_nombre" | "solo_logo";
export type EstadoCurso = "borrador" | "publicado";
export type Modalidad = "a_su_ritmo" | "con_fechas";
export type AccesoCurso = "invitados" | "enlace";
export type TipoLeccion = "video" | "texto" | "documento";
export type EstadoInvitacion = "pendiente" | "aceptada" | "revocada";
export type ModoCreacionCurso = "estructura_sugerida" | "desde_cero";

/** Pasos del editor de curso (1-6, ver pantalla 07 del diseño). */
export type PasoEditor =
  | "esencial" // 1 Lo esencial
  | "objetivo" // 2 Objetivo
  | "estructura" // 3 Estructura y contenido
  | "modalidad" // 4 Modalidad y fechas
  | "acceso" // 5 Acceso
  | "revisar"; // 6 Revisar y publicar

export const PASOS_EDITOR: ReadonlyArray<{ id: PasoEditor; numero: number; titulo: string }> = [
  { id: "esencial", numero: 1, titulo: "Lo esencial" },
  { id: "objetivo", numero: 2, titulo: "Objetivo" },
  { id: "estructura", numero: 3, titulo: "Estructura y contenido" },
  { id: "modalidad", numero: 4, titulo: "Modalidad y fechas" },
  { id: "acceso", numero: 5, titulo: "Acceso" },
  { id: "revisar", numero: 6, titulo: "Revisar y publicar" },
];

export interface TenantCreador {
  id: string;
  slug: string;
  subdomain: string;
  customDomain: string | null;
  nombre: string;
  frase: string | null;
  area: string | null;
  colorPrimario: string;
  logoUrl: string | null;
  logoModo: LogoModo;
  pais: string | null;
  moneda: string | null;
  /** false => el creador aún no pasó por /onboarding. */
  onboardingCompletado: boolean;
}

export interface Leccion {
  id: string;
  moduloId: string;
  cursoId: string;
  titulo: string;
  tipo: TipoLeccion;
  contenidoUrl: string | null;
  contenidoTexto: string | null;
  /** Reservado (ADR 005): archivo en bucket privado "materiales"; no se usa en MVP. */
  storagePath: string | null;
  contenidoTipo: string | null;
  orden: number;
}

export interface Modulo {
  id: string;
  cursoId: string;
  titulo: string;
  orden: number;
  lecciones: Leccion[];
}

export interface Curso {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string | null;
  publico: string | null;
  estado: EstadoCurso;
  modalidad: Modalidad;
  fechaInicio: string | null; // YYYY-MM-DD
  fechaTermino: string | null;
  acceso: AccesoCurso;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CursoCompleto extends Curso {
  objetivos: string[];
  modulos: Modulo[];
}

export interface CursoResumen extends Curso {
  totalModulos: number;
  totalLecciones: number;
  totalEstudiantes: number;
}

export interface Invitacion {
  id: string;
  cursoId: string;
  email: string;
  estado: EstadoInvitacion;
  createdAt: string;
}

export interface Bloqueo {
  mensaje: string;
  /** Paso del editor donde se corrige ("Corregir en <paso>"). */
  paso: PasoEditor;
}

export interface ResultadoValidacionPublicacion {
  bloqueos: Bloqueo[];
  recomendaciones: Bloqueo[];
  puedePublicar: boolean;
}

/** Resultado uniforme de repos y Server Actions (serializable). */
export type Resultado<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; campos?: Record<string, string> };

export type CampoCurso =
  | "titulo"
  | "descripcion"
  | "publico"
  | "objetivos"
  | "modalidad"
  | "fechaInicio"
  | "fechaTermino"
  | "acceso";
