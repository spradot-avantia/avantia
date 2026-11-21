import Link from "next/link";
import "./inicio.css";

export interface ItemConfig {
  nombre: string;
  estado: string;
  listo: boolean;
  /** Sin acción: el ítem es solo informativo. */
  accion?: { href: string; label: string };
}

/** Qué falta para que la academia esté completa, con un enlace a cada ajuste. */
export function ConfiguracionAcademia({ items }: { items: ItemConfig[] }) {
  const listos = items.filter((i) => i.listo).length;
  return (
    <section className="ci-card" aria-labelledby="ci-conf-t">
      <div className="ci-check__head">
        <h2 className="ci-card__title" id="ci-conf-t">
          Configuración de tu academia
        </h2>
        <span className="ci-check__count">
          {listos} de {items.length} listos
        </span>
      </div>
      <ul className="ci-conf">
        {items.map((i) => (
          <li key={i.nombre} className="ci-conf__item">
            {i.listo ? (
              <svg className="ci-conf__ico ci-conf__ico--ok" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="m8 12.5 2.6 2.5L16 9.5" />
              </svg>
            ) : (
              <svg className="ci-conf__ico" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeDasharray="3 3" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
              </svg>
            )}
            <span className="ci-conf__txt">
              <span className="ci-conf__nombre">{i.nombre}</span>
              <span className="ci-conf__estado">
                <span className="ci-sr">{i.listo ? "Listo: " : "Pendiente: "}</span>
                {i.estado}
              </span>
            </span>
            {i.accion && (
              <Link href={i.accion.href} className="ci-conf__accion">
                {i.accion.label}
                <span className="ci-sr"> {i.nombre.toLowerCase()}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
