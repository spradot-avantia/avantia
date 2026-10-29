"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  restablecerContrasenaAction,
  signInAction,
  signInWithGoogleAction,
  signUpAction,
  solicitarRecuperacionAction,
} from "../../../lib/auth/actions";
import { evaluarContrasena, LARGO_MIN_CONTRASENA } from "../../../lib/auth/contrasena";
import { ESTADO_INICIAL, type EstadoForm } from "../../../lib/auth/estado";
import { Button } from "../Button";
import { Callout } from "../Callout";
import { Field, Input } from "../Field";
import "./auth.css";

function Enviar({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" bloque className="av-btn--lg" disabled={pending} aria-busy={pending}>
      {pending ? "Un momento…" : children}
    </Button>
  );
}

function IconoOjo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconoOjoTachado() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-2.9 3.9" />
      <path d="M6.6 6.6C3.7 8.5 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

/** Región aria-live para mensajes generales: siempre montada para que se anuncie. */
function Mensaje({ estado }: { estado: EstadoForm }) {
  return (
    <div className="au-msg" aria-live="polite" aria-atomic="true">
      {estado.mensaje && (
        <Callout tono={estado.ok ? "success" : "danger"}>{estado.mensaje}</Callout>
      )}
    </div>
  );
}

function CampoContrasena({
  id,
  label,
  name = "password",
  autoComplete,
  error,
  ayuda,
  onValor,
  indicador,
}: {
  id: string;
  label: string;
  name?: string;
  autoComplete: "current-password" | "new-password";
  error?: string;
  ayuda?: string;
  onValor?: (v: string) => void;
  indicador?: string;
}) {
  const [ver, setVer] = useState(false);
  const ev = indicador !== undefined ? evaluarContrasena(indicador) : null;
  return (
    <Field id={id} label={label} ayuda={ayuda} error={error}>
      <div className="au-pw">
        <Input
          id={id}
          name={name}
          type={ver ? "text" : "password"}
          autoComplete={autoComplete}
          invalido={!!error}
          conAyuda={!!ayuda}
          required
          onChange={onValor ? (e) => onValor(e.target.value) : undefined}
        />
        <button
          type="button"
          className="au-toggle"
          onClick={() => setVer((v) => !v)}
          aria-pressed={ver}
          aria-label="Mostrar contraseña"
          title={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {ver ? <IconoOjoTachado /> : <IconoOjo />}
        </button>
      </div>
      {ev && (
        <>
          <div className="au-meter" data-nivel={ev.nivel} aria-hidden="true">
            <i /><i /><i /><i />
          </div>
          <div className="au-meter-txt" aria-live="polite">
            {ev.nivel !== "vacia" && (ev.cumple ? `Seguridad: ${ev.etiqueta}. ${ev.ayuda ?? ""}` : ev.ayuda)}
          </div>
        </>
      )}
    </Field>
  );
}

export function FormLogin({ next, aviso }: { next: string; aviso?: { tono: "info" | "danger" | "success"; texto: string } | null }) {
  const [estado, accion] = useFormState(signInAction, ESTADO_INICIAL);
  return (
    <form action={accion} className="au-form" noValidate>
      {aviso && <Callout tono={aviso.tono}>{aviso.texto}</Callout>}
      <input type="hidden" name="next" value={next} />
      <Field id="email" label="Correo electrónico" error={estado.errores?.email}>
        <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" defaultValue={estado.valores?.email} invalido={!!estado.errores?.email} required />
      </Field>
      <CampoContrasena id="password" label="Contraseña" autoComplete="current-password" error={estado.errores?.password} />
      <Mensaje estado={estado} />
      <Enviar>Ingresar</Enviar>
      <div className="au-links">
        <Link href="/olvide-contrasena">Olvidé mi contraseña</Link>
      </div>
    </form>
  );
}

export function FormSignup({ next = "/inicio" }: { next?: string }) {
  const [estado, accion] = useFormState(signUpAction, ESTADO_INICIAL);
  const [pw, setPw] = useState("");
  if (estado.ok) {
    return (
      <div aria-live="polite">
        <Callout tono="success" titulo="Revisa tu correo">
          {estado.mensaje} Cuando confirmes, volverás aquí. Si no, <Link className="au-inline-link" href={`/login?next=${encodeURIComponent(next)}`}>ingresa</Link>.
        </Callout>
      </div>
    );
  }
  return (
    <form action={accion} className="au-form" noValidate>
      <input type="hidden" name="next" value={next} />
      <Field id="nombre" label="Tu nombre" opcional error={estado.errores?.nombre}>
        <Input id="nombre" name="nombre" autoComplete="name" defaultValue={estado.valores?.nombre} invalido={!!estado.errores?.nombre} />
      </Field>
      <Field id="email" label="Correo" error={estado.errores?.email}>
        <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" defaultValue={estado.valores?.email} invalido={!!estado.errores?.email} required />
      </Field>
      <CampoContrasena
        id="password"
        label="Contraseña"
        autoComplete="new-password"
        ayuda={`Mínimo ${LARGO_MIN_CONTRASENA} caracteres.`}
        error={estado.errores?.password}
        onValor={setPw}
        indicador={pw}
      />
      <div className="cr-field">
        <label className="au-check" htmlFor="terminos">
          <input id="terminos" name="terminos" type="checkbox" aria-invalid={estado.errores?.terminos ? true : undefined} aria-describedby={estado.errores?.terminos ? "terminos-error" : undefined} />
          {/* TODO(RQ-29): enlazar términos y política de privacidad cuando existan las páginas legales. */}
          <span>Acepto los términos de uso y la política de privacidad de Avantia.</span>
        </label>
        {estado.errores?.terminos && (
          <span className="cr-field__error" id="terminos-error" role="alert">{estado.errores.terminos}</span>
        )}
      </div>
      <Mensaje estado={estado} />
      <Enviar>Crear mi cuenta</Enviar>
    </form>
  );
}

export function FormOlvide({ aviso }: { aviso?: string | null }) {
  const [estado, accion] = useFormState(solicitarRecuperacionAction, ESTADO_INICIAL);
  return (
    <form action={accion} className="au-form" noValidate>
      {aviso && <Callout tono="danger">{aviso}</Callout>}
      <Field id="email" label="Correo de tu cuenta" error={estado.errores?.email}>
        <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" defaultValue={estado.valores?.email} invalido={!!estado.errores?.email} required />
      </Field>
      <Mensaje estado={estado} />
      <Enviar>Enviarme el enlace</Enviar>
      <div className="au-links">
        <Link href="/login">Volver a ingresar</Link>
      </div>
    </form>
  );
}

export function FormRestablecer() {
  const [estado, accion] = useFormState(restablecerContrasenaAction, ESTADO_INICIAL);
  const [pw, setPw] = useState("");
  return (
    <form action={accion} className="au-form" noValidate>
      <CampoContrasena
        id="password"
        label="Nueva contraseña"
        autoComplete="new-password"
        ayuda={`Mínimo ${LARGO_MIN_CONTRASENA} caracteres.`}
        error={estado.errores?.password}
        onValor={setPw}
        indicador={pw}
      />
            <CampoContrasena id="password" label="Contraseña" autoComplete="current-password" error={estado.errores?.password} />
      <Mensaje estado={estado} />
      <Enviar>Guardar contraseña</Enviar>
    </form>
  );
}

export function BotonGoogle({ next }: { next: string }) {
  return (
    <form action={signInWithGoogleAction}>
      <input type="hidden" name="next" value={next} />
      <EnviarGoogle />
    </form>
  );
}

function EnviarGoogle() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="av-btn av-btn--secondary av-btn--lg"
      style={{ width: "100%" }}
      disabled={pending}
      aria-busy={pending}
    >
      <GoogleIcon />
      {pending ? "Conectando con Google…" : "Continuar con Google"}
    </button>
  );
}

/** Logo "G" oficial de Google, el que piden sus pautas para botones de inicio de sesión. */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}