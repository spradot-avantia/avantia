"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Boton "Menu" + panel desplegable (movil). Se cierra al navegar. */
export function MobileMenu({ children }: { children: ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();
  const id = useId();
  const boton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  // Escape cierra el panel y devuelve el foco al botón.
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAbierto(false);
        boton.current?.focus();
      }
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [abierto]);

  return (
    <>
      <button
        ref={boton}
        type="button"
        className="cr-menu-btn"
        aria-expanded={abierto}
        aria-controls={id}
        onClick={() => setAbierto((v) => !v)}
      >
        {abierto ? "Cerrar" : "Menú"}
      </button>
      {abierto && (
        <div id={id} className="cr-drawer" style={{ position: "fixed", left: 0, right: 0, top: 60 }}>
          {children}
        </div>
      )}
    </>
  );
}
