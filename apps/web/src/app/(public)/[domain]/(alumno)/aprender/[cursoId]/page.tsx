import { redirect } from "next/navigation";
import { leccionesEnOrden } from "../../../../../../lib/alumno/catalogo";
import { exigirCursoActivo } from "../../../../../../lib/alumno/guardia";
import { ultimaLeccionAbierta } from "../../../../../../lib/alumno/progreso";

export const dynamic = "force-dynamic";

/** Entrada al curso: primera vez → primer módulo; con avance → la lección donde quedó o la primera sin completar. */
export default async function AprenderPage({ params }: { params: { cursoId: string } }) {
  const { tenant, alumno, curso, completadas } = await exigirCursoActivo(params.cursoId, `/aprender/${params.cursoId}`);
  const orden = leccionesEnOrden(curso);
  if (orden.length === 0) redirect("/mis-cursos");
  const ultima = await ultimaLeccionAbierta(tenant.id, alumno.id, curso.id);
  // Primera vez en el curso: se parte por la presentación del primer módulo (ADR 032).
  if (!ultima && completadas.size === 0) {
    const primero = curso.modulos.find((m) => m.lecciones.length > 0);
    if (primero) redirect(`/aprender/${curso.id}/modulo/${primero.id}`);
  }
  const destino = (ultima && !completadas.has(ultima) ? ultima : orden.find((l) => !completadas.has(l.id))?.id) ?? orden[0].id;
  redirect(`/aprender/${curso.id}/${destino}`);
}
