"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { THEMES } from "./content";
import { Icon } from "./icons";

/** Escenario del hero: academia de ejemplo que cambia de marca (autorrota salvo prefers-reduced-motion). */
export function BrandStage() {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  const t = THEMES[i];

  useEffect(() => {
    if (!auto || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((x) => (x + 1) % THEMES.length), 3000);
    return () => clearInterval(id);
  }, [auto]);

  return (
    <div className="lp-stage" style={{ "--brand": t.c } as CSSProperties}>
      <span className="av-badge av-badge--neutral lp-ex-tag">Vista de ejemplo</span>

      <div className="lp-browser lp-back" aria-hidden="true">
        <div className="lp-bbar">
          <span className="lp-dots"><i /><i /><i /></span>
          <span className="lp-url"><Icon name="lock" size={12} />www.tudominio.cl</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 16, width: "58%" }}>
          <div className="lp-ac-brand"><span className="lp-ac-mark">{t.initial}</span><span>{t.name}</span></div>
          <div className="lp-ac-cover" style={{ margin: 0 }}><small>Curso online</small><strong>{t.course}</strong><span>6 módulos</span></div>
        </div>
      </div>

      <div className="lp-phone" role="img" aria-label={`Academia de ejemplo con la marca de un Creador: ${t.name}`}>
        <div className="lp-scr">
          <div className="lp-notch"><span /></div>
          <div className="lp-ac-top">
            <div className="lp-ac-brand"><span className="lp-ac-mark">{t.initial}</span><span>{t.name}</span></div>
            <Icon name="menu" size={20} color="#0a1029" />
          </div>
          <div className="lp-ac-cover"><small>Curso online</small><strong>{t.course}</strong><span>www.tudominio.cl</span></div>
          <div className="lp-ac-mods">
            {t.m.map((m, k) => (
              <div className="lp-ac-mod" key={m}>
                <span className="n">{k + 1}</span>
                <div><b>{m}</b><em>Módulo {k + 1}</em></div>
              </div>
            ))}
          </div>
          <div className="lp-ac-cta">Inscribirme</div>
        </div>
      </div>

      <div className="lp-swatches" role="group" aria-label="Probar otra marca">
        {THEMES.map((s, k) => (
          <button
            key={s.name}
            type="button"
            className={`lp-sw${k === i ? " is-on" : ""}`}
            style={{ background: s.c }}
            aria-pressed={k === i}
            aria-label={s.name}
            onClick={() => {
              setAuto(false);
              setI(k);
            }}
          />
        ))}
        <span>Cada academia, su marca</span>
      </div>
    </div>
  );
}
