import { redirect } from "next/navigation";
import { leccionesEnOrden } from "../../../../../../lib/alumno/catalogo";
import { exigirCursoActivo } from "../../../../../../lib/alumno/guardia";
import { ultimaLeccionAbierta } from "../../../../../../lib/alumno/progreso";

export const dynamic = "force-dynamic";

/** Entrada al curso: lleva a la lección donde quedó, o a la primera sin completar. */
export default async function AprenderPage({ params }: { params: { cursoId: string } }) {
  const { tenant, alumno, curso, completadas } = await exigirCursoActivo(params.cursoId, `/aprender/${params.cursoId}`);
  const orden = leccionesEnOrden(curso);
  if (orden.length === 0) redirect("/mis-cursos");
  const ultima = await ultimaLeccionAbierta(tenant.id, alumno.id, curso.id);
  const destino = (ultima && !completadas.has(ultima) ? ultima : orden.find((l) => !completadas.has(l.id))?.id) ?? orden[0].id;
  redirect(`/aprender/${curso.id}/${destino}`);
}
