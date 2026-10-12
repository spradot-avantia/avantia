import type { ReactNode } from "react";
import "./creador.css";

export function EmptyState({ titulo, descripcion, accion }: { titulo: string; descripcion?: string; accion?: ReactNode }) {
  return (
    <div className="cr-empty">
      <h2 className="cr-empty__title">{titulo}</h2>
      {descripcion && <p className="cr-empty__desc">{descripcion}</p>}
      {accion}
    </div>
  );
}

/** Estado cuando no hay academia activa (sin sesion y sin DEMO_TENANT_SLUG valido). */
export function SinAcademia() {
  return (
    <EmptyState
      titulo="No encontramos tu academia"
      descripcion="Inicia sesión para entrar a tu espacio. En desarrollo, define DEMO_TENANT_SLUG con el subdominio de una academia (npm run db:seed crea ejemplos)."
    />
  );
}
