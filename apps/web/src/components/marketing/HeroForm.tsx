"use client";

import { useRef, useState, type FormEvent } from "react";
import { EMAIL_RE, scrollBehavior, useSignup } from "./SignupContext";

export function HeroForm() {
  const { setEmail } = useSignup();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean }>({ text: "", ok: false });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const email = value.trim();
    if (!EMAIL_RE.test(email)) {
      setInvalid(true);
      setMsg({ text: "Revisa tu correo: debe tener la forma nombre@dominio.com.", ok: false });
      inputRef.current?.focus();
      return;
    }
    setInvalid(false);
    setEmail(email);
    setMsg({ text: "Bien. Completa dos datos más abajo para crear tu cuenta.", ok: true });
    document.getElementById("crear")?.scrollIntoView({ behavior: scrollBehavior() });
    setTimeout(() => document.getElementById("ap-name")?.focus({ preventScroll: true }), 500);
  }

  return (
    <>
      <form className="capture" id="hero-form" noValidate onSubmit={onSubmit}>
        <label htmlFor="hero-email" className="sr-only">Tu correo</label>
        <input
          ref={inputRef}
          id="hero-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={invalid || undefined}
        />
        <button className="btn btn-primary" type="submit">Empieza a crear</button>
      </form>
      <p className={`form-msg${msg.ok ? " ok" : ""}`} role="status" aria-live="polite">
        {msg.text}
      </p>
    </>
  );
}