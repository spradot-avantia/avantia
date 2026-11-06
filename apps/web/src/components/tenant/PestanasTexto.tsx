"use client";

// Pestañas del texto de una lección (ADR 035). Patrón ARIA de pestañas con activación
// automática: flechas, Inicio y Fin mueven el foco; solo la pestaña activa está en el orden de Tab.
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export function PestanasTexto({ items }: { items: { titulo: string; contenido: ReactNode }[] }) {
  const base = useId();
  const [activa, setActiva] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const ir = (i: number) => {
    const n = (i + items.length) % items.length;
    setActiva(n);
    refs.current[n]?.focus();
  };
  const teclas = (e: KeyboardEvent) => {
    const mapa: Record<string, number> = {
      ArrowRight: activa + 1,
      ArrowLeft: activa - 1,
      Home: 0,
      End: items.length - 1,
    };
    if (e.key in mapa) {
      e.preventDefault();
      ir(mapa[e.key]);
    }
  };

  return (
    <div className="fc-tabs">
      <div role="tablist" className="fc-tabs__lista" onKeyDown={teclas}>
        {items.map((it, i) => (
          <button
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${base}-t${i}`}
            aria-selected={i === activa}
            aria-controls={`${base}-p${i}`}
            tabIndex={i === activa ? 0 : -1}
            className="fc-tabs__tab"
            onClick={() => setActiva(i)}
          >
            {it.titulo}
          </button>
        ))}
      </div>
      {items.map((it, i) => (
        <div key={i} role="tabpanel" id={`${base}-p${i}`} aria-labelledby={`${base}-t${i}`} hidden={i !== activa} className="fc-tabs__panel">
          {it.contenido}
        </div>
      ))}
    </div>
  );
}
