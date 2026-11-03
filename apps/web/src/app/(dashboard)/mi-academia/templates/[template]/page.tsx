import { notFound } from "next/navigation";
import { EmptyState, PageHeader, SinAcademia } from "../../../../../components/creador";
import { UsarTemplate } from "../../../../../components/creador/pagina/UsarTemplate";
import { VistaNavegador } from "../../../../../components/creador/pagina/VistaNavegador";
import { cargarPaginaCreador, cursosPublicados } from "../../../../../lib/creador/paginaData";
import { CONTENIDO_VACIO, esClaveTemplate, infoTemplate } from "../../../../../lib/creador/paginaReglas";
import { construirDatosSitio } from "../../../../../lib/sitio/tipos";
import "../../../../../components/creador/pagina/pagina.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Template de la página" };

// "Ver template original": el template con su contenido de ejemplo y la marca y cursos de la academia.
export default async function VerTemplatePage({ params }: { params: { template: string } }) {
  if (!esClaveTemplate(params.template)) notFound();
  const carga = await cargarPaginaCreador();
  if (carga.estado === "sin_academia") return <SinAcademia />;
  if (carga.estado === "error") return <EmptyState titulo="No pudimos abrir el template" descripcion="Inténtalo de nuevo en unos minutos." />;

  const { pagina, academia, cursos, direccion } = carga.datos;
  const clave = params.template;
  const info = infoTemplate(clave);
  const d = construirDatosSitio({ contenido: CONTENIDO_VACIO, template: clave, academia, cursos: cursosPublicados(cursos), modo: "vista" });

  return (
    <div className="pg-grid">
      <PageHeader
        titulo={`Template ${info.nombre}`}
        descripcion={`${info.descripcion} Lo marcado en naranjo es contenido de ejemplo: lo reemplazas en el editor.`}
        volver={{ href: "/mi-academia#pagina", label: "Mi academia" }}
        acciones={<UsarTemplate clave={clave} actual={pagina.contenido.template === clave} />}
      />
      <VistaNavegador d={d} direccion={direccion} libre />
    </div>
  );
}