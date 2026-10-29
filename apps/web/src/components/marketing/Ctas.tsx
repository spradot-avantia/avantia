import type { ReactNode } from "react";

type Size = "lg" | "sm";

// Postulación al programa fundador: cuenta (correo o Google) y luego el
// formulario corto, ambos en /postular del host del panel (ADR 011 y 013).
// Los CTA son enlaces simples.
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

export function loginHref(): string {
  return `${(process.env.NEXT_PUBLIC_PANEL_URL ?? "http://localhost:3000").replace(/\/+$/, "")}/login`;
}

/** CTA principal (hero y cierre): postular, o ingresar si ya tiene cuenta. */
export function PostularCta() {
  return (
    <div className="lp-capture">
      <ApplyButton>Postula al programa fundador</ApplyButton>
      <p className="av-legal">
        ¿Ya tienes cuenta? <a href={loginHref()}>Ingresar a mi academia</a>
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
