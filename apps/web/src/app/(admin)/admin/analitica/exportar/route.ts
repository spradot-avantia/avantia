// Exportación CSV de la analítica de creadores (ADR 043). Solo staff.
import { NextResponse } from "next/server";
import { cargarAnaliticaCreadores } from "../../../../../lib/admin/analiticaCreadores";
import { diasDesde, etapaDe, estancada } from "../../../../../lib/admin/embudoReglas";
import { aCsv } from "../../../../../lib/creador/analiticaReglas";
import { getUsuarioActual } from "../../../../../lib/auth/usuario";
import { esStaff } from "../../../../../lib/staff";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getUsuarioActual())) return new NextResponse("No autorizado", { status: 401 });
  if (!(await esStaff())) return new NextResponse("Acceso restringido", { status: 403 });
  const d = await cargarAnaliticaCreadores();
  const csv = aCsv(
    ["Academia", "Dueño", "Etapa", "Estancada", "Último ingreso (días)", "Última edición (días)", "Cursos publicados", "Cursos", "Alumnos", "Activos 30 d", "Alta"],
    d.academias.map((a) => [
      a.nombre, a.dueno, etapaDe(a).label, estancada(a, d.ahora) ? "sí" : "no",
      diasDesde(a.ultimoLogin, d.ahora), diasDesde(a.ultimaEdicion, d.ahora),
      a.cursosPublicados, a.cursosTotal, a.alumnos, a.alumnosActivos30, a.creadaAt.slice(0, 10),
    ]),
  );
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="analitica-creadores.csv"', "Cache-Control": "no-store" },
  });
}
