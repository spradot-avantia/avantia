// Entrega de un archivo de material al alumno (ADR 030). Nunca expone la ruta del bucket:
// comprueba sesión + inscripción ACTIVA + curso publicado (exigirCursoActivo), que el material
// sea de este tenant y de este curso, y que su lección (o módulo) esté liberada; recién ahí
// redirige a una URL firmada de 60 s. El tenant sale del host, jamás de la request.
import { NextResponse } from "next/server";
import { exigirCursoActivo } from "../../../../../../../../lib/alumno/guardia";
import { fechaLiberacion, hoyEnZona, leccionLiberada } from "../../../../../../../../lib/alumno/liberacion";
import { firmarArchivo, materialDeArchivo } from "../../../../../../../../lib/alumno/materiales";
import { puedeAbrirMaterial } from "../../../../../../../../lib/alumno/materialesReglas";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;
const SIN_CACHE = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };

function noEncontrado() {
  return new NextResponse("Material no encontrado.", { status: 404, headers: SIN_CACHE });
}

export async function GET(_req: Request, { params }: { params: { cursoId: string; materialId: string } }) {
  if (!UUID.test(params.cursoId) || !UUID.test(params.materialId)) return noEncontrado();

  // Sesión + inscripción activa: redirige a ingresar / mis-cursos o responde 404 si el curso no es de este sitio.
  const { tenant, curso } = await exigirCursoActivo(params.cursoId, `/aprender/${params.cursoId}`);

  const encontrado = await materialDeArchivo(tenant.id, curso.id, params.materialId);
  if (!encontrado) return noEncontrado();

  const hoy = hoyEnZona();
  const lecciones = curso.modulos.flatMap((m) =>
    m.lecciones.map((l) => ({
      id: l.id,
      moduloId: m.id,
      liberada: leccionLiberada(curso, curso.diaLiberacion.get(l.id) ?? null, hoy),
    })),
  );
  if (!puedeAbrirMaterial(encontrado.material, lecciones)) return noEncontrado();

  const url = await firmarArchivo(encontrado.storagePath);
  if (!url) return new NextResponse("No pudimos abrir el archivo. Inténtalo de nuevo.", { status: 502, headers: SIN_CACHE });
  return NextResponse.redirect(url, { status: 302, headers: SIN_CACHE });
}
