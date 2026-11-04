// Resultados del quiz para el creador. Cliente con RLS del creador (nunca service
// role) + filtro explícito por tenant. Tolera que la migración 0011 no exista.
import { agregarResultados, type ResultadoModulo } from "./resultadosQuizReglas";
import { requireCreadorContext } from "./tenantActual";

export type { ResultadoModulo } from "./resultadosQuizReglas";

export async function resultadosDelQuiz(): Promise<ResultadoModulo[]> {
  const { tenant, db } = await requireCreadorContext();
  const [mods, pregs, resp] = await Promise.all([
    db.from("modulos").select("id, curso_id, titulo, orden").eq("tenant_id", tenant.id),
    db.from("quiz_preguntas").select("id, modulo_id, texto, orden").eq("tenant_id", tenant.id),
    db.from("quiz_respuestas").select("alumno_id, pregunta_id, acierto, primer_intento").eq("tenant_id", tenant.id),
  ]);
  if (!pregs.data?.length) return [];
  return agregarResultados(
    (mods.data ?? []).map((m) => ({ id: m.id, cursoId: m.curso_id, titulo: m.titulo ?? "", orden: m.orden ?? 0 })),
    pregs.data.map((p) => ({ id: p.id, moduloId: p.modulo_id, texto: p.texto ?? "", orden: p.orden ?? 0 })),
    (resp.data ?? []).map((r) => ({ alumnoId: r.alumno_id, preguntaId: r.pregunta_id, acierto: !!r.acierto, primerIntento: !!r.primer_intento })),
  );
}
