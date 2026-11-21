"use client";

import { useRef, useState } from "react";
import { COOKIE_MENU } from "../../lib/creador/menuLateral";

/**
 * Pliega el menú lateral de escritorio a una barra de íconos (ADR 048) o lo despliega.
 * Cambia `data-menu` del shell al instante y recuerda la elección en una cookie de un año.
 */
export function BotonMenuLateral({ plegadoInicial }: { plegadoInicial: boolean }) {
  const [plegado, setPlegado] = useState(plegadoInicial);
  const boton = useRef<HTMLButtonElement>(null);

  function alternar() {
    const nuevo = !plegado;
    setPlegado(nuevo);
    const valor = nuevo ? "plegado" : "abierto";
    boton.current?.closest(".cr-shell")?.setAttribute("data-menu", valor);
    document.cookie = `${COOKIE_MENU}=${valor}; path=/; max-age=31536000; samesite=lax`;
  }

  const etiqueta = plegado ? "Expandir menú" : "Plegar menú";
  return (
    <button
      ref={boton}
      type="button"
      className="cr-side__toggle"
      onClick={alternar}
      aria-expanded={!plegado}
      aria-controls="cr-side"
      aria-label={etiqueta}
      title={etiqueta}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M4 5v14M9 12h11M15 7l5 5-5 5" />
      </svg>
    </button>
  );
}
