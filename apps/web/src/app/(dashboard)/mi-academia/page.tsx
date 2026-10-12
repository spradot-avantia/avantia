import { PageHeader, SinAcademia } from "../../../components/creador";
import { MarcaForm } from "../../../components/creador/marca/MarcaForm";
import { getCurrentTenant } from "../../../lib/creador/tenantActual";
import "../../../components/creador/marca/marca.css";

export const dynamic = "force-dynamic";

// Mi academia > Marca (pantallas 02 y 04).
export default async function MiAcademiaPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) return <SinAcademia />;
  return (
    <>
      <PageHeader titulo="Mi academia" descripcion="Tu marca y cómo la verán tus estudiantes." />
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
