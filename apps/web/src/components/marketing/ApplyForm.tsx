"use client";

import { useRef, useState, type FormEvent } from "react";
import { EMAIL_RE, useSignup } from "./SignupContext";

const INDUSTRIES = [
  "Minería y energía",
  "Construcción e infraestructura",
  "Logística y cadena de suministro",
  "Retail y consumo",
  "Servicios financieros",
  "Salud",
  "Tecnología",
  "Otra",
];

type Field = "name" | "email" | "industry";

export function ApplyForm() {
  const { email, setEmail } = useSignup();
  const emailRef = useRef<HTMLInputElement>(null);
  const industryRef = useRef<HTMLSelectElement>(null);
  const [name, setName] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const [industry, setIndustry] = useState("");
  const [invalid, setInvalid] = useState<Field | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean }>({ text: "", ok: false });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const error: [Field, string, () => void] | null = !name.trim()
      ? ["name", "Escribe tu nombre.", () => nameRef.current?.focus()]
      : !EMAIL_RE.test(email.trim())
        ? ["email", "Revisa tu correo: debe tener la forma nombre@dominio.com.", () => emailRef.current?.focus()]
        : !industry
          ? ["industry", "Elige tu industria.", () => industryRef.current?.focus()]
          : null;

    if (error) {
      setInvalid(error[0]);
      setMsg({ text: error[1], ok: false });
      error[2]();
      return;
    }

    setInvalid(null);
    // TODO: enviar el registro a la API (por ejemplo, un route handler en app/api/).
    setMsg({
      text: `Gracias, ${name.trim().split(" ")[0]}. Esta página es un prototipo y el registro todavía no se guarda.`,
      ok: true,
    });
  }

  return (
    <form id="apply-form" noValidate onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="ap-name">Nombre</label>
        <input
          ref={nameRef}
          id="ap-name"
          name="name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={invalid === "name" || undefined}
        />
      </div>
      <div className="field">
        <label htmlFor="ap-email">Correo</label>
        <input
          ref={emailRef}
          id="ap-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={invalid === "email" || undefined}
        />
      </div>
      <div className="field">
        <label htmlFor="ap-ind">Tu industria</label>
        <select
          ref={industryRef}
          id="ap-ind"
          name="industry"
          required
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          aria-invalid={invalid === "industry" || undefined}
        >
          <option value="">Elige una opción</option>
          {INDUSTRIES.map((i) => (
            <option key={i}>{i}</option>
          ))}
        </select>
      </div>
      <button className="btn btn-primary" type="submit">Crear mi cuenta de Creador</button>
      <p className={`form-msg${msg.ok ? " ok" : ""}`} role="status" aria-live="polite">
        {msg.text}
      </p>
      <p className="alt">
        ¿Buscas formar a tu equipo? <a href="#para-quien">Conoce Avantia para empresas</a>.
      </p>
    </form>
  );
}