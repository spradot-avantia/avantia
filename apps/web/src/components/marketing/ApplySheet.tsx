"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { GoogleG, Icon } from "./icons";
import { EMAIL_RE, useSignup } from "./SignupContext";

type Field = "email" | "name" | "url" | "students";

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Sheet de postulación al programa fundador (modal accesible: foco atrapado,
 * Escape cierra, el foco vuelve al disparador).
 * Registro/ingreso de creadores: solo Google -> /registro. El formulario de
 * postulación es la lista de espera del programa y todavía no persiste datos.
 */
export function ApplySheet() {
  const { email, setEmail, fromEmail, closeSheet } = useSignup();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  const [invalid, setInvalid] = useState<Field | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [students, setStudents] = useState("");

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheetRef.current?.querySelector<HTMLElement>("input, button")?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeSheet();
        return;
      }
      if (e.key !== "Tab" || !sheetRef.current) return;
      const items = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [closeSheet]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const err: [Field, string] | null = !EMAIL_RE.test(email.trim())
      ? ["email", "Revisa tu correo: debe tener la forma nombre@dominio.com."]
      : !name.trim()
        ? ["name", "Escribe tu nombre."]
        : null;
    if (err) {
      setInvalid(err[0]);
      setError(err[1]);
      sheetRef.current?.querySelector<HTMLElement>(`[data-field="${err[0]}"]`)?.focus();
      return;
    }
    setInvalid(null);
    setError("");
    // TODO: enviar la postulación a una API (route handler en app/api/) cuando exista.
    setDone(true);
  }

  return (
    <div className="lp-veil" onMouseDown={(e) => e.target === e.currentTarget && closeSheet()}>
      <div ref={sheetRef} className="lp-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div className="lp-grab" aria-hidden="true" />
        {!done ? (
          <div>
            <div className="lp-sh-head">
              <div>
                {fromEmail && <p className="lp-stepper">Paso 2 de 2</p>}
                <h2 id="sheet-title">Postula al programa fundador</h2>
              </div>
              <CloseButton onClick={closeSheet} />
            </div>

            <Link className="av-btn av-btn--secondary av-btn--lg lp-google" href="/registro">
              <GoogleG /> Continuar con Google
            </Link>
            <p className="lp-or" aria-hidden="true"><span>o déjanos tus datos y te escribimos</span></p>

            <form className="lp-form" noValidate onSubmit={onSubmit}>
              <div className="lp-fld">
                <label htmlFor="f-email">Correo</label>
                <input className="av-input" id="f-email" data-field="email" type="email" autoComplete="email" inputMode="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={invalid === "email" || undefined} />
              </div>
              <div className="lp-fld">
                <label htmlFor="f-name">Nombre</label>
                <input className="av-input" id="f-name" data-field="name" type="text" autoComplete="name" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={invalid === "name" || undefined} />
              </div>
              <div className="lp-fld">
                <label htmlFor="f-url">LinkedIn o web de tu programa</label>
                <input className="av-input" id="f-url" data-field="url" type="url" inputMode="url" placeholder="linkedin.com/in/tu-perfil" value={url} onChange={(e) => setUrl(e.target.value)} />
              </div>
              <div className="lp-fld">
                <label htmlFor="f-students">¿Cuántos alumnos tienes al año, aprox.?</label>
                <select className="av-input" id="f-students" data-field="students" value={students} onChange={(e) => setStudents(e.target.value)}>
                  <option value="">Elige una opción</option>
                  <option value="lt30">Menos de 30</option>
                  <option value="30-100">30 a 100</option>
                  <option value="100-300">100 a 300</option>
                  <option value="gt300">Más de 300</option>
                </select>
              </div>
              <p className="av-legal lp-err" role="alert">{error}</p>
              <button className="av-btn av-btn--primary av-btn--lg" type="submit" style={{ width: "100%" }}>
                Enviar postulación
              </button>
              <p className="av-legal" style={{ textAlign: "center" }}>
                Sin tarjeta y sin compromiso. Al enviar aceptas la <a href="#privacidad" onClick={closeSheet}>política de privacidad</a>.
              </p>
              <p className="lp-pnote">Vista previa: este formulario todavía no envía datos.</p>
            </form>
          </div>
        ) : (
          <div className="lp-done">
            <div className="lp-sh-head" style={{ margin: 0 }}>
              <span className="lp-done-ico"><Icon name="check" size={26} /></span>
              <CloseButton onClick={closeSheet} />
            </div>
            <h2 id="sheet-title">Recibimos tu postulación</h2>
            <p>Revisaremos tu perfil y te escribiremos. Si el primer grupo ya está completo, quedarás en la lista de espera para el siguiente.</p>
            <div className="lp-done-box">
              <b>¿Quieres verlo antes?</b>
              <a className="av-link" href="#agenda" onClick={closeSheet}>
                Agenda 20 minutos con el equipo <Icon name="arrow" size={16} />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="lp-close" type="button" aria-label="Cerrar" onClick={onClick}>
      <Icon name="x" size={18} />
    </button>
  );
}
