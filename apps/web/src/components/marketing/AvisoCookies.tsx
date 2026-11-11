"use client";

// Aviso de cookies con consentimiento (Aceptar todo / Personalizar / Rechazar todo).
// Hoy el sitio usa solo cookies necesarias: las categorías opcionales quedan
// listas para cuando se agregue analítica o publicidad. Cualquier script de ese
// tipo debe cargarse SOLO si leerConsentimiento() lo permite (o al escuchar el
// evento "avantia:cookies"). La elección se guarda en este navegador.
import { useEffect, useState } from "react";

const CLAVE = "avantia-cookies-v1";
const ABRIR = "avantia:abrir-cookies";

export type Consentimiento = { analitica: boolean; personalizacion: boolean; fecha: string };

/** Lo que eligió la persona, o null si todavía no elige. */
export function leerConsentimiento(): Consentimiento | null {
  try {
    const v = window.localStorage.getItem(CLAVE);
    return v ? (JSON.parse(v) as Consentimiento) : null;
  } catch {
    return null;
  }
}

function guardarConsentimiento(analitica: boolean, personalizacion: boolean) {
  const c: Consentimiento = { analitica, personalizacion, fecha: new Date().toISOString() };
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(c));
  } catch {
    /* sin almacenamiento: se volverá a preguntar en la próxima visita */
  }
  window.dispatchEvent(new CustomEvent("avantia:cookies", { detail: c }));
}

const OPCIONALES = [
  { id: "analitica", titulo: "Analítica", texto: "Nos ayudan a entender cómo se usa el sitio para mejorarlo." },
  { id: "personalizacion", titulo: "Personalización y anuncios", texto: "Permiten mostrarte contenidos y anuncios según tus intereses." },
] as const;

export function AvisoCookies() {
  const [visible, setVisible] = useState(false);
  const [personalizar, setPersonalizar] = useState(false);
  const [elec, setElec] = useState({ analitica: false, personalizacion: false });

  useEffect(() => {
    if (!leerConsentimiento()) setVisible(true);
    // Permite reabrirlo desde el pie de página ("Preferencias de cookies").
    const abrir = () => {
      const c = leerConsentimiento();
      setElec({ analitica: !!c?.analitica, personalizacion: !!c?.personalizacion });
      setPersonalizar(true);
      setVisible(true);
    };
    window.addEventListener(ABRIR, abrir);
    return () => window.removeEventListener(ABRIR, abrir);
  }, []);

  function decidir(analitica: boolean, personalizacion: boolean) {
    guardarConsentimiento(analitica, personalizacion);
    setVisible(false);
    setPersonalizar(false);
  }

  if (!visible) return null;

  return (
    <section className="lp-cookies" role="region" aria-labelledby="lp-cookies-t">
      <h2 id="lp-cookies-t" className="lp-cookies__t">Valoramos tu privacidad</h2>

      {personalizar ? (
        <>
          <p>Elige qué cookies aceptas. Las necesarias siempre están activas porque sin ellas el sitio no funciona.</p>
          <ul className="lp-cookies__cats">
            <li>
              <div>
                <b>Necesarias</b>
                <span>Mantienen tu sesión y la seguridad del sitio.</span>
              </div>
              <span className="lp-cookies__siempre">Siempre activas</span>
            </li>
            {OPCIONALES.map((o) => (
              <li key={o.id}>
                <label htmlFor={`ck-${o.id}`}>
                  <b>{o.titulo}</b>
                  <span>{o.texto}</span>
                </label>
                <input
                  id={`ck-${o.id}`}
                  type="checkbox"
                  role="switch"
                  className="lp-switch"
                  checked={elec[o.id]}
                  onChange={(e) => setElec((x) => ({ ...x, [o.id]: e.target.checked }))}
                />
              </li>
            ))}
          </ul>
          <div className="lp-cookies__acc">
            <button type="button" className="av-btn av-btn--primary" onClick={() => decidir(elec.analitica, elec.personalizacion)}>
              Guardar mis preferencias
            </button>
            <button type="button" className="av-btn av-btn--secondary" onClick={() => decidir(true, true)}>
              Aceptar todo
            </button>
            <button type="button" className="av-btn av-btn--secondary" onClick={() => decidir(false, false)}>
              Rechazar todo
            </button>
          </div>
        </>
      ) : (
        <>
          <p>
            Usamos cookies necesarias para que el sitio funcione y, solo si lo aceptas, cookies para analizar nuestro tráfico y mostrarte contenidos
            personalizados. Al hacer clic en «Aceptar todo», das tu consentimiento para que las usemos. <a href="/privacidad#p11">Más información</a>
          </p>
          <div className="lp-cookies__acc">
            <button type="button" className="av-btn av-btn--primary" onClick={() => decidir(true, true)}>
              Aceptar todo
            </button>
            <button type="button" className="av-btn av-btn--secondary" onClick={() => setPersonalizar(true)}>
              Personalizar
            </button>
            <button type="button" className="av-btn av-btn--secondary" onClick={() => decidir(false, false)}>
              Rechazar todo
            </button>
          </div>
        </>
      )}
    </section>
  );
}

/** Enlace del pie de página para cambiar la elección cuando quiera. */
export function PreferenciasCookies() {
  return (
    <button type="button" className="lp-foot__btn" onClick={() => window.dispatchEvent(new Event(ABRIR))}>
      Preferencias de cookies
    </button>
  );
}