import { colorTexto, marcaOscura, textoSobre } from "../../../lib/creador/color";
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
  /** Muestra la vista en modo oscuro, con la variante oscura del color (elegida o automática). */
  oscuro?: boolean;
  colorOscuro?: string | null;
}

/**
 * "Así se verá": menú lateral y página del estudiante con la marca elegida.
 * Con `oscuro`, la misma vista en modo oscuro (siempre oscura, aunque el panel esté en claro).
 */
export function PreviewMarca({ nombre, frase, logoUrl, logoModo, color, tipografia, forma, idTitulo = "mk-prev-h", titulo = "Así se verá", oscuro = false, colorOscuro }: Props) {
  const nom = nombre.trim() || "Tu academia";
  const modo = logoUrl ? logoModo : "logo_y_nombre";
  // En oscuro, el color de la academia es su variante oscura; como texto sirve el mismo color.
  const marca = oscuro ? marcaOscura(color, colorOscuro) : color;
  const estilo = {
    ["--cr-brand" as string]: marca,
    ["--cr-on-brand" as string]: textoSobre(marca),
    ["--cr-brand-text" as string]: oscuro ? marca : colorTexto(marca),
  };
  // La vista clara lleva .av-claro para que el modo oscuro del panel no la cambie.
  const clases = `mk-prev ${oscuro ? "mk-prev--oscuro" : "av-claro"} ${clasesIdentidad(tipografia, forma)}`;
  return (
    <section className={clases} aria-labelledby={idTitulo} style={estilo}>
      <h3 className="mk-prev__t" id={idTitulo}>
        {titulo}
      </h3>
      <div className="mk-prev__fila">
        <figure className="mk-prev__caja">
          <div className="mk-prev__panel" aria-hidden="true">
            <div className="mk-prev__lado">
              <TenantMark nombre={nom} logoUrl={logoUrl} logoModo={modo} color={marca} colorOscuro={marca} />
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
            <TenantMark nombre={nom} logoUrl={logoUrl} logoModo={modo} color={marca} colorOscuro={marca} />
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
