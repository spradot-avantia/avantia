# Backlog de Avantia

> Fuente de verdad del trabajo pendiente. Se actualiza en cada sesión de revisión
> y en el mismo PR que cierra un ítem. Los RQ son de `docs/producto/Requerimientos_MVP.md`.
> Los planes por día/sprint viven en este mismo directorio (`AAAA-MM-DD_*.md`).
> Última actualización: 2026-10-20.

Foto del avance contra el MVP completo: `Estado_MVP_2026-10-13.md`.

Estados: `Pendiente` · `En curso` · `Bloqueado` · `Hecho`.

## En curso / siguiente

| ID | Ítem | RQ | Estado | Notas |
|---|---|---|---|---|
| B-01 | Verificar RLS en Supabase real (PostgREST/Storage no cubiertos por la suite) | RQ-04, 31 | En curso | Suite en CI (job `rls`, ver Hecho); falta confirmar que el job pasa en GitHub |
| B-02 | Verificar RLS/Storage en Supabase tras aplicar 0001–0003 | RQ-04 | En curso | Samuel aplicó 0001–0003 el 2026-10-13; falta verificar bucket `logos` y políticas en la base real |
| B-03 | Tests del fix de host del middleware (`endsWith`) | RQ-03 | Pendiente | El fix está (`8f36ed6`), faltan los tests |
| B-04 | ADR de identidad del alumno (Q1) | RQ-05 | Bloqueado por decisión de Samuel | Recomendación: identidad global + tabla `alumnos(tenant_id, user_id)`; ver Requerimientos §Q1 |
| B-05 | Auth con Google (hoy correo + contraseña) | RQ-01 | Pendiente | ADR 003 lo deja como "después" |
| B-06 | Migrar `configuracion/dominio` y `/api/tenants/domain` a tenant por sesión | RQ-04 | Pendiente | Mismo patrón que `generar-curso` |
| B-08 | Resolver historia de git: `main` remoto no comparte historia con `dev` (bloquea el PR y por tanto el job `rls`) | RQ-31 | Bloqueado por decisión de Samuel | Opciones: reemplazar `main`, merge con `--allow-unrelated-histories`, o disparar CI con push |
| B-09 | Landing V3 en producción: activar Google en Supabase Auth (+ Redirect URL `https://app.avantia.app/auth/callback`) y probar el flujo `/postular` de punta a punta | RQ-28 | Pendiente (Samuel) | 2026-10-20: Samuel aplicó `0004_postulaciones` en Supabase y creó la agenda de Google Calendar (`NEXT_PUBLIC_AGENDA_URL`). Código en `dev` (ADR 011, Propuesta) |
| B-10 | Revisar landing V3, `/postular` y legales en móvil real (360–390 px) y escritorio | RQ-28 | Pendiente | La captura headless no baja de ~500 px; no se verificó a 360 px |
| B-11 | Avisar por correo a contacto@goavantia.com cuando llega una postulación | RQ-28 | Pendiente | Hoy solo `/admin/postulaciones` |
| B-12 | Legales: cerrar los `[pendientes]` y alinear con el flujo Google (los términos hablan de contraseña; privacidad menciona teléfono y tema de cursos, que el formulario no pide; duración del programa: 30 días en términos vs "programa gratis" sin plazo en la landing) | RQ-29 | Pendiente (revisión legal) | |
| B-07 | Móvil base: viewport, inputs ≥16 px, botones ≥44 px, sidebar colapsable, manifest PWA por tenant | Impacto_Movil | Sin confirmar | Revisar qué quedó hecho |

## H1 — academia gratis cursable desde celular

| RQ | Ítem | Estado |
|---|---|---|
| RQ-13 | Inicio de academia y ficha del curso con temario | Parcial |
| RQ-14 | Inscripción gratuita | Esquema listo (0003); falta flujo y Q1 |
| RQ-15 | Player de lección con control de acceso | Pendiente |
| RQ-16 | Progreso | Esquema listo (0003); falta UI |
| RQ-18 | Curso completado (sin quiz) | Pendiente |
| RQ-26 | Registro de eventos | Esquema listo (0003); falta instrumentar |

## H2 — retención medible

RQ-17 quiz · RQ-22 cohorte (esquema base en 0003/ADR 004; falta regla de liberación y UI) · RQ-24 norma social · RQ-25 presencia del creador · RQ-27 dashboard CR-11 · RQ-23 correo (si hay tiempo).

## H3 — cobro

RQ-19/20/21 Mercado Pago · RQ-28 landing conectada (V3 con postulación lista en `dev`, ver B-09) · RQ-29 legales (borradores publicados en `/terminos` y `/privacidad`, ver B-12) · RQ-30 dominio concierge. Pendiente documentar el onboarding de Mercado Pago Connect.

## Decisiones abiertas (Samuel)

Q1 identidad de alumnos · Q3 MFA propio (recomendado: no) · Q4 registro por aplicación en H1 (hoy la postulación existe pero no bloquea crear academia; ADR 011) · ADR 011 por aprobar · Q6 quiz opcional · Q7 cuota fija vs comisión. Detalle en `2026-10-13_Plan_Ejecucion_Dia1.md`.

## Hecho

| Fecha | Ítem |
|---|---|
| 2026-10-20 | Landing V3 portada (programa gratis, precio preferente 2 meses, FAQ, inicio noviembre 2026, contacto@goavantia.com, sin testimonios); postulación Google → formulario en `/postular` guardada en `postulaciones` (migración 0004, RLS por usuario, +10 pruebas: `test:rls` 62 ok); `/admin/postulaciones`; `/terminos` y `/privacidad` (borradores); agenda vía `NEXT_PUBLIC_AGENDA_URL` |
| 2026-10-13 | Job `rls` en `.github/workflows/ci.yml`: Postgres 16 como servicio y `npm run test:rls` en cada PR |
| 2026-10-13 | Suite RLS local con 2 tenants: `npm run test:rls` (52 pruebas, 0 fallos) contra Postgres en Docker (`avantia-pg-test`, puerto 54329) con `db/test/bootstrap.sql` emulando auth/storage. También comprueba que las migraciones se re-aplican sin error. Migraciones 0001–0003 aplicadas en Supabase por Samuel |
| 2026-10-13 | `generar-curso` deriva el tenant de la sesión (ya no del body); responde 401 sin sesión |
| 2026-10-13 | ADR 003 aceptado |
| 2026-10-13 | ADR 004 (cohorte simple) redactado, en estado Propuesta |
| 2026-10-13 | Migración `0003_inscripciones_progreso_eventos` (inscripciones, progreso, eventos, `lecciones.dia_liberacion`) con RLS; reflejada en `schema.sql` |
| 2026-10-12 | Alta de academia transaccional por RPC (ADR 009), login correo + contraseña (ADR 003), Espacio del Creador, fix de host del middleware |
