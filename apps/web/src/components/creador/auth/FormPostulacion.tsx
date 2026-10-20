"use client";

import { useFormState, useFormStatus } from "react-dom";
import { enviarPostulacionAction } from "../../../lib/postulacion/actions";
import { ESTADO_POSTULACION_INICIAL, RANGOS_ALUMNOS } from "../../../lib/postulacion/validacion";
import { Button } from "../Button";
import { Callout } from "../Callout";
import { Field, Input, Select } from "../Field";

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" bloque className="av-btn--lg" disabled={pending} aria-busy={pending}>
      {pending ? "Enviando…" : "Enviar postulación"}
    </Button>
  );
}

/** Paso 2 de la postulación: mismos campos que la landing; el correo es el de Google (solo lectura). */
export function FormPostulacion({
  email,
  inicial,
}: {
  email: string;
  inicial: { nombre: string; url: string; alumnos: string };
}) {
  const [estado, accion] = useFormState(enviarPostulacionAction, ESTADO_POSTULACION_INICIAL);
  const v = estado.valores ?? inicial;
  const e = estado.errores ?? {};

  return (
    <form className="au-form" action={accion} noValidate>
      <div className="au-msg" aria-live="polite" aria-atomic="true">
        {estado.mensaje && <Callout tono="danger">{estado.mensaje}</Callout>}
      </div>
      <Field id="p-email" label="Correo" ayuda="El de tu cuenta de Google.">
        <Input id="p-email" type="email" value={email} readOnly conAyuda />
      </Field>
      <Field id="p-nombre" label="Nombre" error={e.nombre}>
        <Input id="p-nombre" name="nombre" autoComplete="name" placeholder="Tu nombre" defaultValue={v.nombre} invalido={!!e.nombre} maxLength={80} required />
      </Field>
      <Field id="p-url" label="LinkedIn o web de tu programa" opcional error={e.url}>
        <Input id="p-url" name="url" type="text" inputMode="url" autoComplete="url" placeholder="linkedin.com/in/tu-perfil" defaultValue={v.url} invalido={!!e.url} maxLength={300} />
      </Field>
      <Field id="p-alumnos" label="¿Cuántos alumnos tienes al año, aprox.?" opcional error={e.alumnos}>
        <Select id="p-alumnos" name="alumnos" defaultValue={v.alumnos} invalido={!!e.alumnos}>
          <option value="">Elige una opción</option>
          {RANGOS_ALUMNOS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </Select>
      </Field>
      <Enviar />
      <p className="av-legal" style={{ textAlign: "center", margin: 0 }}>
        Sin tarjeta y sin compromiso. Al enviar aceptas los <a href="/terminos">términos y condiciones</a> y la{" "}
        <a href="/privacidad">política de privacidad</a>.
      </p>
    </form>
  );
}
