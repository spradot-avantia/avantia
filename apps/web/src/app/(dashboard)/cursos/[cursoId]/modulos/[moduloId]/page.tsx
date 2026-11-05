import { notFound } from "next/navigation";
import { EmptyState, LinkButton, SinAcademia } from "../../../../../../components/creador";
import { EditorModulo } from "../../../../../../components/creador/editor/EditorModulo";
import { cargarCursoParaEditor } from "../../../../../../lib/creador/editorData";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editar módulo" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Pantalla de un módulo (ADR 029): el módulo debe pertenecer al curso del tenant de la sesión. */
export default async function EditarModuloPage({ params }: { params: { cursoId: string; moduloId: string } }) {
  if (!UUID.test(params.moduloId)) notFound();
  const carga = await cargarCursoParaEditor(params.cursoId);

  if (carga.estado === "no_encontrado") notFound();
  if (carga.estado === "sin_academia") return <SinAcademia />;
  if (carga.estado === "error") {
    return (
      <EmptyState
        titulo="No pudimos abrir el módulo"
        descripcion="Hubo un problema al cargar tu curso. Tus cambios anteriores siguen guardados. Inténtalo de nuevo en unos minutos."
        accion={<LinkButton href="/cursos">Volver a Cursos</LinkButton>}
      />
    );
  }
  if (!carga.curso.modulos.some((m) => m.id === params.moduloId)) notFound();

  return <EditorModulo cursoInicial={carga.curso} moduloId={params.moduloId} urlPublica={carga.urlPublica} />;
}
