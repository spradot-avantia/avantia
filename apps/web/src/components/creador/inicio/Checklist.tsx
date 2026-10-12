import Link from "next/link";
import { Badge } from "../Badge";
import "./inicio.css";

export interface PasoChecklist {
  titulo: string;
  detalle: string;
  hecho: boolean;
  /** Aun no se puede hacer (depende de un paso anterior). */
  bloqueado?: boolean;
  accion?: { href: string; label: string };
}

export function Checklist({ pasos }: { pasos: PasoChecklist[] }) {
  const hechos = pasos.filter((p) => p.hecho).length;
  return (
    <section className="ci-card" aria-labelledby="ci-check-t">
      <div className="ci-check__head">
        <h2 className="ci-card__title" id="ci-check-t">Tus pasos para abrir el piloto</h2>
        <span className="ci-check__count">{hechos} de {pasos.length}</span>
      </div>
      <div className="ci-bar" role="progressbar" aria-valuemin={0} aria-valuemax={pasos.length} aria-valuenow={hechos} aria-label="Pasos completados">
        <i style={{ width: `${(hechos / pasos.length) * 100}%` }} />
      </div>
      <ol className="ci-steps">
        {pasos.map((p, i) => (
          <li key={p.titulo} className={`ci-step${p.hecho ? " ci-step--hecho" : ""}${p.bloqueado ? " ci-step--bloqueado" : ""}`}>
            <span className="ci-step__dot" aria-hidden="true">{p.hecho ? "✓" : i + 1}</span>
            <div className="ci-step__body">
              <span className="ci-step__title">{p.titulo}</span>
              <span className="ci-muted">{p.hecho ? "Hecho" : p.detalle}</span>
            </div>
            <span className="ci-step__side">
              {p.hecho ? (
                <Badge tono="ok">Hecho</Badge>
              ) : p.accion && !p.bloqueado ? (
                <Link href={p.accion.href} className="ci-step__link">{p.accion.label}</Link>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
