"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { EMAIL_RE, useSignup } from "./SignupContext";

type Size = "lg" | "sm";

/** Botón que abre el sheet de postulación. */
export function ApplyButton({ children, size = "lg" }: { children: ReactNode; size?: Size }) {
  const { openSheet } = useSignup();
  return (
    <button type="button" className={`av-btn av-btn--primary av-btn--${size}`} onClick={() => openSheet(false)}>
      {children}
    </button>
  );
}

/** Captura de correo (hero y cierre): valida y abre el sheet con el correo precargado. */
export function EmailCapture({ id }: { id: string }) {
  const { email, setEmail, openSheet } = useSignup();
  const [invalid, setInvalid] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (email.trim() && !EMAIL_RE.test(email.trim())) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    openSheet(true);
  }

  return (
    <form className="lp-capture" noValidate onSubmit={onSubmit}>
      <div className="lp-capture__row">
        <label className="av-sr-only" htmlFor={id}>Tu correo</label>
        <input
          className="av-input"
          id={id}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          value={email}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${id}-err` : undefined}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="av-btn av-btn--primary av-btn--lg" type="submit">
          Postula al programa fundador
        </button>
      </div>
      {invalid && (
        <p id={`${id}-err`} className="av-legal" role="alert">
          Revisa tu correo: debe tener la forma nombre@dominio.com.
        </p>
      )}
      <p className="av-legal">
        Al continuar aceptas la <a href="#privacidad">política de privacidad</a>.
      </p>
    </form>
  );
}

/** Barra fija inferior en móvil (se oculta desde 900px por CSS). */
export function StickyBar() {
  const { openSheet } = useSignup();
  return (
    <div className="lp-sticky">
      <div className="lp-sticky__lbl">
        <b>Programa fundador</b>
        <span>5 cupos · 30 días gratis</span>
      </div>
      <button type="button" className="av-btn av-btn--primary av-btn--sm" onClick={() => openSheet(false)}>
        Postular
      </button>
    </div>
  );
}
