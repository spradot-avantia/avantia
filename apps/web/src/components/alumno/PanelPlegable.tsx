"use client";

// Panel que en pantallas angostas se pliega detrás de un botón y en pantallas anchas se ve
// siempre abierto con un título fijo (ADR 033). El umbral lo define la variante en el CSS.
import { useState, type ReactNode } from "react";
import { IconoChevron } from "../ui/Iconos";

interface Props {
  id: string;
  titulo: string;
  /** `sil` pliega bajo 900 px (syllabus); `toc` pliega bajo 1180 px (índice de la lección). */
  variante: "sil" | "toc";
  children: ReactNode;
}

export function PanelPlegable({ id, titulo, variante, children }: Props) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className={`al-pp al-pp--${variante}`} data-abierto={abierto ? "true" : undefined}>
      <button type="button" className="al-pp__toggle" aria-expanded={abierto} aria-controls={id} onClick={() => setAbierto((a) => !a)}>
        <span>{titulo}</span>
        <span className="al-pp__chev" aria-hidden="true">
          <IconoChevron dir={abierto ? "arriba" : "abajo"} tam={18} />
        </span>
      </button>
      <p className="al-pp__titulo">{titulo}</p>
      {/* Al elegir un enlace en pantalla angosta, el panel se cierra para dejar ver el contenido. */}
      <div id={id} className="al-pp__cuerpo" onClick={(e) => (e.target as HTMLElement).closest("a") && setAbierto(false)}>
        {children}
      </div>
    </div>
  );
}
