"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Aparición al entrar en pantalla, una sola vez (sin fijar el scroll). Devuelve
 * la ref del elemento y las clases `nombre` (por defecto `lp-pop`) / `is-in`. Sin JS, sin
 * IntersectionObserver o con movimiento reducido, el contenido se ve de inmediato.
 */
export function useAparecer<T extends HTMLElement = HTMLDivElement>(umbral = 0.25, nombre = "lp-pop") {
  const ref = useRef<T>(null);
  const [anim, setAnim] = useState(false);
  const [dentro, setDentro] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setAnim(true);
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setDentro(true);
          obs.disconnect();
        }
      },
      { threshold: umbral },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [umbral]);

  return { ref, clase: `${anim ? ` ${nombre}` : ""}${dentro ? " is-in" : ""}` };
}