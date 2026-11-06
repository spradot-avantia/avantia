"use client";

// Índice de la lección («En esta lección», ADR 033): enlaces a los títulos del texto y marca
// de la sección que se está leyendo. Se queda fijo al hacer scroll (sticky, en el CSS).
import { useEffect, useState } from "react";
import type { EntradaIndice } from "../../lib/creador/markdown";
import { PanelPlegable } from "./PanelPlegable";

/** Distancia desde el borde superior a partir de la cual un título cuenta como «ya leído». */
const UMBRAL_PX = 120;

export function IndiceLeccion({ entradas }: { entradas: EntradaIndice[] }) {
  const [activo, setActivo] = useState<string | null>(entradas[0]?.id ?? null);

  useEffect(() => {
    let pendiente = false;
    const calcular = () => {
      pendiente = false;
      let actual = entradas[0]?.id ?? null;
      for (const e of entradas) {
        const el = document.getElementById(e.id);
        if (el && el.getBoundingClientRect().top <= UMBRAL_PX) actual = e.id;
      }
      setActivo(actual);
    };
    const alMover = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(calcular);
    };
    calcular();
    window.addEventListener("scroll", alMover, { passive: true });
    window.addEventListener("resize", alMover);
    return () => {
      window.removeEventListener("scroll", alMover);
      window.removeEventListener("resize", alMover);
    };
  }, [entradas]);

  return (
    <PanelPlegable id="al-indice" titulo="En esta lección" variante="toc">
      <nav aria-label="En esta lección">
        <ol className="al-toc">
          {entradas.map((e) => (
            <li key={e.id} className={`al-toc__item al-toc__item--${e.nivel}`}>
              <a href={`#${e.id}`} aria-current={e.id === activo ? "location" : undefined}>
                {e.texto}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </PanelPlegable>
  );
}
