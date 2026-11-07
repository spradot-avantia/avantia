// Template Maestro: tú eres la marca, fondo negro por diseño (diseño 2.4).
import { resumenCurso, type DatosSitio } from "../../lib/sitio/tipos";
import { Cta, Ej, MarcaSitio, PieSitio, Portada, estiloAcento, textoAccion } from "./partes";

export function TemplateMaestro({ d }: { d: DatosSitio }) {
  // En la vista previa del panel el título principal es el de la página del creador.
  const Titulo = d.modo === "vista" ? "h2" : "h1";
  const acento = estiloAcento(d.academia.colorPrimario);
  return (
    <div className="st-maestro">
      <header className="st-barra st-barra--oscura">
        <MarcaSitio academia={d.academia} claro />
        <Cta d={d} className="st-btn st-btn--sm" style={acento}>
          Inscribirme
        </Cta>
      </header>

      <section className="st-ma-hero">
        <div className="st-ma-hero__txt">
          <Titulo className="st-ma-h1">
            <Ej si={d.ejemplo.titulo}>{d.titulo}</Ej>
          </Titulo>
          <i className="st-ma-raya" style={{ background: d.academia.colorPrimario }} aria-hidden="true" />
          {d.bajada && (
            <p className="st-lede st-lede--claro">
              <Ej si={d.ejemplo.bajada}>{d.bajada}</Ej>
            </p>
          )}
          <div className="st-acciones">
            <Cta d={d} className="st-btn" style={acento}>
              {textoAccion(d)}
            </Cta>
            <a className="st-btn st-btn--borde" href="#cursos">
              Ver cursos
            </a>
          </div>
        </div>
        <Portada d={d} className="st-ma-foto" />
      </section>

      <section className="st-sec st-sec--oscura" id="cursos" aria-labelledby="st-ma-cursos">
        <h2 className="st-h2 st-centro" id="st-ma-cursos">
          Elige tu curso.
        </h2>
        {d.cursos.length === 0 ? (
          <p className="st-vacio st-vacio--claro">Pronto publicaremos los cursos de esta academia.</p>
        ) : (
          <ul className="st-ma-cursos">
            {d.cursos.map((c) => (
              <li key={c.id} className="st-ma-curso">
                <h3 className="st-h3">{c.titulo}</h3>
                {c.precio && <strong className="st-ma-precio">{c.precio}</strong>}
                <p className="st-meta st-meta--claro">{resumenCurso(c)}</p>
                {c.descripcion && <p className="st-txt st-txt--claro">{c.descripcion}</p>}
                <Cta d={d} href={`/curso/${c.slug}`} className="st-btn st-btn--bloque" style={acento}>
                  Inscribirme
                </Cta>
              </li>
            ))}
          </ul>
        )}
      </section>

      {d.testimonios.length > 0 && (
        <section className="st-sec st-sec--oscura" aria-labelledby="st-ma-op">
          <h2 className="st-h2 st-centro" id="st-ma-op">
            Lo que dicen los alumnos.
          </h2>
          <Ej si={d.ejemplo.testimonios}>
            {d.cifra && <p className="st-cifra st-cifra--claro st-centro">{d.cifra}</p>}
            <ul className="st-testis st-testis--oscuro">
              {d.testimonios.map((t, i) => (
                <li key={i} className="st-testi">
                  <blockquote>«{t.texto}»</blockquote>
                  <span>{t.nombre}</span>
                </li>
              ))}
            </ul>
          </Ej>
        </section>
      )}

      <section className="st-sec st-sec--oscura st-ma-quien" aria-labelledby="st-ma-quien">
        <span className="st-ov st-ov--claro">Quién enseña</span>
        <h2 className="st-h2" id="st-ma-quien">
          <Ej si={d.ejemplo.bioNombre}>{d.bioNombre}</Ej>
        </h2>
        <p className="st-txt st-txt--claro">
          <Ej si={d.ejemplo.bioTexto}>{d.bioTexto}</Ej>
        </p>
      </section>

      <PieSitio d={d} claro />
    </div>
  );
}