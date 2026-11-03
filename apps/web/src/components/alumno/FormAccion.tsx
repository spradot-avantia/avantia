"use client";

import { useEffect, type ReactNode } from "react";
import { useFormState } from "react-dom";
import type { EstadoForm } from "../../lib/alumno/cuentas";
import "./alumno.css";

/**
 * Formulario de una Server Action que puede terminar en un cambio de página.
 * Navega con `window.location.assign` (petición normal, pasa por el middleware
 * que traduce el dominio de la academia) en vez de redirect() del servidor.
 */
export function FormAccion({
  action,
  children,
  className,
}: {
  action: (estado: EstadoForm, fd: FormData) => Promise<EstadoForm>;
  children: ReactNode;
  className?: string;
}) {
  const [estado, accion] = useFormState(action, {} as EstadoForm);
  useEffect(() => {
    if (estado.ok && estado.irA) window.location.assign(estado.irA);
  }, [estado]);
  return (
    <form action={accion} className={className}>
      {children}
      {estado.error && (
        <p className="al-alert al-alert--error" role="alert" style={{ marginTop: 8 }}>
          {estado.error}
        </p>
      )}
    </form>
  );
}
