import type { Metadata } from "next";
import Link from "next/link";
import { ListaClases } from "../../../../../../../components/alumno/ClasesEnVivo";
import { exigirCursoActivo } from "../../../../../../../lib/alumno/guardia";
import { clasesDeCurso } from "../../../../../../../lib/alumno/tareas";

export const metadata: Metadata = { title: "Clases en vivo" };
export const dynamic = "force-dynamic";

export default async function ClasesPage({ params }: { params: { cursoId: string } }) {
  const { tenant, curso } = await exigirCursoActivo(params.cursoId, `/aprender/${params.cursoId}/clases`);
  const clases = await clasesDeCurso(tenant.id, curso.id);
  return (
    <div className="al-stack">
      <p className="al-crumbs">
        <Link href="/mis-cursos">Mis cursos</Link> › <Link href={`/aprender/${curso.id}`}>{curso.titulo}</Link>
      </p>
      <h1>Clases en vivo</h1>
      <ListaClases clases={clases} />
    </div>
  );
}
