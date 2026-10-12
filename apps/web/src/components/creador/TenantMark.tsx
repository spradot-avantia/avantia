import { iniciales, textoSobre } from "../../lib/creador/color";
import type { LogoModo } from "../../lib/creador/types";
import "./creador.css";

interface Props {
  nombre: string;
  logoUrl?: string | null;
  logoModo?: LogoModo;
  /** Color primario del tenant (#rrggbb). */
  color: string;
  grande?: boolean;
}

/** Logo (si hay) o iniciales sobre el color del tenant, mas el nombre. */
export function TenantMark({ nombre, logoUrl, logoModo = "logo_y_nombre", color, grande }: Props) {
  const solo = !!logoUrl && logoModo === "solo_logo";
  const estilo = { ["--cr-brand" as string]: color, ["--cr-on-brand" as string]: textoSobre(color) };
  return (
    <div className={`cr-mark${grande ? " cr-mark--lg" : ""}${solo ? " cr-mark--solo" : ""}`} style={estilo}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- logo remoto por tenant, sin dominio fijo
        <img className="cr-mark__img" src={logoUrl} alt={solo ? nombre : ""} />
      ) : (
        <span className="cr-mark__badge" aria-hidden="true">
          {iniciales(nombre)}
        </span>
      )}
      {!solo && <span className="cr-mark__name">{nombre}</span>}
    </div>
  );
}
