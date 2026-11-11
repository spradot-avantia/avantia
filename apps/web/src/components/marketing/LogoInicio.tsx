"use client";

// Logo de la barra superior: vuelve al inicio con un scroll rápido "de
// rebobinado" (acelera y frena). Se detiene si la persona hace scroll o toca
// la pantalla, y es instantáneo con movimiento reducido o sin JS (#top).
import type { MouseEvent, ReactNode } from "react";

/** Acelera al empezar y frena al llegar. */
const suavizar = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function rebobinar() {
  const inicio = window.scrollY;
  if (inicio <= 0) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo({ top: 0, behavior: "instant" });
    return;
  }

  // Más lejos, un poco más de tiempo, pero siempre rápido (máx. 0,9 s).
  const duracion = Math.min(900, 350 + inicio * 0.08);
  const t0 = performance.now();
  let cancelado = false;
  const parar = () => {
    cancelado = true;
  };
  const eventos = ["wheel", "touchstart", "keydown"] as const;
  eventos.forEach((ev) => window.addEventListener(ev, parar, { passive: true, once: true }));

  function paso(ahora: number) {
    const p = Math.min(1, (ahora - t0) / duracion);
    window.scrollTo({ top: Math.round(inicio * (1 - suavizar(p))), behavior: "instant" });
    if (p < 1 && !cancelado) requestAnimationFrame(paso);
    else eventos.forEach((ev) => window.removeEventListener(ev, parar));
  }
  requestAnimationFrame(paso);
}

export function LogoInicio({ children }: { children: ReactNode }) {
  function alHacerClic(e: MouseEvent<HTMLAnchorElement>) {
    // Ctrl/Cmd + clic o clic medio: que el navegador haga lo suyo.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    rebobinar();
  }

  return (
    <a className="lp-logo" href="#top" aria-label="avantia, inicio" onClick={alHacerClic}>
      {children}
    </a>
  );
}