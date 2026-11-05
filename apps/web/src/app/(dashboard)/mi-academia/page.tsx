import { EmptyState, PageHeader, SinAcademia } from "../../../components/creador";
import { AparienciaForm } from "../../../components/creador/marca/AparienciaForm";
import { MarcaForm } from "../../../components/creador/marca/MarcaForm";
import { DominioCard } from "../../../components/creador/pagina/DominioCard";
import { SeccionPagina } from "../../../components/creador/pagina/SeccionPagina";
import { cargarPaginaCreador } from "../../../lib/creador/paginaData";
import { clasesFuentes } from "../../../lib/tenant/fuentes";
import "../../../components/creador/marca/marca.css";
import "../../../components/creador/pagina/pagina.css";

export const dynamic = "force-dynamic";

// Mi academia: página de la academia + dominio (diseño 02, ADR 021) y Marca (pantallas 02 y 04).
export default async function MiAcademiaPage() {
  const carga = await cargarPaginaCreador();
  if (carga.estado === "sin_academia") return <SinAcademia />;
  if (carga.estado === "error") {
    return (
      <EmptyState
        titulo="No pudimos abrir Mi academia"
        descripcion="Hubo un problema al cargar tu academia. Tus datos siguen guardados. Inténtalo de nuevo en unos minutos."
      />
    );
  }
  const { tenant, pagina, direccion, direccionBase, dominioRaiz } = carga.datos;
  return (
    <>
      <PageHeader titulo="Mi academia" descripcion="Tu marca y cómo la verán tus estudiantes." />

      <nav className="mk-secciones" aria-label="Secciones de Mi academia">
        <a href="#marca">Marca</a>
        <a href="#apariencia">Apariencia</a>
        <a href="#pagina">Página</a>
        <a href="#dominio">Dominio</a>
      </nav>

      <div id="marca" className="mk-seccion">
        <MarcaForm tenant={tenant} />
      </div>

      <div id="apariencia" className={`mk-seccion ${clasesFuentes}`}>
        <AparienciaForm tenant={tenant} />
      </div>

      <SeccionPagina pagina={pagina} color={tenant.colorPrimario} direccion={direccion} />

      <div id="dominio" className="mk-seccion">
        <DominioCard
          direccionBase={direccionBase}
          dominioRaiz={dominioRaiz}
          dominioConectado={tenant.customDomain}
          solicitado={pagina.dominioSolicitado}
          token={pagina.dominioToken}
        />
      </div>
    </>
  );
}