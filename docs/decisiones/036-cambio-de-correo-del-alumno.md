# 036 — Cambio de correo del alumno

- **Fecha:** 2026-11-06
- **Estado:** Aceptada (Samuel pidió implementarla el 2026-11-06). Migración `0019` aplicada en Supabase el 2026-11-06

## Contexto

La página Mi perfil (`/perfil`) deja al alumno cambiar su nombre y su contraseña, pero no su correo. El correo es su usuario de ingreso (ADR 018), único por academia (`unique (tenant_id, correo)`), y además es el que usa el creador para invitar y para aplicar invitaciones (`aplicarInvitaciones`). Cambiarlo sin comprobar que el alumno controla el correo nuevo permitiría tomar una cuenta ajena o quedarse sin acceso por un error de tipeo.

## Decisión (recomendada)

Cambio **en dos pasos con confirmación del correo nuevo**, reutilizando `alumno_tokens`:

1. El alumno, con sesión, escribe el correo nuevo y su **contraseña actual**. Se valida formato y que no exista ya en la academia (respuesta genérica: no se revela si existe).
2. Se emite un token de tipo nuevo `cambio_correo` (vigencia 2 h, un solo enlace vigente) y se envía el enlace **al correo nuevo**. El correo nuevo se guarda en una columna `alumno_tokens.dato` (texto, nulo para los demás tipos); `alumnos.correo` **no cambia** hasta confirmar.
3. Al confirmar (POST, como `FormConfirmar`, para que los escáneres de correo no lo consuman): se actualiza `alumnos.correo` y `correo_verificado_at`, se cierran las demás sesiones, se corre `aplicarInvitaciones` con el correo nuevo y se avisa con un correo informativo **al correo anterior** («si no fuiste tú, recupera tu cuenta»).
4. Límite de intentos por alumno (mismo limitador que el cambio de contraseña) y evento `correo_cambiado` en `eventos`.
5. Migración nueva: ampliar el `check` de `tipo` con `cambio_correo` y agregar `dato`. Ambas tablas ya tienen `tenant_id` y RLS; el índice sigue empezando por `tenant_id`. Actualizar `schema.sql`.

## Alternativas descartadas

- **Cambiar el correo directo, sin confirmar:** riesgo de toma de cuenta y de quedar fuera por typo.
- **Que lo cambie el creador:** carga operativa para él y deja al alumno sin autonomía; queda solo como vía de soporte.
- **Confirmar solo en el correo anterior:** no prueba que el alumno controla el correo nuevo.
- **Tabla aparte `cambios_correo`:** más piezas para un flujo que `alumno_tokens` ya cubre.

## Consecuencias

- Una migración pequeña y un flujo nuevo (formulario en el perfil, página `/confirmar-correo`, dos plantillas de correo).
- El historial del alumno (inscripciones, progreso, XP) no se toca: todo cuelga de `alumno_id`.
- Si el correo nuevo ya existe en la academia, no se puede fusionar cuentas en esta versión; se muestra el mensaje genérico y el alumno puede escribir a la academia.
- Implementado en `lib/alumno/perfil.ts` (`solicitarCambioCorreo`, `confirmarCambioCorreo`), formulario en `/perfil` y confirmación en `/confirmar-correo`.
