// Template Consultor: venta a empresas, casos y cifras (diseño 2.5).
import { resumenCurso, type DatosSitio } from "../../lib/sitio/tipos";
import { Cta, Ej, MarcaSitio, PieSitio, estiloAcento, textoAccion } from "./partes";

export function TemplateConsultor({ d }: { d: DatosSitio }) {
  const acento = estiloAcento(d.academia.colorPrimario);
  const [primero, ...resto] = d.testimonios;
  return (
    <div className="st-consultor">
      <header className="st-barra">
        <MarcaSitio academia={d.academia} />
        <nav className="st-nav" aria-label="Secciones">
          <a href="#cursos">Cursos</a>
          <a href="#quien">Quién enseña</a>
        </nav>
      </header>

      <section className="st-co-hero">
        <h1 className="st-co-h1">
          <Ej si={d.ejemplo.titulo}>{d.titulo}</Ej>
        </h1>
        {d.bajada && (
          <p className="st-lede">
            <Ej si={d.ejemplo.bajada}>{d.bajada}</Ej>
          </p>
        )}
        <div className="st-acciones st-acciones--centro">
          <Cta d={d} className="st-btn" style={acento}>
            {textoAccion(d)}
          </Cta>
          <a className="st-btn st-btn--negro" href="#cursos">
            Ver cursos
          </a>
        </div>
        <p className="st-nota">Creas tu cuenta y la academia activa tu inscripción.</p>
      </section>

      {d.fotoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- foto remota por tenant
        <img className="st-co-foto st-foto" src={d.fotoUrl} alt="" />
      )}

      <section className="st-co-panel" id="quien" aria-labelledby="st-co-quien">
        <span className="st-ov">Quién enseña</span>
        <h2 className="st-h2" id="st-co-quien">
          <Ej si={d.ejemplo.bioNombre}>{d.bioNombre}</Ej>
        </h2>
        <p className="st-txt">
          <Ej si={d.ejemplo.bioTexto}>{d.bioTexto}</Ej>
        </p>
      </section>

      {primero && (
        <section className="st-co-caso" aria-label="Testimonios">
          <Ej si={d.ejemplo.testimonios}>
            <blockquote className="st-co-cita">«{primero.texto}»</blockquote>
            <p className="st-co-quien">{primero.nombre}</p>
            {d.cifra && <p className="st-cifra st-cifra--claro">{d.cifra}</p>}
            {resto.length > 0 && (
              <ul className="st-testis st-testis--oscuro">
                {resto.map((t, i) => (
                  <li key={i} className="st-testi">
                    <blockquote>«{t.texto}»</blockquote>
                    <span>{t.nombre}</span>
                  </li>
                ))}
              </ul>
            )}
          </Ej>
        </section>
      )}

      <section className="st-co-cursos" id="cursos" aria-labelledby="st-co-cursos">
        <h2 className="st-h2 st-centro" id="st-co-cursos">
          Cursos
        </h2>
        {d.cursos.length === 0 ? (
          <p className="st-vacio st-vacio--claro st-centro">Pronto publicaremos los cursos de esta academia.</p>
        ) : (
          <ul className="st-co-lista">
            {d.cursos.map((c) => (
              <li key={c.id}>
                <Cta d={d} href={`/curso/${c.slug}`} className="st-co-curso">
                  <span className="st-meta st-meta--claro">{resumenCurso(c)}</span>
                  <strong className="st-h3">{c.titulo}</strong>
                  {c.precio && <span className="st-co-precio">{c.precio}</span>}
                </Cta>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PieSitio d={d} />
    </div>
  );
}