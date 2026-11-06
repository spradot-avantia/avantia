// Reglas puras de los materiales que ve el alumno (ADR 029 F3 y ADR 030). Sin acceso a datos:
// deciden qué materiales se muestran, cuáles puede abrir y cómo se rotulan.
import { extensionDe, formatearBytes } from "../creador/archivosReglas";

/** Lo único que el alumno recibe de un material: nunca la ruta interna del archivo. */
export interface MaterialAlumno {
  id: string;
  moduloId: string;
  /** null = material del módulo; con valor = de esa lección. */
  leccionId: string | null;
  titulo: string;
  nota: string | null;
  origen: "enlace" | "archivo";
  /** Solo en materiales de origen «enlace». */
  url: string | null;
  archivoNombre: string | null;
  mime: string | null;
  bytes: number | null;
}

/** Fila cruda tal como sale de la base (incluye la ruta, que NO se reenvía). */
export interface FilaMaterial {
  id: string;
  modulo_id: string;
  leccion_id: string | null;
  titulo: string;
  nota: string | null;
  origen: string;
  url: string | null;
  storage_path: string | null;
  archivo_nombre: string | null;
  mime: string | null;
  bytes: number | null;
}

/** Un material incompleto (enlace sin URL, archivo sin objeto) no se muestra al alumno. */
export function esCompleto(f: FilaMaterial): boolean {
  if (f.origen === "enlace") return !!f.url && /^https:\/\//.test(f.url);
  if (f.origen === "archivo") return !!f.storage_path;
  return false;
}

export function aMaterialAlumno(f: FilaMaterial): MaterialAlumno {
  const archivo = f.origen === "archivo";
  return {
    id: f.id,
    moduloId: f.modulo_id,
    leccionId: f.leccion_id,
    titulo: f.titulo,
    nota: f.nota,
    origen: archivo ? "archivo" : "enlace",
    url: archivo ? null : f.url,
    archivoNombre: archivo ? f.archivo_nombre : null,
    mime: archivo ? f.mime : null,
    bytes: archivo ? f.bytes : null,
  };
}

/** Materiales que se muestran en la lección: los de su módulo y los de la propia lección. */
export function materialesDeLeccion(todos: MaterialAlumno[], moduloId: string, leccionId: string) {
  return {
    delModulo: todos.filter((m) => m.moduloId === moduloId && m.leccionId === null),
    deLaLeccion: todos.filter((m) => m.leccionId === leccionId),
  };
}

const NOMBRE_TIPO: Readonly<Record<string, string>> = {
  pdf: "PDF",
  png: "Imagen",
  jpg: "Imagen",
  jpeg: "Imagen",
  webp: "Imagen",
  txt: "Texto",
  docx: "Word",
  xlsx: "Excel",
  pptx: "PowerPoint",
};

/** Rótulo corto bajo el material: «PDF · 2,4 MB» para un archivo, «Enlace externo» para un enlace. */
export function rotuloMaterial(m: Pick<MaterialAlumno, "origen" | "archivoNombre" | "bytes">): string {
  if (m.origen === "enlace") return "Enlace externo";
  const tipo = NOMBRE_TIPO[extensionDe(m.archivoNombre ?? "")] ?? "Archivo";
  return m.bytes ? `${tipo} · ${formatearBytes(m.bytes)}` : tipo;
}

/** Destino del clic: el enlace tal cual, o la ruta del servidor que firma el archivo. */
export function hrefMaterial(m: MaterialAlumno, cursoId: string): string | null {
  if (m.origen === "enlace") return m.url;
  return `/aprender/${cursoId}/material/${m.id}`;
}

export interface LeccionLiberable {
  id: string;
  moduloId: string;
  liberada: boolean;
}

/**
 * ¿Puede abrir este material? Un material de lección exige que esa lección esté liberada; uno de
 * módulo, que al menos una lección del módulo lo esté (se muestra dentro de las lecciones).
 * Oculta en la pantalla no basta: el servidor repite esta comprobación al firmar el archivo.
 */
export function puedeAbrirMaterial(
  m: Pick<MaterialAlumno, "moduloId" | "leccionId">,
  lecciones: LeccionLiberable[],
): boolean {
  if (m.leccionId) return lecciones.some((l) => l.id === m.leccionId && l.moduloId === m.moduloId && l.liberada);
  return lecciones.some((l) => l.moduloId === m.moduloId && l.liberada);
}
