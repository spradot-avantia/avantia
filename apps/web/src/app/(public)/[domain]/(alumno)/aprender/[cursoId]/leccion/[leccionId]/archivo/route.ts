// Entrega del archivo de una lección de tipo documento al alumno (ADR 030). Nunca expone la
// ruta del bucket: comprueba sesión + inscripción ACTIVA + curso publicado (exigirCursoActivo),
// que la lección sea de este curso y de este tenant, y que ya esté liberada; recién ahí
// redirige a una URL firmada de 60 s. El tenant sale del host, jamás de la request.
import { NextResponse } from "next/server";
import { exigirCursoActivo } from "../../../../../../../../../lib/alumno/guardia";
import { hoyEnZona, leccionLiberada } from "../../../../../../../../../lib/alumno/liberacion";
import { archivoDeLeccion, firmarArchivo } from "../../../../../../../../../lib/alumno/materiales";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;
const SIN_CACHE = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };

function noEncontrado() {
  return new NextResponse("Archivo no encontrado.", { status: 404, headers: SIN_CACHE });
}

export async function GET(_req: Request, { params }: { params: { cursoId: string; leccionId: string } }) {
  if (!UUID.test(params.cursoId) || !UUID.test(params.leccionId)) return noEncontrado();

  // Sesión + inscripción activa: redirige a ingresar / mis-cursos o responde 404 si el curso no es de este sitio.
  const { tenant, curso } = await exigirCursoActivo(params.cursoId, `/aprender/${params.cursoId}/${params.leccionId}`);

  const leccion = curso.modulos.flatMap((m) => m.lecciones).find((l) => l.id === params.leccionId);
  if (!leccion) return noEncontrado();
  if (!leccionLiberada(curso, curso.diaLiberacion.get(leccion.id) ?? null, hoyEnZona())) return noEncontrado();

  const archivo = await archivoDeLeccion(tenant.id, curso.id, leccion.id);
  if (!archivo) return noEncontrado();

  const url = await firmarArchivo(archivo.storagePath);
  if (!url) return new NextResponse("No pudimos abrir el archivo. Inténtalo de nuevo.", { status: 502, headers: SIN_CACHE });
  return NextResponse.redirect(url, { status: 302, headers: SIN_CACHE });
}
