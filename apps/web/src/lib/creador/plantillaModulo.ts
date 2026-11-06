// Plantilla de módulo opcional (ADR 032, F3). Sigue la secuencia de Microsoft Learn: introducción,
// contenido, ejercicio y resumen; el quiz de repaso del módulo ocupa el lugar de la evaluación.
// Es una sugerencia que el creador puede renombrar, mover o borrar: crea lecciones de texto vacías.
import type { TipoLeccion } from "./types";

export const PLANTILLA_MODULO: ReadonlyArray<{ titulo: string; tipo: TipoLeccion }> = [
  { titulo: "Introducción", tipo: "texto" },
  { titulo: "Desarrollo", tipo: "texto" },
  { titulo: "Ejercicio", tipo: "texto" },
  { titulo: "Resumen", tipo: "texto" },
];
