# 040 — PostHog y analítica de aprendizaje para el creador

- **Fecha:** 2026-11-14
- **Estado:** Propuesta. Samuel pidió implementarla el 2026-11-14 («sigue con todo»); queda a la espera de su aprobación formal y de su revisión antes de llevarla a producción

## Contexto

Hoy no medimos qué hace el alumno: nadie emite `leccion_abierta`, no hay tiempo en lección ni señales de fricción, y el dashboard del creador (CR-11 / RQ-27) es un stub con tres KPIs. Samuel quiere PostHog en su plan gratuito para ver el comportamiento del alumno (módulos, quizzes, tareas, reingresos tras notificaciones) y darle al creador un tablero de control por academia.

Lo que ya existe: la tabla `eventos` (RQ-26, append-only, con RLS por tenant, escrita con `registrarEvento()` en `lib/alumno/eventos.ts`), `progreso.ultimo_acceso_at`, `quiz_respuestas` y `entregas`. El aviso de cookies (`AvisoCookies.tsx`) solo está montado en la landing. La identidad del alumno es solo de servidor (cookie `av_alumno` por host, ADR 018).

Límites del plan gratuito de PostHog (a confirmar en su página de precios antes de comprometer): del orden de 1 M de eventos al mes y 1 año de retención, con grabación de sesiones muy acotada.

## Decisión

**Arquitectura híbrida con dos destinos para los eventos:**

1. **PostHog** recibe la telemetría fina de comportamiento (tiempo activo, profundidad de lectura, tiempo por pregunta, clics repetidos, errores de interfaz). Es para el análisis de producto del equipo de Avantia.
2. **Supabase** conserva los hechos de negocio que alimentan el dashboard del creador (`eventos` ampliada y `sesiones_leccion`). El tablero lee de ahí, con RLS por tenant y filtro explícito por `tenant_id`. El dashboard del creador **no** consulta la API de PostHog.

**Privacidad y consentimiento:**

- El aviso de cookies se monta también en el sitio de la academia, con el theming del tenant y sin marca Avantia.
- PostHog parte con captura desactivada y sin persistencia; solo se activa si el alumno acepta «analítica».
- `distinct_id` es un HMAC del `alumno_id` con un secreto de servidor. No se envían correo, nombre ni IP identificable. Cada evento lleva el grupo `tenant`.
- Los eventos de servidor que son hechos de negocio (lección completada, intento de quiz) no dependen de cookies; los de comportamiento fino del cliente sí.
- Sin session replay ni autocapture en esta etapa.
- `/privacidad` de cada academia (ADR 019) menciona a PostHog como encargado de tratamiento.

**Infraestructura:**

- Proyectos de PostHog separados para dev y producción (mismo criterio que ADR 037).
- Proxy `/ingest` por `rewrites` de Next.js para el mismo origen de cada academia; el middleware excluye esa ruta y sigue sin consultar la base.
- Un catálogo tipado de eventos en `lib/analitica/eventos.ts` como única fuente de nombres.

## Alternativas descartadas

- **Solo PostHog, con el dashboard del creador leyendo su API (HogQL):** menos código de ingesta, pero el aislamiento por tenant pasaría a depender de una query de aplicación, hay límites de la API en el plan gratuito y los datos del creador vencerían con la retención de 1 año.
- **PostHog solo para el equipo, sin dashboard del creador:** no cubre el objetivo de darle información de control al creador.
- **Cookieless sin aviso:** más simple, pero impide seguir reingresos y retención por alumno.
- **Embeber dashboards compartidos de PostHog:** no hay aislamiento por academia.

## Consecuencias

- Proveedor nuevo y dato personal seudonimizado que sale de la plataforma: hay que actualizar privacidad de cada academia y el registro de tratamientos.
- Se debe vigilar el volumen frente al tope gratuito; por eso no hay autocapture y el tiempo activo se envía agregado, no por latido.
- Los datos de comportamiento se duplican entre PostHog y Supabase; el contrato es que Supabase es la fuente del tablero del creador.
- Variables nuevas en Vercel: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` y un secreto para el HMAC. Ninguna en el repo.
- Cuotas, límites del plan y requisitos de privacidad por país (LFPDPPP, Ley 1581, etc.) son hipótesis hasta verificarlas en la documentación de PostHog y con asesoría legal.
