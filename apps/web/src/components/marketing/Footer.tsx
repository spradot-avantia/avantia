"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

const STORAGE_KEY = "av-dys";

const COLUMNS = [
  { title: "Plataforma", links: [["Estudio con IA", "#producto"], ["Comunidad", "#producto"], ["Analítica", "#producto"]] },
  { title: "Para", links: [["Creadores", "#para-quien"], ["Profesionales", "#para-quien"], ["Empresas", "#para-quien"]] },
  { title: "Recursos", links: [["Preguntas frecuentes", "#preguntas"], ["Cómo funciona", "#como"]] },
] as const;

export function Footer() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [dyslexia, setDyslexia] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  // Lee la preferencia guardada al montar (localStorage puede fallar en modo privado).
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") setDyslexia(true);
    } catch {}
  }, []);

  // Aplica la clase al contenedor de la landing, no al <body>.
  useEffect(() => {
    rootRef.current?.closest(".av-landing")?.classList.toggle("dyslexia", dyslexia);
  }, [dyslexia]);

  function toggleDyslexia(on: boolean) {
    setDyslexia(on);
    try {
      localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
    } catch {}
  }

  return (
    <footer ref={rootRef}>
      <div className="wrap">
        <div className="foot-top">
          <a className="brand" href="#top" aria-label="avantia, inicio">
            <Icon id="mono" />
            avantia
          </a>
          <span className="tagline">Learning. Forward.</span>
        </div>

        <div className="foot-cols">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <a href={href}>{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4>Legal</h4>
            <ul>
              <li>
                <a href="#trust-title">Privacidad</a>
              </li>
              <li>
                <button
                  type="button"
                  className="link-btn"
                  aria-expanded={panelOpen}
                  aria-controls="a11y-panel"
                  onClick={() => setPanelOpen((o) => !o)}
                >
                  Accesibilidad
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="a11y-panel" id="a11y-panel" hidden={!panelOpen}>
          <h3>Declaración de accesibilidad</h3>
          <p>
            Diseñamos este sitio siguiendo las pautas WCAG 2.1 nivel AA: contraste suficiente, navegación completa
            con teclado y compatibilidad con lectores de pantalla. Si tu sistema pide reducir el movimiento, el sitio
            lo respeta.
          </p>
          <label className="toggle">
            <input type="checkbox" checked={dyslexia} onChange={(e) => toggleDyslexia(e.target.checked)} />
            Activar lectura más espaciada
          </label>
          <p className="fine">Si encuentras una barrera, escríbenos y la corregimos.</p>
        </div>

        <p className="fine">© 2026 Avantia.</p>
      </div>
    </footer>
  );
}