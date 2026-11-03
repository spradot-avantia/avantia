import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BarraAlumno } from "../../../components/alumno/BarraAlumno";
import { PlantillaSitio } from "../../../components/sitio/PlantillaSitio";
import { MarcaSitio } from "../../../components/sitio/partes";
import { getAlumnoActual } from "../../../lib/alumno/sesion";
import { getSitioAcademia } from "../../../lib/sitio/paginaPublica";
import { construirDatosSitio, resumenCurso } from "../../../lib/sitio/tipos";
import { resolveTenantByHostname } from "../../../lib/tenant/resolve";
import "../../../components/sitio/sitio.css";

// Lee lo publicado en cada visita: "Publicar" se ve al instante.
export const dynamic = "force-dynamic";

async function cargar(domain: string) {
  const tenant = await resolveTenantByHostname(domain);
  if (!tenant) return null;
  return getSitioAcademia(tenant.id);
}

export async function generateMetadata({ params }: { params: { domain: string } }): Promise<Metadata> {
  const sitio = await cargar(params.domain);
  if (!sitio) return {};
  const titulo = sitio.publicado?.titulo ?? sitio.academia.nombre;
  return {
    title: titulo === sitio.academia.nombre ? titulo : `${titulo} · ${sitio.academia.nombre}`,
    description: sitio.publicado?.bajada ?? sitio.academia.frase ?? undefined,
  };
}

/** Inicio de la academia: su página publicada o, si aún no la publica, sus cursos. */
export default async function SitioAcademiaPage({ params }: { params: { domain: string } }) {
  const sitio = await cargar(params.domain);
  if (!sitio) notFound();

  const alumno = await getAlumnoActual();
  const pub = sitio.publicado;
  if (pub?.template) {
    const d = construirDatosSitio({ contenido: pub, template: pub.template, academia: sitio.academia, cursos: sitio.cursos, modo: "publico" });
    return (
      <>
        <BarraAlumno alumno={alumno} />
        <PlantillaSitio d={d} />
      </>
    );
  }

  return (
    <div className="st">
      <BarraAlumno alumno={alumno} />
      <div className="st-programa">
        <header className="st-barra">
          <MarcaSitio academia={sitio.academia} />
        </header>
        <section className="st-sec">
          <h1 className="st-h1">{sitio.academia.nombre}</h1>
          {sitio.academia.frase && <p className="st-lede">{sitio.academia.frase}</p>}
        </section>
        <section className="st-sec" aria-labelledby="st-cursos">
          <h2 className="st-h2" id="st-cursos">
            Cursos
          </h2>
          {sitio.cursos.length === 0 ? (
            <p className="st-vacio">Pronto publicaremos los cursos de esta academia.</p>
          ) : (
            <ul className="st-pr-cursos">
              {sitio.cursos.map((c) => (
                <li key={c.id} className="st-pr-curso" style={{ borderTopColor: sitio.academia.colorPrimario }}>
                  <div>
                    <h3 className="st-h3">{c.titulo}</h3>
                    <p className="st-meta">{resumenCurso(c)}</p>
                  </div>
                  <div className="st-pr-curso__lado">
                    {c.precio && <strong className="st-precio">{c.precio}</strong>}
                    <a className="st-btn st-btn--sec" href={`/curso/${c.slug}`}>
                      Ver el curso
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}