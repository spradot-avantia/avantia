"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  confirmarAction,
  confirmarCambioCorreoAction,
  ingresarAction,
  recuperarAction,
  registrarAction,
  reenviarConfirmacionAction,
  restablecerAction,
} from "../../lib/alumno/actions";
import type { EstadoForm } from "../../lib/alumno/cuentas";
import { evaluarContrasena } from "../../lib/auth/contrasena";
import "./alumno.css";

const VACIO: EstadoForm = {};

/** Navega cuando la acción devuelve `irA` (ver FormAccion: sin redirect() del servidor). */
function useIrA(estado: EstadoForm) {
  useEffect(() => {
    if (estado.ok && estado.irA) window.location.assign(estado.irA);
  }, [estado]);
}

export function Enviar({ children, bloque = true }: { children: React.ReactNode; bloque?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`al-btn${bloque ? " al-btn--block" : ""}`} disabled={pending} aria-disabled={pending}>
      {pending ? "Un momento…" : children}
    </button>
  );
}

export function Campo({
  id,
  label,
  error,
  ayuda,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="al-field">
      <label htmlFor={id}>{label}</label>
      {ayuda && (
        <span className="al-muted" id={`${id}-ayuda`}>
          {ayuda}
        </span>
      )}
      {children}
      {error && (
        <span className="al-error" id={`${id}-error`} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export function Resultado({ estado }: { estado: EstadoForm }) {
  if (estado.error && !estado.campos) {
    return (
      <p className="al-alert al-alert--error" role="alert">
        {estado.error}
      </p>
    );
  }
  return null;
}

export const aria = (id: string, error?: string, ayuda?: boolean) => ({
  "aria-invalid": error ? true : undefined,
  "aria-describedby": [ayuda ? `${id}-ayuda` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined,
});

export function FormRegistro({
  cursoSlug,
  origen,
  campana,
  emailInicial,
}: {
  cursoSlug?: string;
  origen?: string;
  campana?: string;
  emailInicial?: string;
}) {
  const [estado, accion] = useFormState(registrarAction, VACIO);
  const [clave, setClave] = useState("");
  const ev = evaluarContrasena(clave);
  const c = estado.campos ?? {};

  if (estado.ok) {
    return (
      <div className="al-stack" role="status">
        <p className="al-alert al-alert--ok">{estado.mensaje}</p>
        <p className="al-muted">
          Enviamos el enlace a <strong>{estado.correo}</strong>. Tócalo para activar tu cuenta y entrar.
        </p>
        <Link href="/ingresar" className="al-btn al-btn--sec al-btn--block">
          Ya confirmé mi correo
        </Link>
      </div>
    );
  }

  return (
    <form action={accion} className="al-form" noValidate>
      {cursoSlug && <input type="hidden" name="curso" value={cursoSlug} />}
      {origen && <input type="hidden" name="origen" value={origen} />}
      {campana && <input type="hidden" name="campana" value={campana} />}
      <Resultado estado={estado} />
      <Campo id="nombre" label="Nombre y apellido" error={c.nombre}>
        <input id="nombre" name="nombre" className="al-input" autoComplete="name" required {...aria("nombre", c.nombre)} />
      </Campo>
      <Campo id="email" label="Correo" error={c.email} ayuda={emailInicial ? "Usa el mismo correo con el que te invitaron." : undefined}>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          className="al-input"
          defaultValue={emailInicial}
          required
          {...aria("email", c.email, !!emailInicial)}
        />
      </Campo>
      <Campo id="password" label="Contraseña" error={c.password} ayuda="Mínimo 10 caracteres.">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          className="al-input"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          required
          {...aria("password", c.password, true)}
        />
        {clave && (
          <span className="al-muted" aria-live="polite">
            {ev.cumple ? `Seguridad: ${ev.etiqueta}.` : ev.ayuda}
          </span>
        )}
      </Campo>
      <div className="al-field">
        <label className="al-check">
          <input type="checkbox" name="terminos" {...aria("terminos", c.terminos)} />
          <span>
            Acepto los <a href="/terminos" target="_blank" rel="noopener noreferrer">términos</a> y la <a href="/privacidad" target="_blank" rel="noopener noreferrer">política de privacidad</a>.
          </span>
        </label>
        {c.terminos && (
          <span className="al-error" id="terminos-error" role="alert">
            {c.terminos}
          </span>
        )}
      </div>
      <Enviar>Crear mi cuenta</Enviar>
      <p className="al-muted">
        ¿Ya tienes cuenta? <Link href={cursoSlug ? `/ingresar?next=${encodeURIComponent(`/curso/${cursoSlug}`)}` : "/ingresar"}>Ingresa aquí</Link>.
      </p>
    </form>
  );
}

export function FormReenviar({ correo }: { correo: string }) {
  const [estado, accion] = useFormState(reenviarConfirmacionAction, VACIO);
  if (estado.ok) return <p className="al-alert al-alert--ok" role="status">{estado.mensaje}</p>;
  return (
    <form action={accion} className="al-stack">
      <input type="hidden" name="email" value={correo} />
      {estado.error && <p className="al-error" role="alert">{estado.error}</p>}
      <Enviar bloque={false}>Reenviar el enlace de confirmación</Enviar>
    </form>
  );
}

export function FormIngreso({ next, emailInicial }: { next?: string; emailInicial?: string }) {
  const [estado, accion] = useFormState(ingresarAction, VACIO);
  useIrA(estado);
  const c = estado.campos ?? {};
  return (
    <div className="al-stack">
      <form action={accion} className="al-form" noValidate>
        {next && <input type="hidden" name="next" value={next} />}
        <Resultado estado={estado} />
        <Campo id="email" label="Correo" error={c.email}>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            className="al-input"
            defaultValue={emailInicial}
            required
            {...aria("email", c.email)}
          />
        </Campo>
        <Campo id="password" label="Contraseña" error={c.password}>
          <input id="password" name="password" type="password" autoComplete="current-password" className="al-input" required {...aria("password", c.password)} />
        </Campo>
        <Enviar>Ingresar</Enviar>
        <p className="al-muted">
          <Link href="/recuperar">Olvidé mi contraseña</Link>
        </p>
        <p className="al-muted">
          ¿No tienes cuenta? <Link href="/registro">Crea tu cuenta</Link>.
        </p>
      </form>
      {estado.sinConfirmar && estado.correo && <FormReenviar correo={estado.correo} />}
    </div>
  );
}

export function FormRecuperar() {
  const [estado, accion] = useFormState(recuperarAction, VACIO);
  const c = estado.campos ?? {};
  if (estado.ok) return <p className="al-alert al-alert--ok" role="status">{estado.mensaje}</p>;
  return (
    <form action={accion} className="al-form" noValidate>
      <Resultado estado={estado} />
      <Campo id="email" label="Correo de tu cuenta" error={c.email}>
        <input id="email" name="email" type="email" inputMode="email" autoComplete="email" className="al-input" required {...aria("email", c.email)} />
      </Campo>
      <Enviar>Enviarme el enlace</Enviar>
      <p className="al-muted">
        <Link href="/ingresar">Volver a ingresar</Link>
      </p>
    </form>
  );
}

export function FormRestablecer({ token }: { token: string }) {
  const [estado, accion] = useFormState(restablecerAction, VACIO);
  useIrA(estado);
  const c = estado.campos ?? {};
  return (
    <form action={accion} className="al-form" noValidate>
      <input type="hidden" name="token" value={token} />
      <Resultado estado={estado} />
      <Campo id="password" label="Contraseña nueva" error={c.password} ayuda="Mínimo 10 caracteres.">
        <input id="password" name="password" type="password" autoComplete="new-password" className="al-input" required {...aria("password", c.password, true)} />
      </Campo>
      <Campo id="confirmacion" label="Repite la contraseña" error={c.confirmacion}>
        <input id="confirmacion" name="confirmacion" type="password" autoComplete="new-password" className="al-input" required {...aria("confirmacion", c.confirmacion)} />
      </Campo>
      <Enviar>Guardar y entrar</Enviar>
    </form>
  );
}

/** El enlace del correo solo muestra el botón: confirmar es un POST (los escáneres de correo no lo consumen). */
export function FormConfirmar({ token }: { token: string }) {
  const [estado, accion] = useFormState(confirmarAction, VACIO);
  useIrA(estado);
  return (
    <form action={accion} className="al-form">
      <input type="hidden" name="token" value={token} />
      <Resultado estado={estado} />
      <Enviar>Confirmar mi correo y entrar</Enviar>
      {estado.error && (
        <p className="al-muted">
          <Link href="/ingresar">Ir a ingresar</Link> para pedir un enlace nuevo.
        </p>
      )}
    </form>
  );
}

/** El enlace del correo nuevo solo muestra el botón: confirmar es un POST (los escáneres no lo consumen). */
export function FormConfirmarCorreo({ token }: { token: string }) {
  const [estado, accion] = useFormState(confirmarCambioCorreoAction, VACIO);
  useIrA(estado);
  return (
    <form action={accion} className="al-form">
      <input type="hidden" name="token" value={token} />
      <Resultado estado={estado} />
      <Enviar>Confirmar mi nuevo correo</Enviar>
      {estado.error && (
        <p className="al-muted">
          <Link href="/perfil">Ir a mi perfil</Link> para pedir un enlace nuevo.
        </p>
      )}
    </form>
  );
}
