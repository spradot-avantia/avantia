export interface GenerarCursoInput {
  tenantId: string;
  materialCrudo: string;
}

export interface CursoGenerado {
  titulo: string;
  descripcion: string;
  modulos: Array<{
    titulo: string;
    lecciones: Array<{ titulo: string; resumen: string }>;
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
