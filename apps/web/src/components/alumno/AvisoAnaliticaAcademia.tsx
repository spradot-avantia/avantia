"use client";

// Aviso de analítica en el sitio de la academia (ADR 040). Solo pregunta por la analítica de uso;
// las cookies necesarias (sesión) no requieren consentimiento. Marca: la de la academia, nunca
// Avantia. La elección vive en este navegador (localStorage del dominio de la academia).
import { useEffect, useState } from "react";
import { guardarConsentimiento, leerConsentimiento } from "../marketing/AvisoCookies";
import { analiticaActiva } from "../../lib/analitica/config";

const ABRIR = "avantia:abrir-cookies";

export function AvisoAnaliticaAcademia({ academia }: { academia: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!analiticaActiva()) return;
    if (!leerConsentimiento()) setVisible(true);
    const abrir = () => setVisible(true);
    window.addEventListener(ABRIR, abrir);
    return () => window.removeEventListener(ABRIR, abrir);
  }, []);

  function decidir(acepta: boolean) {
    guardarConsentimiento(acepta, false);
    setVisible(false);
  }

  if (!visible) return null;
  return (
    <section className="al-cookies" role="region" aria-labelledby="al-cookies-t">
      <h2 id="al-cookies-t" className="al-cookies__t">
        Ayúdanos a mejorar tu aprendizaje
      </h2>
      <p>
        {academia} mide, de forma anónima, cómo usas las lecciones y los quizzes (por ejemplo, cuánto tiempo pasas en una lección) para mejorarlos. No
        guardamos tu nombre ni tu correo en esa medición. <a href="/privacidad">Más información</a>
      </p>
      <div className="al-cookies__acc">
        <button type="button" className="al-btn" onClick={() => decidir(true)}>
          Aceptar
        </button>
        <button type="button" className="al-btn al-btn--sec" onClick={() => decidir(false)}>
          Rechazar
        </button>
      </div>
    </section>
  );
}

/** Enlace del pie para cambiar la elección. No se muestra si la analítica está apagada. */
export function PreferenciasAnalitica() {
  if (!analiticaActiva()) return null;
  return (
    <button type="button" className="al-foot__btn" onClick={() => window.dispatchEvent(new Event(ABRIR))}>
      Preferencias de medición
    </button>
  );
}
