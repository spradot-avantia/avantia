// Piezas comunes de los templates del sitio público. Sin hooks: sirven igual
// en el servidor (sitio público) y dentro de la vista previa del editor.
import type { CSSProperties, ReactNode } from "react";
import { iniciales, textoSobre } from "../../lib/creador/color";
import { destinoAccion, resumenCurso, type AcademiaSitio, type CursoSitio, type DatosSitio } from "../../lib/sitio/tipos";

/** Envuelve un texto de ejemplo: en la vista previa se marca en naranjo. */
export function Ej({ si, children }: { si: boolean; children: ReactNode }) {
  if (!si) return <>{children}</>;
  return (
    <span className="st-ej" title="Contenido de ejemplo">
      {children}
    </span>
  );
}

/** Logo (o iniciales) y nombre de la academia. */
export function MarcaSitio({ academia, claro }: { academia: AcademiaSitio; claro?: boolean }) {
  const solo = !!academia.logoUrl && academia.logoModo === "solo_logo";
  return (
    <span className={`st-marca${claro ? " st-marca--claro" : ""}`}>
      {academia.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- logo remoto por tenant
        <img className={solo ? "st-marca__ancho" : "st-marca__img"} src={academia.logoUrl} alt={solo ? academia.nombre : ""} />
      ) : (
        <span
          className="st-marca__ini"
          aria-hidden="true"
          style={{ background: academia.colorPrimario, color: textoSobre(academia.colorPrimario) }}
        >
          {iniciales(academia.nombre)}
        </span>
      )}
      {!solo && <span className="st-marca__nombre">{academia.nombre}</span>}
    </span>
  );
}

/** Estilo del botón principal con el color de la academia (texto con contraste AA). */
export function estiloAcento(color: string) {
  return { background: color, borderColor: color, color: textoSobre(color) };
}

/** Texto del botón principal ("Inscribirme por $320.000" si hay un solo curso con precio). */
export function textoAccion(d: DatosSitio): string {
  const unico = d.cursos.length === 1 ? d.cursos[0] : null;
  if (unico?.precio && unico.precio !== "Gratis") return `Inscribirme por ${unico.precio}`;
  return "Inscribirme";
}

/** Botón o enlace: en la vista previa no navega (como en el diseño). */
export function Cta({
  d,
  href,
  className,
  style,
  children,
}: {
  d: DatosSitio;
  href?: string;
  className: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  if (d.modo === "vista") {
    return (
      <span className={className} style={style} aria-disabled="true">
        {children}
      </span>
    );
  }
  return (
    <a className={className} style={style} href={href ?? destinoAccion(d)}>
      {children}
    </a>
  );
}

/** Foto de portada o, si no hay, un bloque con el color de la academia. */
export function Portada({ d, className, vacio }: { d: DatosSitio; className: string; vacio?: ReactNode }) {
  if (d.fotoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- foto remota por tenant
    return <img className={`${className} st-foto`} src={d.fotoUrl} alt="" />;
  }
  return (
    <div
      className={`${className} st-foto st-foto--vacia`}
      style={{ background: `linear-gradient(160deg, color-mix(in srgb, ${d.academia.colorPrimario} 55%, #d9d4c7), ${d.academia.colorPrimario})` }}
      aria-hidden="true"
    >
      {vacio}
    </div>
  );
}

/** Tarjeta de curso del template Programa: banda con el color de la academia, datos del curso y acción con acento. */
export function TarjetaCurso({ color, c, vista }: { color: string; c: CursoSitio; vista?: boolean }) {
  const sobre = textoSobre(color);
  const cuando = c.modalidad === "con_fechas" ? resumenCurso(c).split(" · ")[0] : "A su ritmo";
  const contenido = [
    c.totalModulos ? `${c.totalModulos} ${c.totalModulos === 1 ? "módulo" : "módulos"}` : null,
    c.totalLecciones ? `${c.totalLecciones} ${c.totalLecciones === 1 ? "lección" : "lecciones"}` : null,
  ].filter(Boolean);
  return (
    <li className="st-pr-curso">
      <div
        className="st-pr-curso__banda"
        style={{ background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 70%, #000))`, color: sobre }}
      >
        <span className="st-pr-curso__cuando">{cuando}</span>
      </div>
      <div className="st-pr-curso__cuerpo">
        <h3 className="st-h3">{c.titulo}</h3>
        {contenido.length > 0 && <p className="st-meta">{contenido.join(" · ")}</p>}
        {c.descripcion && <p className="st-txt st-pr-curso__desc">{c.descripcion}</p>}
      </div>
      <div className="st-pr-curso__lado">
        {c.precio && <strong className="st-precio">{c.precio}</strong>}
        {vista ? (
          <span className="st-btn" style={estiloAcento(color)} aria-disabled="true">
            Ver el curso
          </span>
        ) : (
          <a className="st-btn" style={estiloAcento(color)} href={`/curso/${c.slug}`}>
            Ver el curso
          </a>
        )}
      </div>
    </li>
  );
}

export function PieSitio({ d, claro }: { d: DatosSitio; claro?: boolean }) {
  return (
    <footer className={`st-pie${claro ? " st-pie--claro" : ""}`}>
      <MarcaSitio academia={d.academia} claro={claro} />
      {d.academia.frase && <p className="st-pie__frase">{d.academia.frase}</p>}
      <p className="st-pie__legal">
        © {new Date().getFullYear()} {d.academia.nombre}. Tus datos se tratan según la Ley 19.628 y la Ley 21.719.
      </p>
    </footer>
  );
}