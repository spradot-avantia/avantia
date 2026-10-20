import type { ReactNode } from "react";
import { GoogleG } from "./icons";

type Size = "lg" | "sm";

// Postulación al programa fundador: primero cuenta con Google y luego el
// formulario corto, ambos en /postular del host del panel (la sesión del
// creador vive solo ahí, ADR 003 y 011). Los CTA son enlaces simples.
export function postularHref(): string {
  return `${(process.env.NEXT_PUBLIC_PANEL_URL ?? "http://localhost:3000").replace(/\/+$/, "")}/postular`;
}

/** Botón (enlace) que lleva a la postulación. */
export function ApplyButton({ children, size = "lg" }: { children: ReactNode; size?: Size }) {
  return (
    <a className={`av-btn av-btn--primary av-btn--${size}`} href={postularHref()}>
      {children}
    </a>
  );
}

/** CTA principal (hero y cierre): postular entrando con Google. */
export function GoogleCta() {
  return (
    <div className="lp-capture">
      <a className="av-btn av-btn--primary av-btn--lg" href={postularHref()}>
        <span className="lp-g"><GoogleG size={18} /></span>
        Postula con tu cuenta de Google
      </a>
      <p className="av-legal">
        Al continuar aceptas los <a href="/terminos">términos y condiciones</a> y la <a href="/privacidad">política de privacidad</a>.
      </p>
    </div>
  );
}

/** Barra fija inferior en móvil (se oculta desde 900px por CSS). */
export function StickyBar() {
  return (
    <div className="lp-sticky">
      <div className="lp-sticky__lbl">
        <b>Programa fundador</b>
        <span>5 cupos · Programa gratis</span>
      </div>
      <a className="av-btn av-btn--primary av-btn--sm" href={postularHref()}>
        Postular
      </a>
    </div>
  );
}
