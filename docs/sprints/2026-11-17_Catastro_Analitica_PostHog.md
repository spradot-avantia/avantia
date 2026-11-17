# Catastro — Analítica de aprendizaje con PostHog (2026-11-17)

Resumen del avance para el equipo. Decisión: [ADR 040](../decisiones/040-posthog-y-analitica-de-aprendizaje.md) (Aceptada el 2026-11-17).

## En una frase

El alumno ya puede ser medido (con su consentimiento) dentro de la academia, PostHog recibe la telemetría fina, y cada creador tiene un panel `/analitica` con datos de su academia. Todo está en **`dev`** y verificado; **nada está en producción**.

## Qué se construyó

| Área | Qué hace | Dónde |
|---|---|---|
| Arquitectura híbrida | PostHog recibe comportamiento fino (para el equipo). Supabase guarda los hechos que alimentan el panel del creador, aislados por RLS. | ADR 040 |
| Consentimiento | Aviso opt-in en el sitio de cada academia (sin marca Avantia), botón "Preferencias" en el pie. Sin aceptar, el navegador no envía nada a PostHog. | `AvisoAnaliticaAcademia`, `AnaliticaProvider` |
| Privacidad | El alumno se identifica con un id seudónimo (HMAC por tenant). Sin correo, nombre, replay, autocapture ni IP (activado "Discard client IP data" en PostHog). `/privacidad` de la academia menciona a PostHog. | `lib/analitica/identidad.ts` |
| Eventos del cliente | Lección vista, tiempo activo, scroll (25/50/75/100), clic en video, pregunta vista, respuesta (con tiempo y cambios), abandono de quiz, repaso, entrega iniciada/enviada, clics repetidos, errores de interfaz. | `lib/analitica/eventos.ts` |
| Eventos de servidor | Cuenta creada, inscripción, lección abierta/completada, curso completado, intento de quiz. | `lib/alumno/eventos.ts` |
| Datos para el creador | Tabla `sesiones_leccion` (tiempo activo por visita), columna `quiz_respuestas.duracion_ms`, endpoint `/api/alumno/tiempo-leccion`. | Migración `0023` |
| Panel del creador | KPIs, embudo por lección, 10 preguntas más difíciles, tareas, retención por cohorte semanal, exportación CSV. | `/analitica` |
| Infra | Proxy `/ingest` en el mismo origen; el middleware lo excluye y sigue sin consultar la base. | `next.config.mjs` |
| Pruebas | 7 tests unitarios de las reglas del panel. | `analiticaReglas.test.ts` |

## Estado de verificación

- **Verificado en `academia-avantia.dev.goavantia.com`** (commits `45ac3cd` y `579b5d1`, ambos en `dev`): sin consentimiento o tras rechazar, 0 llamadas a PostHog; tras aceptar llegan los eventos con `tenant_id`, grupo `tenant` y sin IP; la base registra tiempo, duración por pregunta y eventos; el panel carga con datos reales de dev.
- **Verificado por emulación:** el envío al cerrar pestaña se probó forzando `pagehide`, no cerrando una pestaña real.

## Límites conocidos

1. El primer `leccion_vista` de una visita se pierde si el alumno acepta el aviso después de cargar la página.
2. Los eventos de servidor (hechos de negocio) se envían sin depender del consentimiento; es lo que dice el ADR, pero conviene revisarlo con asesoría legal antes de operar con alumnos reales.
3. Hay eventos de prueba antiguos en PostHog con IP (de antes de activar el descarte).
4. Cuotas del plan gratuito (≈1 M eventos/mes) y requisitos legales por país siguen como hipótesis sin verificar.

## Pendiente para producción (cada paso solo cuando Samuel lo pida)

1. Aplicar la migración `0023` en el proyecto de producción (`owjhakhkdqmcykvtmbox`); hoy solo está en dev.
2. Crear un proyecto de PostHog para producción, con "Discard client IP data" activo.
3. Cargar en Vercel Production `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` y un `ANALITICA_HMAC_SECRET` distinto del de dev. Sin esas variables la analítica queda apagada.
4. Revisión legal del texto de privacidad y del registro de tratamientos.
5. Commitear la línea de RQ-26 en `docs/sprints/BACKLOG.md`, que hoy va mezclada con otros cambios sin commitear.
6. Borrar la cuenta de prueba de creador en dev.

## Fuera de alcance por ahora

Eventos de correo/notificaciones (no hay correos de reenganche aún), session replay, A/B por tenant, gamificación e IA adaptativa.
