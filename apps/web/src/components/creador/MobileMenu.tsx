"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Boton "Menu" + panel desplegable (movil). Se cierra al navegar. */
export function MobileMenu({ children }: { children: ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();
  const id = useId();

  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  return (
    <>
      <button
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
