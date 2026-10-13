"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  restablecerContrasenaAction,
  signInAction,
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
        <button type="button" className="au-toggle" onClick={() => setVer((v) => !v)} aria-pressed={ver}>
          {ver ? "Ocultar" : "Mostrar"}
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
      <Field id="email" label="Correo" error={estado.errores?.email}>
        <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" defaultValue={estado.valores?.email} invalido={!!estado.errores?.email} required />
      </Field>
      <CampoContrasena id="password" label="Contraseña" autoComplete="current-password" error={estado.errores?.password} />
      <Mensaje estado={estado} />
      <Enviar>Ingresar</Enviar>
      <div className="au-links">
        <Link href="/olvide-contrasena">Olvidé mi contraseña</Link>
        <Link href="/signup">Crear una cuenta</Link>
      </div>
    </form>
  );
}

export function FormSignup() {
  const [estado, accion] = useFormState(signUpAction, ESTADO_INICIAL);
  const [pw, setPw] = useState("");
  if (estado.ok) {
    return (
      <div aria-live="polite">
        <Callout tono="success" titulo="Revisa tu correo">
          {estado.mensaje} Cuando confirmes, vuelve a <Link className="au-inline-link" href="/login">ingresar</Link>.
        </Callout>
      </div>
    );
  }
  return (
    <form action={accion} className="au-form" noValidate>
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
        ayuda={`Mínimo ${LARGO_MIN_CONTRASENA} caracteres. Una frase larga es más segura que una palabra con símbolos.`}
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
      <div className="au-links">
        <Link href="/login">Ya tengo cuenta</Link>
      </div>
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
      <CampoContrasena id="confirmacion" name="confirmacion" label="Repite la nueva contraseña" autoComplete="new-password" error={estado.errores?.confirmacion} />
      <Mensaje estado={estado} />
      <Enviar>Guardar contraseña</Enviar>
    </form>
  );
}
