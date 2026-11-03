import type { ReactNode } from "react";
import { PlantillaSitio } from "../../sitio/PlantillaSitio";
import type { DatosSitio } from "../../../lib/sitio/tipos";
import "./pagina.css";

/** Marco de navegador con la página de la academia adentro (vista previa). */
export function VistaNavegador({ d, direccion, libre, children }: { d?: DatosSitio; direccion: string; libre?: boolean; children?: ReactNode }) {
  return (
    <div className="pg-nav">
      <div className="pg-nav__barra" aria-hidden="true">
        <i />
        <i />
        <i />
        <span className="pg-nav__url">{direccion}</span>
      </div>
      <div className={`pg-nav__cuerpo${libre ? " pg-nav__cuerpo--libre" : ""}`} aria-label="Vista previa de tu página" role="region">
        {d ? <PlantillaSitio d={d} /> : children}
      </div>
    </div>
  );
}