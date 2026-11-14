import { colorTexto, textoSobre } from "../../../lib/creador/color";
import { clasesIdentidad, type Forma, type Tipografia } from "../../../lib/tenant/identidad";
import type { LogoModo } from "../../../lib/creador/types";
import { TenantMark } from "../TenantMark";
import "../creador.css";
import "./marca.css";

interface Props {
  nombre: string;
  frase?: string;
  logoUrl: string | null;
  logoModo: LogoModo;
  color: string;
  /** Identidad visual (ADR 027). Sin valor: la apariencia de siempre. */
  tipografia?: Tipografia;
  forma?: Forma;
  /** Id y texto del título: distintos si la vista previa aparece más de una vez en la página. */
  idTitulo?: string;
  titulo?: string;
}

/** "Así se verá": menú lateral y página del estudiante con la marca elegida. */
export function PreviewMarca({ nombre, frase, logoUrl, logoModo, color, tipografia, forma, idTitulo = "mk-prev-h", titulo = "Así se verá" }: Props) {
  const nom = nombre.trim() || "Tu academia";
  const modo = logoUrl ? logoModo : "logo_y_nombre";
  const estilo = { ["--cr-brand" as string]: color, ["--cr-on-brand" as string]: textoSobre(color), ["--cr-brand-text" as string]: colorTexto(color) };
  return (
    <section className={`mk-prev ${clasesIdentidad(tipografia, forma)}`} aria-labelledby={idTitulo} style={estilo}>
      <h3 className="mk-prev__t" id={idTitulo}>
        {titulo}
      </h3>
      <div className="mk-prev__fila">
        <figure className="mk-prev__caja">
          <div className="mk-prev__panel" aria-hidden="true">
            <div className="mk-prev__lado">
              <TenantMark nombre={nom} logoUrl={logoUrl} logoModo={modo} color={color} />
              <span className="mk-prev__item mk-prev__item--on">Inicio</span>
              <span className="mk-prev__item">Cursos</span>
              <span className="mk-prev__item">Estudiantes</span>
            </div>
            <div className="mk-prev__main">
              <span className="mk-prev__banda">Hoy en tu academia</span>
              <span className="mk-prev__tarjeta" />
              <span className="mk-prev__tarjeta mk-prev__tarjeta--corta" />
            </div>
          </div>
          <figcaption className="mk-ayuda mk-prev__pie">Tu panel</figcaption>
        </figure>
        <figure className="mk-prev__caja mk-prev__caja--est">
          <div className="mk-prev__cab">
            <TenantMark nombre={nom} logoUrl={logoUrl} logoModo={modo} color={color} />
          </div>
          <div className="mk-prev__cuerpo">
            {frase?.trim() && <span className="mk-ayuda">{frase.trim()}</span>}
            <span className="mk-prev__l mk-prev__l--s" />
            <span className="mk-prev__l mk-prev__l--m" />
            <span className="mk-prev__prog">
              <i />
            </span>
            <span className="mk-prev__btn" aria-hidden="true">
              Continuar lección
            </span>
            <span className="mk-prev__enlace" aria-hidden="true">
              Un enlace
            </span>
          </div>
          <figcaption className="mk-ayuda mk-prev__pie">Página del estudiante</figcaption>
        </figure>
      </div>
    </section>
  );
}
