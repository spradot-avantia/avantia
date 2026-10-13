# Backlog de Avantia

> Fuente de verdad del trabajo pendiente. Se actualiza en cada sesión de revisión
> y en el mismo PR que cierra un ítem. Los RQ son de `docs/producto/Requerimientos_MVP.md`.
> Los planes por día/sprint viven en este mismo directorio (`AAAA-MM-DD_*.md`).
> Última actualización: 2026-10-13.

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

RQ-19/20/21 Mercado Pago · RQ-28 landing conectada · RQ-29 legales · RQ-30 dominio concierge. Pendiente documentar el onboarding de Mercado Pago Connect.

## Decisiones abiertas (Samuel)

Q1 identidad de alumnos · Q3 MFA propio (recomendado: no) · Q4 registro por aplicación en H1 · Q6 quiz opcional · Q7 cuota fija vs comisión. Detalle en `2026-10-13_Plan_Ejecucion_Dia1.md`.

## Hecho

| Fecha | Ítem |
|---|---|
| 2026-10-13 | Job `rls` en `.github/workflows/ci.yml`: Postgres 16 como servicio y `npm run test:rls` en cada PR |
| 2026-10-13 | Suite RLS local con 2 tenants: `npm run test:rls` (52 pruebas, 0 fallos) contra Postgres en Docker (`avantia-pg-test`, puerto 54329) con `db/test/bootstrap.sql` emulando auth/storage. También comprueba que las migraciones se re-aplican sin error. Migraciones 0001–0003 aplicadas en Supabase por Samuel |
| 2026-10-13 | `generar-curso` deriva el tenant de la sesión (ya no del body); responde 401 sin sesión |
| 2026-10-13 | ADR 003 aceptado |
| 2026-10-13 | ADR 004 (cohorte simple) redactado, en estado Propuesta |
| 2026-10-13 | Migración `0003_inscripciones_progreso_eventos` (inscripciones, progreso, eventos, `lecciones.dia_liberacion`) con RLS; reflejada en `schema.sql` |
| 2026-10-12 | Alta de academia transaccional por RPC (ADR 009), login correo + contraseña (ADR 003), Espacio del Creador, fix de host del middleware |
