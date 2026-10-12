import Link from "next/link";
import "./creador.css";

export interface PasoStepper {
  id: string;
  titulo: string;
  /** Si se pasa, el paso es un enlace (el editor permite cualquier orden). */
  href?: string;
  hecho?: boolean;
}

/**
 * Stepper accesible. Movil: "Paso N de M" + barra de progreso. Escritorio:
 * lista de pasos. `actual` es el id del paso activo.
 */
export function Stepper({ pasos, actual, etiqueta = "Pasos" }: { pasos: PasoStepper[]; actual: string; etiqueta?: string }) {
  const idx = Math.max(0, pasos.findIndex((p) => p.id === actual));
  const pct = Math.round(((idx + 1) / pasos.length) * 100);
  return (
    <nav aria-label={etiqueta}>
      <div className="cr-stepper__compact">
        <span className="cr-stepper__compact-label">
          Paso {idx + 1} de {pasos.length} · <strong>{pasos[idx]?.titulo}</strong>
        </span>
        <div className="cr-stepper__bar" role="progressbar" aria-valuemin={1} aria-valuemax={pasos.length} aria-valuenow={idx + 1}>
          <i style={{ width: `${pct}%` }} />
        </div>
      </div>
      <ol className="cr-stepper__list">
        {pasos.map((p, i) => {
          const contenido = (
            <>
              <span className="cr-step__n">{p.hecho ? "✓" : i + 1}</span>
              {p.titulo}
            </>
          );
          const cls = `cr-step${p.hecho ? " cr-step--hecho" : ""}`;
          const aria = p.id === actual ? ({ "aria-current": "step" } as const) : {};
          return (
            <li key={p.id}>
              {p.href ? (
                <Link href={p.href} className={cls} {...aria}>
                  {contenido}
                </Link>
              ) : (
                <span className={cls} {...aria}>
                  {contenido}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
