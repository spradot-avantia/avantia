import { EmptyState, PageHeader, SinAcademia } from "../../../components/creador";
import { MarcaForm } from "../../../components/creador/marca/MarcaForm";
import { DominioCard } from "../../../components/creador/pagina/DominioCard";
import { SeccionPagina } from "../../../components/creador/pagina/SeccionPagina";
import { cargarPaginaCreador } from "../../../lib/creador/paginaData";
import "../../../components/creador/marca/marca.css";
import "../../../components/creador/pagina/pagina.css";

export const dynamic = "force-dynamic";

// Mi academia: página de la academia + dominio (diseño 02, ADR 018) y Marca (pantallas 02 y 04).
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

      <div className="pg-cols pg-bloque">
        <SeccionPagina pagina={pagina} color={tenant.colorPrimario} direccion={direccion} />
        <DominioCard
          direccionBase={direccionBase}
          dominioRaiz={dominioRaiz}
          dominioConectado={tenant.customDomain}
          solicitado={pagina.dominioSolicitado}
          token={pagina.dominioToken}
        />
      </div>

      <div className="mk-grid">
        <MarcaForm tenant={tenant} />
        <div className="mk-aside">
          <section className="mk-card" aria-labelledby="mk-quien">
            <h2 className="mk-h2" id="mk-quien">
              Quién ve esta academia
            </h2>
            <p className="mk-ayuda">Solo tú y las personas con permiso de edición ven y cambian cursos, estudiantes y sesiones.</p>
          </section>
          <section className="mk-card" aria-labelledby="mk-donde">
            <h2 className="mk-h2" id="mk-donde">
              Dónde aparece tu logo
            </h2>
            <ul className="mk-lista">
              <li>Menú lateral y barra superior en el móvil</li>
              <li>Editor de cursos y vista previa del curso</li>
              <li>Páginas que verán tus estudiantes</li>
            </ul>
            <p className="mk-ayuda">Avantia aparece solo como firma discreta al pie del menú.</p>
          </section>
          <section className="mk-card" aria-labelledby="mk-aun">
            <h2 className="mk-h2" id="mk-aun">
              Aún no disponible
            </h2>
            <ul className="mk-lista mk-lista--no">
              <li>Experiencia del estudiante</li>
              <li>Portadas de curso y documentos</li>
              <li>Cobros, comunidad y estructurar con IA</li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}