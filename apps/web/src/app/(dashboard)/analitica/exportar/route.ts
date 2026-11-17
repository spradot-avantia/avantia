// Exportación CSV de la analítica (RQ-27). Misma consulta que la página: cliente con RLS del
// creador, tenant de la sesión (nunca del request).
import { NextResponse } from "next/server";
import { cargarAnalitica } from "../../../../lib/creador/analitica";
import { aCsv } from "../../../../lib/creador/analiticaReglas";
import { getCurrentTenant } from "../../../../lib/creador/tenantActual";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await getCurrentTenant())) return new NextResponse("No autorizado", { status: 401 });
  const url = new URL(req.url);
  const tipo = url.searchParams.get("tipo");
  const a = await cargarAnalitica(url.searchParams.get("curso") ?? undefined);
  let csv: string;
  if (tipo === "lecciones") {
    csv = aCsv(
      ["Módulo", "Lección", "Abrieron", "Completaron", "Abandono %", "Tiempo mediano (s)"],
      a.lecciones.map((l) => [l.modulo, l.titulo, l.abrieron, l.completaron, l.abandono, l.tiempoMedianoSeg]),
    );
  } else if (tipo === "preguntas") {
    csv = aCsv(
      ["Módulo", "Pregunta", "Alumnos", "Acierto primer intento %", "Tiempo mediano (s)", "Reintentos por alumno"],
      a.preguntas.map((q) => [q.modulo, q.texto, q.alumnos, q.acierto, q.tiempoMedianoSeg, q.reintentos]),
    );
  } else if (tipo === "tareas") {
    csv = aCsv(
      ["Tarea", "Entregaron", "Inscritos activos", "Con reenvío", "Horas hasta entregar (mediana)"],
      a.tareas.map((t) => [t.titulo, t.entregaron, t.inscritos, t.conReenvio, t.horasMedianas]),
    );
  } else {
    return new NextResponse("Tipo no válido", { status: 400 });
  }
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="analitica-${tipo}.csv"`, "Cache-Control": "no-store" },
  });
}
