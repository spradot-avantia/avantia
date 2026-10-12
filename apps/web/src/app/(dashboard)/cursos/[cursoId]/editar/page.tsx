import { notFound } from "next/navigation";
import { EmptyState, LinkButton, SinAcademia } from "../../../../../components/creador";
import { EditorCurso } from "../../../../../components/creador/editor/EditorCurso";
import { cargarCursoParaEditor } from "../../../../../lib/creador/editorData";
import { PASOS_EDITOR, type PasoEditor } from "../../../../../lib/creador/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editar curso" };

function pasoDe(v: string | string[] | undefined): PasoEditor {
  const x = Array.isArray(v) ? v[0] : v;
  return PASOS_EDITOR.find((p) => p.id === x)?.id ?? "esencial";
}

export default async function EditarCursoPage({
  params,
  searchParams,
}: {
  params: { cursoId: string };
  searchParams: { paso?: string | string[] };
}) {
  const carga = await cargarCursoParaEditor(params.cursoId);

  if (carga.estado === "no_encontrado") notFound();
  if (carga.estado === "sin_academia") return <SinAcademia />;
  if (carga.estado === "error") {
    return (
      <EmptyState
        titulo="No pudimos abrir el editor"
        descripcion="Hubo un problema al cargar tu curso. Tus cambios anteriores siguen guardados. Inténtalo de nuevo en unos minutos."
        accion={<LinkButton href="/cursos">Volver a Cursos</LinkButton>}
      />
    );
  }

  return <EditorCurso cursoInicial={carga.curso} pasoInicial={pasoDe(searchParams.paso)} urlPublica={carga.urlPublica} />;
}
