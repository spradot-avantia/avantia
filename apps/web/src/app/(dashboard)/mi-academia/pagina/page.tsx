import { EmptyState, LinkButton, SinAcademia } from "../../../../components/creador";
import { EditorPagina } from "../../../../components/creador/pagina/EditorPagina";
import { cargarPaginaCreador } from "../../../../lib/creador/paginaData";

export const dynamic = "force-dynamic";
export const metadata = { title: "Página de tu academia" };

// Editor de la página de la academia (diseño 2.2, ADR 021).
export default async function EditarPaginaPage() {
  const carga = await cargarPaginaCreador();
  if (carga.estado === "sin_academia") return <SinAcademia />;
  if (carga.estado === "error") {
    return (
      <EmptyState
        titulo="No pudimos abrir el editor"
        descripcion="Hubo un problema al cargar tu página. Tus cambios anteriores siguen guardados. Inténtalo de nuevo en unos minutos."
        accion={<LinkButton href="/mi-academia">Volver a Mi academia</LinkButton>}
      />
    );
  }
  const { pagina, academia, cursos, direccion } = carga.datos;
  const template = pagina.contenido.template;
  if (!template) {
    return (
      <EmptyState
        titulo="Primero elige un template"
        descripcion="Tu página parte de un template: Programa, Maestro o Consultor. Elige uno en Mi academia o responde 5 preguntas y te recomendamos el que mejor te queda."
        accion={
          <div className="pg-fila">
            <LinkButton href="/mi-academia#pagina">Elegir template</LinkButton>
            <LinkButton href="/mi-academia/encuesta" variante="secondary">
              Responder la encuesta
            </LinkButton>
          </div>
        }
      />
    );
  }
  return <EditorPagina paginaInicial={pagina} template={template} academia={academia} cursos={cursos} direccion={direccion} />;
}