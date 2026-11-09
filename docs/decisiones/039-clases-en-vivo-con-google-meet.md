# 039 — Clases en vivo y agendado de Google Meet desde la plataforma

- **Fecha:** 2026-11-08
- **Estado:** Propuesta. La **Fase 1** (sin integración) la pidió Samuel el 2026-11-08 y está implementada en `dev` (migración `0021` aplicada en dev); la **Fase 2** (Google Calendar con OAuth) sigue pendiente de su aprobación

## Contexto

Samuel quiere agendar la clase en vivo desde Avantia y que el enlace de Google Meet se genere solo, además de dejar después la grabación y el resumen en el curso. Hoy una clase en vivo se improvisa con una lección: se pega un enlace de Meet a mano.

Meet no tiene una API propia para «crear reunión» pensada para esto en cuentas personales: la vía estándar es **crear un evento en Google Calendar con `conferenceData.createRequest` (`hangoutsMeet`)**, que devuelve el enlace de Meet y envía la invitación a los invitados por correo.

## Decisión (recomendada, en dos fases)

**Fase 1 — Clase en vivo sin integración (se puede construir ya, sin proveedor nuevo).**
Tabla `clases_en_vivo` (`tenant_id`, `curso_id`, `modulo_id` opcional, `titulo`, `descripcion`, `inicia_at`, `duracion_min`, `enlace_meet` https, `grabacion_url` https opcional, `resumen` texto enriquecido con LaTeX opcional), con RLS por tenant y índice que empieza por `tenant_id`. El creador pega el enlace de Meet; el alumno ve «Próxima clase» (fecha, botón «Unirme») y, después, grabación y resumen. Un recordatorio por correo al inscrito (reutiliza `lib/alumno/correos.ts`).

**Fase 2 — Agendar desde la plataforma con Google Calendar.**
- El creador pulsa «Conectar Google» (OAuth 2.0, flujo de código con `access_type=offline`) con el alcance mínimo `https://www.googleapis.com/auth/calendar.events`.
- Al crear la clase, el servidor llama `events.insert` con `conferenceDataVersion=1`, `attendees` (correos de los inscritos activos) y `sendUpdates=all`; guarda `google_event_id` y `enlace_meet`. Editar o cancelar la clase actualiza o borra el evento.
- Los tokens de Google se guardan **cifrados** (tabla `conexiones_google` con `tenant_id`, RLS y sin acceso desde clientes; solo el servidor con clave de cifrado en variable de entorno). Una conexión por creador.
- Un único módulo de servidor para hablar con Google; los correos de los alumnos solo se envían a Google con el `sendUpdates` que el creador activa explícitamente (aviso de privacidad, ver ADR 019 y B-19).

## Alternativas descartadas

- **Google Meet REST API (`spaces.create`):** crea el espacio pero no agenda ni invita; habría que armar igual el calendario. Es una opción válida si Google lo madura.
- **Enlace de Meet pegado a mano como única vía:** es la Fase 1; se mantiene como respaldo si el creador no conecta Google.
- **Zoom u otra videollamada:** Samuel usa Meet; se puede abrir otro ADR si un creador lo pide.
- **Cuenta de servicio de Avantia que agenda por todos:** mezcla las reuniones de las academias bajo una cuenta de la plataforma; rompe el aislamiento por academia.

## Consecuencias

- Fase 1 es una migración y dos pantallas. Fase 2 suma un proyecto en Google Cloud, pantalla de consentimiento OAuth y **verificación de Google**: `calendar.events` es un alcance sensible, así que para uso público hay que pasar la revisión (política de privacidad, video de demo; puede tomar semanas). Mientras la app esté en modo «pruebas» solo funcionan hasta 100 usuarios que se agreguen a mano, y los tokens de refresco caducan a los 7 días: sirve para que Samuel pruebe, no para abrir a otros creadores.
- Secretos de OAuth (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) y la clave de cifrado van en variables de entorno (Vercel), nunca en el repo.
- Hay que cubrir revocación (el creador desconecta o Google invalida el token) sin dejar clases que digan «agendada» sin evento real.
- Los requisitos exactos de verificación y las cuotas de Calendar API deben confirmarse en la documentación de Google antes de comprometer fecha; aquí quedan como hipótesis.
