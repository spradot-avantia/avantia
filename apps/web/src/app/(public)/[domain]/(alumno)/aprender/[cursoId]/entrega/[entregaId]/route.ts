// Descarga de una entrega PROPIA del alumno (ADR 038). Comprueba sesión + inscripción activa
// (exigirCursoActivo) y que la entrega sea de este alumno y de esta academia; redirige a una URL
// firmada de 60 s. Nunca expone la ruta del bucket. El tenant sale del host, jamás de la request.
import { NextResponse } from "next/server";
import { exigirCursoActivo } from "../../../../../../../../lib/alumno/guardia";
import { urlDeMiEntrega } from "../../../../../../../../lib/alumno/tareas";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;
const SIN_CACHE = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };

export async function GET(_req: Request, { params }: { params: { cursoId: string; entregaId: string } }) {
  const noEncontrada = () => new NextResponse("Entrega no encontrada.", { status: 404, headers: SIN_CACHE });
  if (!UUID.test(params.cursoId) || !UUID.test(params.entregaId)) return noEncontrada();

  const { tenant, alumno } = await exigirCursoActivo(params.cursoId, `/aprender/${params.cursoId}`);
  const url = await urlDeMiEntrega(tenant.id, alumno.id, params.entregaId);
  if (!url) return noEncontrada();
  return NextResponse.redirect(url, { status: 302, headers: SIN_CACHE });
}
