# 015 — Acceso solo para postulaciones aceptadas y equipo

- **Fecha:** 2026-10-29
- **Estado:** Propuesta (implementada en `dev`, espera la aprobación de Samuel)

## Contexto

El ADR 014 cerró el **registro** por invitación, pero solo en `signUpAction` y en el callback de Google (y solo para cuentas nuevas). Una cuenta creada por fuera de la app (la API pública de Supabase Auth acepta `signUp` con la anon key) o una cuenta de Google anterior de más de 10 minutos podía ingresar al panel sin haber sido aceptada.

## Decisión

Solo entra a la plataforma quien tiene una postulación `aceptada` o está en `STAFF_EMAILS` (admins de Avantia, dashboard `/admin`). Se verifica en cada punto de entrada, no solo al registrarse:

- **Login con contraseña:** tras autenticar, si el correo no tiene acceso se cierra la sesión y se muestra el mensaje de invitación.
- **Callback de Google:** se aplica a toda cuenta (no solo a las nuevas); sin acceso se cierra la sesión y, si la cuenta tiene menos de 10 min, se borra.
- **Panel y onboarding:** si hay sesión sin acceso vigente se redirige a `/auth/bloqueado`, que cierra la sesión y vuelve a `/login`. Descartar una postulación aceptada corta el acceso.
- `REGISTRO_ABIERTO=true` sigue abriendo todo para desarrollo y pruebas.

## Alternativas descartadas

- Trigger `before insert` sobre `auth.users`: bloquearía el `signUp` directo, pero `STAFF_EMAILS` vive en variables de entorno y no en la base; exigiría una tabla `staff` (RQ-06). Queda como mejora.

## Consecuencias

- Una consulta a `postulaciones` por request al panel (cacheada por request).
- Las cuentas sin acceso pueden existir en Auth (creadas por fuera) pero no pueden usar nada; la restricción de `crear_academia` en la base se resuelve en el [ADR 016](016-staff-real-y-crear-academia-restringida.md).
