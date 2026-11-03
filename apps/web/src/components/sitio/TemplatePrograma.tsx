// Template Programa: página de curso con reserva siempre visible (diseño 2.3).
import { resumenCurso, type DatosSitio } from "../../lib/sitio/tipos";
import { Cta, Ej, MarcaSitio, PieSitio, Portada, estiloAcento, textoAccion } from "./partes";

export function TemplatePrograma({ d }: { d: DatosSitio }) {
  const acento = estiloAcento(d.academia.colorPrimario);
  const principal = d.cursos[0];
  return (
    <div className="st-programa">
      <header className="st-barra">
        <MarcaSitio academia={d.academia} />
        <nav className="st-nav" aria-label="Secciones">
          <a href="#cursos">Qué incluye</a>
          <a href="#quien">Quién enseña</a>
          {d.testimonios.length > 0 && <a href="#opiniones">Opiniones</a>}
        </nav>
      </header>

      <section className="st-pr-hero">
        <div className="st-pr-hero__txt">
          <h1 className="st-h1">
            <Ej si={d.ejemplo.titulo}>{d.titulo}</Ej>
          </h1>
          {d.bajada && (
            <p className="st-lede">
              <Ej si={d.ejemplo.bajada}>{d.bajada}</Ej>
            </p>
          )}
          <div className="st-acciones">
            <Cta d={d} className="st-btn" style={acento}>
              {textoAccion(d)}
            </Cta>
          </div>
          <p className="st-nota">Creas tu cuenta y la academia activa tu inscripción.</p>
        </div>
        <div className="st-pr-hero__card">
          {d.fotoUrl ? (
            <Portada d={d} className="st-pr-foto" />
          ) : (
            <div className="st-pr-oscura">
              <span className="st-pr-oscura__ov">{d.academia.nombre}</span>
              <strong className="st-pr-oscura__t">{principal ? principal.titulo : d.titulo}</strong>
              {d.bioNombre && (
                <span className="st-pr-oscura__con">
                  con <Ej si={d.ejemplo.bioNombre}>{d.bioNombre}</Ej>
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="st-sec" id="cursos" aria-labelledby="st-pr-cursos">
        <h2 className="st-h2" id="st-pr-cursos">
          Qué incluye
        </h2>
        {d.cursos.length === 0 ? (
          <p className="st-vacio">Pronto publicaremos los cursos de esta academia.</p>
        ) : (
          <ul className="st-pr-cursos">
            {d.cursos.map((c) => (
              <li key={c.id} className="st-pr-curso" style={{ borderTopColor: d.academia.colorPrimario }}>
                <div>
                  <h3 className="st-h3">{c.titulo}</h3>
                  <p className="st-meta">{resumenCurso(c)}</p>
                  {c.descripcion && <p className="st-txt">{c.descripcion}</p>}
                </div>
                <div className="st-pr-curso__lado">
                  {c.precio && <strong className="st-precio">{c.precio}</strong>}
                  <Cta d={d} href={`/curso/${c.slug}`} className="st-btn st-btn--sec">
                    Ver el curso
                  </Cta>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="st-sec st-pr-quien" id="quien" aria-labelledby="st-pr-quien">
        <span className="st-ov">Quién enseña</span>
        <h2 className="st-h2" id="st-pr-quien">
          <Ej si={d.ejemplo.bioNombre}>{d.bioNombre}</Ej>
        </h2>
        <p className="st-txt">
          <Ej si={d.ejemplo.bioTexto}>{d.bioTexto}</Ej>
        </p>
      </section>

      {d.testimonios.length > 0 && (
        <section className="st-sec" id="opiniones" aria-labelledby="st-pr-op">
          <h2 className="st-h2" id="st-pr-op">
            Lo que dicen quienes lo tomaron
          </h2>
          <Ej si={d.ejemplo.testimonios}>
            {d.cifra && <p className="st-cifra">{d.cifra}</p>}
            <ul className="st-testis">
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

      <PieSitio d={d} />
    </div>
  );
}