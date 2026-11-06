export interface GenerarCursoInput {
  tenantId: string;
  materialCrudo: string;
}

/**
 * Contrato de la salida (ADR 029, F3). Además de la estructura, la IA propone la presentación de
 * cada módulo (descripción, «Qué aprenderás», duración) y la descripción y duración de cada
 * lección. NO propone materiales ni enlaces: esas URLs las aporta el creador. Todo lo que
 * devuelva el modelo debe pasar por `normalizarCursoGenerado` antes de guardarse.
 */
export interface CursoGenerado {
  titulo: string;
  descripcion: string;
  modulos: Array<{
    titulo: string;
    descripcion: string | null;
    objetivos: string[];
    duracionMin: number | null;
    lecciones: Array<{ titulo: string; resumen: string; descripcion: string | null; duracionMin: number | null }>;
  }>;
}

/**
 * Único punto de la app que llama a la API del LLM (Anthropic/OpenAI) para
 * transformar material crudo del profesor en la estructura de un curso.
 * Mantenerlo centralizado acá facilita controlar costos y cambiar de
 * proveedor sin tocar el resto del código.
 */
export async function generarCursoDesdeMaterial(
  input: GenerarCursoInput
): Promise<CursoGenerado> {
  // TODO: reemplazar por la llamada real a la API de Anthropic/OpenAI.
  throw new Error("generarCursoDesdeMaterial: pendiente de implementación");
}
