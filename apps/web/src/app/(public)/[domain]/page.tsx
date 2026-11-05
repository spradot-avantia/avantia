import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BarraAlumno } from "../../../components/alumno/BarraAlumno";
import { PlantillaSitio } from "../../../components/sitio/PlantillaSitio";
import { MarcaSitio, TarjetaCurso } from "../../../components/sitio/partes";
import { textoSobre } from "../../../lib/creador/color";
import { getAlumnoActual } from "../../../lib/alumno/sesion";
import { getSitioAcademia } from "../../../lib/sitio/paginaPublica";
import { construirDatosSitio } from "../../../lib/sitio/tipos";
import { clasesFuentes } from "../../../lib/tenant/fuentes";
import { clasesIdentidad } from "../../../lib/tenant/identidad";
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
  const color = sitio.academia.colorPrimario;
  const pub = sitio.publicado;
  if (pub?.template) {
    const d = construirDatosSitio({ contenido: pub, template: pub.template, academia: sitio.academia, cursos: sitio.cursos, modo: "publico" });
    return (
      <main>
        <BarraAlumno alumno={alumno} />
        <PlantillaSitio d={d} />
      </main>
    );
  }

  return (
    <main className={`st ${clasesFuentes} ${clasesIdentidad(sitio.academia.tipografia, sitio.academia.forma)}`}>
      <BarraAlumno alumno={alumno} />
      <div className="st-programa">
        <header className="st-barra">
          <MarcaSitio academia={sitio.academia} />
        </header>
        <section
          className="st-inicio-hero"
          style={{ background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 70%, #000))`, color: textoSobre(color) }}
        >
          <div className="st-inicio-hero__in">
            <h1 className="st-h1">{sitio.academia.nombre}</h1>
            {sitio.academia.frase && <p className="st-inicio-hero__frase">{sitio.academia.frase}</p>}
            {sitio.cursos.length > 0 && (
              <a className="st-btn st-btn--sec" href="#st-cursos">
                Ver {sitio.cursos.length === 1 ? "el curso" : `los ${sitio.cursos.length} cursos`}
              </a>
            )}
          </div>
        </section>
        <section className="st-sec" aria-labelledby="st-cursos">
          <h2 className="st-h2" id="st-cursos">
            {sitio.cursos.length === 1 ? "El curso" : "Cursos"}
          </h2>
          {sitio.cursos.length === 0 ? (
            <p className="st-vacio">Pronto publicaremos los cursos de esta academia.</p>
          ) : (
            <ul className="st-pr-cursos">
              {sitio.cursos.map((c) => (
                <TarjetaCurso key={c.id} color={color} c={c} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}