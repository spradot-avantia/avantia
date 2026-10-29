# 014 — Postulación sin cuenta y registro por invitación

- **Fecha:** 2026-10-29
- **Estado:** Propuesta (implementada en `dev`, espera la aprobación de Samuel)

## Contexto

Pedir cuenta (Google o correo) para postular (ADR 011 y 013) agrega fricción antes de que el equipo conozca al experto. Samuel pidió dejar solo nombre, correo y un texto breve sobre lo que hace hoy; que la postulación llegue al equipo; que el postulante pueda agendar 20 minutos con `javiera@goavantia.com`; y que, al aceptarlo, reciba un correo para registrarse formalmente.

## Decisión

- **Postular sin sesión:** `/postular` es público y pide nombre, correo y "¿a qué te dedicas hoy?" (10 a 600 caracteres). Al enviar aparece la confirmación con el botón "Agenda 20 minutos" (`NEXT_PUBLIC_AGENDA_URL`; página de reservas de Google Calendar creada con la cuenta de Javiera).
- **Escritura con service role** desde la server action (el postulante no tiene identidad). Defensas: campo trampa oculto, límite por IP (5/10 min) y por correo (3/h) en memoria, validación estricta con zod y respuesta idéntica si el correo ya postuló (no revela existencia). Un captcha (Turnstile) queda como siguiente paso si aparece spam.
- **Datos:** migración `0005`: `user_id` pasa a ser opcional, `descripcion` e `invitado_en` nuevas, correo único sin distinguir mayúsculas. Se mantiene la excepción de tabla de plataforma sin `tenant_id` (ADR 011).
- **Aviso al equipo:** correo por Resend a `POSTULACIONES_NOTIFY_TO` (por defecto Javiera y contacto@). Si falta `RESEND_API_KEY`, la postulación se guarda igual y se ve en `/admin/postulaciones`.
- **Aceptación e invitación:** en `/admin/postulaciones` el equipo (STAFF_EMAILS) marca "Aceptar e invitar": el estado pasa a `aceptada` y el postulante recibe un correo con el enlace a `/signup`. También hay "Reenviar invitación", contactada, lista de espera y descartar.
- **Registro cerrado por invitación:** `signUpAction` y el callback de Google exigen que el correo tenga una postulación `aceptada` (o esté en STAFF_EMAILS). En Google la cuenta nueva sin invitación (creada hace menos de 10 min) se borra y se cierra la sesión. `REGISTRO_ABIERTO=true` abre el registro (desarrollo/pruebas).

## Alternativas descartadas

- Seguir exigiendo cuenta (ADR 011/013): más fricción antes de la primera conversación.
- Invitación de Supabase Auth (`inviteUserByEmail`): usa el SMTP limitado de Supabase y no aprovecha el aviso al equipo; Resend sirve para ambos correos.
- Bloquear el registro con un trigger sobre `auth.users`: más fuerte, pero riesgoso (bloquea al equipo y a cuentas existentes) y con mensajes de error poco claros. Queda como mejora.

## Consecuencias

- Requiere aplicar `0005_postulacion_sin_cuenta.sql` en Supabase, crear la cuenta de Resend y verificar `goavantia.com` (DNS), y definir `RESEND_API_KEY`, `MAIL_FROM` y `NEXT_PUBLIC_AGENDA_URL` en Vercel.
- La protección anti-spam es mínima (límite en memoria por instancia; NF-23). Quien envíe correos ajenos solo logra que el equipo reciba postulaciones falsas: no se envía nada al correo del postulante hasta que el equipo lo acepte.
- El registro cerrado se aplica en la app, no en la base: `crear_academia()` sigue sin exigir postulación (Q4 queda parcial en `Supuestos_y_Pendientes.md`).
- Los creadores que ya tienen cuenta no se ven afectados.
