"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Se dispara cuando el elemento ya subió hasta el 75 % inferior de la pantalla (no apenas
 * asoma por abajo), para que la animación se alcance a ver.
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
      { threshold: umbral, rootMargin: "0px 0px -25% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [umbral]);

  return { ref, clase: `${anim ? ` ${nombre}` : ""}${dentro ? " is-in" : ""}` };
}