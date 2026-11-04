# Backlog de Avantia

> Fuente de verdad del trabajo pendiente. Se actualiza en cada sesión de revisión
> y en el mismo PR que cierra un ítem. Los RQ son de `docs/producto/Requerimientos_MVP.md`.
> Los planes por día/sprint viven en este mismo directorio (`AAAA-MM-DD_*.md`).
> Última actualización: 2026-11-03.

Foto del avance contra el MVP completo: `Estado_MVP_2026-10-13.md`.

Estados: `Pendiente` · `En curso` · `Bloqueado` · `Hecho`.

## En curso / siguiente

| ID | Ítem | RQ | Estado | Notas |
|---|---|---|---|---|
| B-01 | Verificar RLS en Supabase real (PostgREST/Storage no cubiertos por la suite) | RQ-04, 31 | En curso | Suite en CI (job `rls`, ver Hecho); falta confirmar que el job pasa en GitHub |
| B-02 | Verificar RLS/Storage en Supabase tras aplicar 0001–0003 | RQ-04 | En curso | Samuel aplicó 0001–0003 el 2026-10-13; falta verificar bucket `logos` y políticas en la base real |
| B-03 | Tests del fix de host del middleware (`endsWith`) | RQ-03 | Pendiente | El fix está (`8f36ed6`), faltan los tests |
| B-05 | Auth con Google (hoy correo + contraseña) | RQ-01 | Pendiente | ADR 003 lo deja como "después" |
| B-06 | Migrar `configuracion/dominio` y `/api/tenants/domain` a tenant por sesión | RQ-04 | Pendiente | Mismo patrón que `generar-curso` |
| B-08 | Resolver historia de git: `main` remoto no comparte historia con `dev` (bloquea el PR y por tanto el job `rls`) | RQ-31 | Bloqueado por decisión de Samuel | Opciones: reemplazar `main`, merge con `--allow-unrelated-histories`, o disparar CI con push |
| B-09 | Landing V3 en producción: activar Google en Supabase Auth (+ Redirect URL `https://app.avantia.app/auth/callback`) y probar el flujo `/postular` de punta a punta | RQ-28 | Pendiente (Samuel) | 2026-10-20: Samuel aplicó `0004_postulaciones` en Supabase y creó la agenda de Google Calendar (`NEXT_PUBLIC_AGENDA_URL`). Código en `dev` (ADR 011, Propuesta) |
| B-10 | Revisar landing V3, `/postular` y legales en móvil real (360–390 px) y escritorio | RQ-28 | Pendiente | La captura headless no baja de ~500 px; no se verificó a 360 px |
| B-11 | Avisar por correo a contacto@goavantia.com cuando llega una postulación | RQ-28 | Pendiente | Hoy solo `/admin/postulaciones` |
| B-12 | Legales: cerrar los `[pendientes]` y alinear con el flujo Google (los términos hablan de contraseña; privacidad menciona teléfono y tema de cursos, que el formulario no pide; duración del programa: 30 días en términos vs "programa gratis" sin plazo en la landing) | RQ-29 | Pendiente (revisión legal) | |
| B-13 | Definir `STAFF_EMAILS` en Vercel, ingresar una vez para sembrar el staff y aprobar el ADR 017 | RQ-06 | Pendiente (Samuel) | 2026-11-01: `0006` aplicada en Supabase y ADR 015 y 016 aceptados. Código en `dev`: zona `/admin` (resumen, postulaciones, creadores, academias, equipo) |
| B-15 | Migración `0009`: revocar `execute` a `anon` en `auth_tenant_id()` y `rls_auto_enable()`, fijar `search_path` en `set_updated_at()` y activar protección de contraseñas filtradas en Auth | RQ-04 | Pendiente | Avisos de `get_advisors` (seguridad) del 2026-11-01; revisar cada función antes de revocar |
| B-14 | Suspender/ocultar una academia desde `/admin` (columna en `tenants` + resolución del host) y cerrar el `signUp` directo con trigger en `auth.users` | RQ-06 | Pendiente | Ver ADR 016 y 017 |
| B-17 | Quiz de repaso, repetición espaciada, insignia «Módulo dominado» y barra de dominio del estudiante (diseño `05` 5.6/5.7 y `04` 4.3) | RQ-17 | En curso | No hay tablas de quiz ni editor del creador (`03`); la XP de hoy solo cuenta lecciones, módulos y curso | 
2026-11-03: lado del creador listo (diseño `03` 3.3/3.4, ADR 022 Propuesta, migración `0009`): editor del quiz por módulo, vista previa y reglas de publicación. Falta aplicar `0009` y el lado del estudiante (responder, XP, insignia, repaso) y los resultados del creador (4.3).
| B-18 | Correo de invitación desde la plataforma (diseño `04` 4.2) y avisos al creador de inscripciones por activar | RQ-23 | Pendiente | El ADR 007 lo dejó fuera del MVP; el diseño lo incluye. Hoy el creador comparte el enlace del curso. Hay plantilla base en `lib/alumno/correos.ts` |
| B-19 | Revisión legal de los textos del alumno (`/terminos` y `/privacidad` dentro del sitio de la academia, [ADR 019](../decisiones/019-legales-del-alumno-en-el-sitio-de-la-academia.md)) y correo de contacto por academia | RQ-29 | **Pendiente: revisión legal URGENTE** (antes de abrir a alumnos reales) | Texto base implementado 2026-11-03 y ADR 019 Aceptada; asume Ley 21.719 vigente desde dic-2026. Mejorarlo tras la revisión (devoluciones, contacto por academia, anexo de encargo). Ver B-12 |
| B-20 | Limitador de intentos del alumno compartido entre instancias (hoy en memoria) | NF-23 | Pendiente | |
| B-22 | Pasarela Mercado Pago por academia ([ADR 020](../decisiones/020-pasarela-de-pago-mercado-pago.md), Propuesta) | RQ-19/20/21 | En pausa hasta nuevo aviso de Samuel (2026-11-03); además Q7 y Q10 | Incluye editor de precio del curso y pantalla «Cobros» |
| B-21 | «Contactos» de empresas (diseño `04` 4.1) y pantalla 5.3 con estado de pago detallado | RQ-14 | Pendiente | Hoy la inscripción pendiente se explica en «Mis cursos» |
| B-07 | Móvil base: viewport, inputs ≥16 px, botones ≥44 px, sidebar colapsable, manifest PWA por tenant | Impacto_Movil | Sin confirmar | Revisar qué quedó hecho |

## H1 — academia gratis cursable desde celular

| RQ | Ítem | Estado |
|---|---|---|
| RQ-13 | Inicio de academia y ficha del curso con temario | Parcial |
| RQ-14 | Inscripción gratuita | Parcial (2026-11-03): registro, confirmación de correo, inscripción pendiente/activa y activación por el creador implementados en `dev`; falta aplicar `0007` (B-16) |
| RQ-15 | Player de lección con control de acceso | Parcial (2026-11-03): player con inscripción activa y liberación por fecha validadas en servidor; sin verificar con datos reales (B-16) |
| RQ-16 | Progreso | Parcial (2026-11-03): marcar lección, avance, XP y niveles derivados; falta quiz (B-17) |
| RQ-18 | Curso completado (sin quiz) | Parcial (2026-11-03): pantalla de cierre con insignia «Curso completado» |
| RQ-26 | Registro de eventos | Esquema listo (0003); falta instrumentar |

## H2 — retención medible

RQ-17 quiz · RQ-22 cohorte (esquema base en 0003/ADR 004; falta regla de liberación y UI) · RQ-24 norma social · RQ-25 presencia del creador · RQ-27 dashboard CR-11 · RQ-23 correo (si hay tiempo).

## H3 — cobro

RQ-19/20/21 Mercado Pago · RQ-28 landing conectada (V3 con postulación lista en `dev`, ver B-09) · RQ-29 legales (borradores publicados en `/terminos` y `/privacidad`, ver B-12) · RQ-30 dominio concierge. Pendiente documentar el onboarding de Mercado Pago Connect.

## Decisiones abiertas (Samuel)

Q3 MFA propio (recomendado: no) · Q4 registro por aplicación en H1 (hoy la postulación existe pero no bloquea crear academia; ADR 011) · ADR 011 por aprobar · Q6 quiz opcional · Q7 cuota fija vs comisión. Detalle en `2026-10-13_Plan_Ejecucion_Dia1.md`.

## Hecho

| Fecha | Ítem |
|---|---|
| 2026-11-03 | Merge de `github/dev` (Vicente: página de la academia y dominio, ADR 021) con las cuentas de alumno. Renumerados lo de Vicente: migración `0007_pagina_academia` → `0008_pagina_academia` (la tabla ya existe en Supabase) y su ADR 018 → [021](../decisiones/021-pagina-publica-de-la-academia.md); mis pantallas de alumno van en `(public)/[domain]/(alumno)` con su encabezado, y el inicio `/` sigue siendo la plantilla del creador con una barra de acceso. `test:rls` 79 ok, vitest 108 ok, Playwright 63 ok |
| 2026-11-03 | Migración `0007` aplicada en Supabase por MCP y verificada (RLS sin acceso `anon`; `test:rls` 69 ok; Playwright 60 ok en móvil 360/390 y escritorio, flujo completo con datos reales y limpieza posterior). Hallazgo: `redirect()` en Server Actions da 404 en dominios de academia (reescritos por middleware); las acciones del alumno devuelven `irA` y el cliente navega (`FormAccion`) |
| 2026-11-03 | Cuentas de alumno por academia (ADR 018, Aceptada): migración `0007` en repo (sin aplicar), registro/ingreso/confirmación/recuperación, inscripción pendiente→activa, Mis cursos, player, progreso con XP, activación por el creador con pago manual. Pruebas: 87 vitest, lint y build ok |
| 2026-11-01 | Migración `0006_staff_y_acceso_crear_academia` aplicada en Supabase por MCP y verificada: `staff` con RLS sin políticas y sin permisos para `anon`/`authenticated`, `tiene_acceso_plataforma()` sin `execute` para clientes, `crear_academia()` restringida a staff o postulación aceptada. ADR 015 y 016 pasan a Aceptada |
| 2026-10-20 | Landing V3 portada (programa gratis, precio preferente 2 meses, FAQ, inicio noviembre 2026, contacto@goavantia.com, sin testimonios); postulación Google → formulario en `/postular` guardada en `postulaciones` (migración 0004, RLS por usuario, +10 pruebas: `test:rls` 62 ok); `/admin/postulaciones`; `/terminos` y `/privacidad` (borradores); agenda vía `NEXT_PUBLIC_AGENDA_URL` |
| 2026-10-13 | Job `rls` en `.github/workflows/ci.yml`: Postgres 16 como servicio y `npm run test:rls` en cada PR |
| 2026-10-13 | Suite RLS local con 2 tenants: `npm run test:rls` (52 pruebas, 0 fallos) contra Postgres en Docker (`avantia-pg-test`, puerto 54329) con `db/test/bootstrap.sql` emulando auth/storage. También comprueba que las migraciones se re-aplican sin error. Migraciones 0001–0003 aplicadas en Supabase por Samuel |
| 2026-10-13 | `generar-curso` deriva el tenant de la sesión (ya no del body); responde 401 sin sesión |
| 2026-10-13 | ADR 003 aceptado |
| 2026-10-13 | ADR 004 (cohorte simple) redactado, en estado Propuesta |
| 2026-10-13 | Migración `0003_inscripciones_progreso_eventos` (inscripciones, progreso, eventos, `lecciones.dia_liberacion`) con RLS; reflejada en `schema.sql` |
| 2026-10-12 | Alta de academia transaccional por RPC (ADR 009), login correo + contraseña (ADR 003), Espacio del Creador, fix de host del middleware |
