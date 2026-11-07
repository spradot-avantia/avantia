"use client";

import { useFormState } from "react-dom";
import { actualizarNombreAction, cambiarContrasenaAction, solicitarCambioCorreoAction } from "../../lib/alumno/actions";
import type { EstadoForm } from "../../lib/alumno/cuentas";
import { aria, Campo, Enviar, Resultado } from "./Formularios";
import "./alumno.css";

const VACIO: EstadoForm = {};

export function FormNombre({ nombre }: { nombre: string }) {
  const [estado, accion] = useFormState(actualizarNombreAction, VACIO);
  const c = estado.campos ?? {};
  return (
    <form action={accion} className="al-form" noValidate>
      <Resultado estado={estado} />
      {estado.ok && (
        <p className="al-alert al-alert--ok" role="status">
          {estado.mensaje}
        </p>
      )}
      <Campo id="nombre" label="Nombre y apellido" error={c.nombre}>
        <input id="nombre" name="nombre" className="al-input" autoComplete="name" defaultValue={nombre} required {...aria("nombre", c.nombre)} />
      </Campo>
      <Enviar bloque={false}>Guardar nombre</Enviar>
    </form>
  );
}

export function FormContrasena() {
  const [estado, accion] = useFormState(cambiarContrasenaAction, VACIO);
  const c = estado.campos ?? {};
  // Al guardar, el formulario se vacía (key distinta) para no dejar contraseñas a la vista.
  return (
    <form action={accion} className="al-form" noValidate key={estado.ok ? "ok" : "form"}>
      <Resultado estado={estado} />
      {estado.ok && (
        <p className="al-alert al-alert--ok" role="status">
          {estado.mensaje}
        </p>
      )}
      <Campo id="actual" label="Contraseña actual" error={c.actual}>
        <input id="actual" name="actual" type="password" autoComplete="current-password" className="al-input" required {...aria("actual", c.actual)} />
      </Campo>
      <Campo id="password" label="Contraseña nueva" error={c.password} ayuda="Mínimo 10 caracteres.">
        <input id="password" name="password" type="password" autoComplete="new-password" className="al-input" required {...aria("password", c.password, true)} />
      </Campo>
      <Campo id="confirmacion" label="Repite la contraseña nueva" error={c.confirmacion}>
        <input id="confirmacion" name="confirmacion" type="password" autoComplete="new-password" className="al-input" required {...aria("confirmacion", c.confirmacion)} />
      </Campo>
      <Enviar bloque={false}>Cambiar contraseña</Enviar>
    </form>
  );
}

export function FormCorreo({ correo }: { correo: string }) {
  const [estado, accion] = useFormState(solicitarCambioCorreoAction, VACIO);
  const c = estado.campos ?? {};
  if (estado.ok) {
    return (
      <div className="al-stack" role="status">
        <p className="al-alert al-alert--ok">{estado.mensaje}</p>
        <p className="al-muted">¿No llega? Revisa la carpeta de spam o vuelve a pedirlo recargando esta página.</p>
      </div>
    );
  }
  return (
    <form action={accion} className="al-form" noValidate>
      <Resultado estado={estado} />
      <p className="al-muted">
        Tu correo actual es <strong>{correo}</strong>. Te enviaremos un enlace al correo nuevo y el cambio se hace al confirmarlo.
      </p>
      <Campo id="email" label="Correo nuevo" error={c.email}>
        <input id="email" name="email" type="email" inputMode="email" autoComplete="email" className="al-input" required {...aria("email", c.email)} />
      </Campo>
      <Campo id="password-correo" label="Tu contraseña actual" error={c.password} ayuda="La pedimos para confirmar que eres tú.">
        <input id="password-correo" name="password" type="password" autoComplete="current-password" className="al-input" required {...aria("password-correo", c.password, true)} />
      </Campo>
      <Enviar bloque={false}>Enviarme el enlace</Enviar>
    </form>
  );
}
