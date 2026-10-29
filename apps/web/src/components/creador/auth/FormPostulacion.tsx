"use client";

import { useFormState, useFormStatus } from "react-dom";
import { enviarPostulacionAction } from "../../../lib/postulacion/actions";
import { ESTADO_POSTULACION_INICIAL } from "../../../lib/postulacion/validacion";
import { agendaHref } from "../../marketing/content";
import { Button } from "../Button";
import { Callout } from "../Callout";
import { Field, Input, Textarea } from "../Field";

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" bloque className="av-btn--lg" disabled={pending} aria-busy={pending}>
      {pending ? "Enviando…" : "Enviar postulación"}
    </Button>
  );
}

/** Postulación sin cuenta (ADR 014): nombre, correo y a qué te dedicas hoy. */
export function FormPostulacion() {
  const [estado, accion] = useFormState(enviarPostulacionAction, ESTADO_POSTULACION_INICIAL);

  if (estado.ok) {
    const agenda = agendaHref();
    const externo = agenda.startsWith("http");
    return (
      <div aria-live="polite">
        <h1 className="au-title">Recibimos tu postulación</h1>
        <p className="au-lede">
          Revisaremos tu perfil y te escribiremos al correo que dejaste. Si el primer grupo ya está completo, quedarás en la lista de espera para el siguiente.
        </p>
        <div className="au-box">
          <b>¿Prefieres conversar antes?</b>
          <a className="av-btn av-btn--primary av-btn--lg" href={agenda} {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            Agenda 20 minutos
          </a>
        </div>
      </div>
    );
  }

  const v = estado.valores ?? { nombre: "", email: "", descripcion: "" };
  const e = estado.errores ?? {};

  return (
    <>
      <h1 className="au-title">Postula al programa fundador</h1>
      <p className="au-lede">Sin crear cuenta y en menos de un minuto. Si te aceptamos, te escribiremos para que te registres.</p>
      <form className="au-form" action={accion} noValidate>
        <div className="au-msg" aria-live="polite" aria-atomic="true">
          {estado.mensaje && <Callout tono="danger">{estado.mensaje}</Callout>}
        </div>
        <Field id="p-nombre" label="Nombre" error={e.nombre}>
          <Input id="p-nombre" name="nombre" autoComplete="name" placeholder="Tu nombre" defaultValue={v.nombre} invalido={!!e.nombre} maxLength={80} required />
        </Field>
        <Field id="p-email" label="Correo" error={e.email}>
          <Input id="p-email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="tu@correo.com" defaultValue={v.email} invalido={!!e.email} maxLength={254} required />
        </Field>
        <Field id="p-desc" label="¿A qué te dedicas hoy?" ayuda="Una o dos frases: qué enseñas y a quién." error={e.descripcion}>
          <Textarea id="p-desc" name="descripcion" rows={4} defaultValue={v.descripcion} invalido={!!e.descripcion} conAyuda maxLength={600} required />
        </Field>
        {/* Campo trampa para bots: oculto a personas y a lectores de pantalla. */}
        <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
          <label>
            No llenar este campo
            <input type="text" name="sitio" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>
        <Enviar />
        <p className="av-legal" style={{ textAlign: "center", margin: 0 }}>
          Sin tarjeta y sin compromiso. Al enviar aceptas los <a href="/terminos">términos y condiciones</a> y la{" "}
          <a href="/privacidad">política de privacidad</a>.
        </p>
        <p className="au-alt">
          ¿Ya te aceptamos? <a href="/login">Ingresar</a> o <a href="/signup">crear mi cuenta</a>
        </p>
      </form>
    </>
  );
}
