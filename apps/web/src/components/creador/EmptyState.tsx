import type { ReactNode } from "react";
import "./creador.css";
import "./cursos/lista.css";

type Ilustracion = "cursos" | "estudiantes" | "inscripciones";

/** Ilustración geométrica (solo formas) con el color de la academia; decorativa. */
function Ilus({ tipo }: { tipo: Ilustracion }) {
  return (
    <svg className="ev-ilus" viewBox="0 0 112 84" aria-hidden="true" focusable="false">
      <rect className="ev-a" x="8" y="14" width="96" height="62" rx="14" />
      {tipo === "cursos" && (
        <>
          <rect className="ev-d" x="22" y="26" width="46" height="38" rx="8" />
          <rect className="ev-b" x="22" y="26" width="46" height="12" rx="6" />
          <rect className="ev-c" x="30" y="46" width="30" height="4" rx="2" />
          <rect className="ev-c" x="30" y="54" width="20" height="4" rx="2" />
          <circle className="ev-b" cx="82" cy="52" r="12" />
          <path d="M77 52h10M82 47v10" stroke="var(--av-surface)" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      {tipo === "estudiantes" && (
        <>
          <circle className="ev-b" cx="40" cy="38" r="11" />
          <path className="ev-b" d="M22 66c0-10 8-16 18-16s18 6 18 16z" />
          <circle className="ev-d" cx="74" cy="42" r="9" />
          <path className="ev-d" d="M60 66c0-8 6-13 14-13s14 5 14 13z" />
        </>
      )}
      {tipo === "inscripciones" && (
        <>
          <rect className="ev-d" x="24" y="24" width="64" height="16" rx="8" />
          <circle className="ev-b" cx="36" cy="32" r="5" />
          <rect className="ev-c" x="46" y="30" width="30" height="4" rx="2" />
          <rect className="ev-d" x="24" y="46" width="64" height="16" rx="8" />
          <circle className="ev-c" cx="36" cy="54" r="5" />
          <rect className="ev-c" x="46" y="52" width="22" height="4" rx="2" />
        </>
      )}
    </svg>
  );
}

export function EmptyState({
  titulo,
  descripcion,
  accion,
  ilustracion,
  titulo1,
}: {
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
  ilustracion?: Ilustracion;
  /** Usar h1 cuando la página no tiene otro título principal. */
  titulo1?: boolean;
}) {
  return (
    <div className="cr-empty">
      {ilustracion && <Ilus tipo={ilustracion} />}
      {titulo1 ? <h1 className="cr-empty__title">{titulo}</h1> : <h2 className="cr-empty__title">{titulo}</h2>}
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
