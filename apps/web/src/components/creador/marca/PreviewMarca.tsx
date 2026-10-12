import { textoSobre } from "../../../lib/creador/color";
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
}

/** "Así se verá": menú lateral y página del estudiante con la marca elegida. */
export function PreviewMarca({ nombre, frase, logoUrl, logoModo, color }: Props) {
  const nom = nombre.trim() || "Tu academia";
  const modo = logoUrl ? logoModo : "logo_y_nombre";
  const estilo = { ["--cr-brand" as string]: color, ["--cr-on-brand" as string]: textoSobre(color) };
  return (
    <section className="mk-prev" aria-labelledby="mk-prev-h" style={estilo}>
      <h3 className="mk-ov" id="mk-prev-h">
        Así se verá
      </h3>
      <div className="mk-prev__fila">
        <figure className="mk-prev__caja">
          <div className="mk-prev__lado">
            <TenantMark nombre={nom} logoUrl={logoUrl} logoModo={modo} color={color} />
            <span className="mk-prev__item mk-prev__item--on" />
            <span className="mk-prev__item" />
          </div>
          <figcaption className="mk-ayuda mk-prev__pie">Menú lateral</figcaption>
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
