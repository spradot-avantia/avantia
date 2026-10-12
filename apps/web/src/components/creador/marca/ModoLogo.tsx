"use client";

import { useId } from "react";
import type { LogoModo } from "../../../lib/creador/types";
import "../creador.css";
import "./marca.css";

/** "Cómo se muestra": logo y nombre / solo logo (solo si hay logo). */
export function ModoLogo({ value, onChange }: { value: LogoModo; onChange: (m: LogoModo) => void }) {
  const id = useId();
  return (
    <div className="cr-field">
      <span className="cr-field__label" id={`${id}-l`}>
        Cómo se muestra
      </span>
      <div className="mk-seg" role="group" aria-labelledby={`${id}-l`}>
        <button type="button" aria-pressed={value === "logo_y_nombre"} onClick={() => onChange("logo_y_nombre")}>
          Logo y nombre
        </button>
        <button type="button" aria-pressed={value === "solo_logo"} onClick={() => onChange("solo_logo")}>
          Solo logo
        </button>
      </div>
      <span className="cr-field__hint">Usa “Solo logo” si tu logo ya incluye el nombre de la academia.</span>
    </div>
  );
}
