# Estado del MVP — 2026-10-13

> Foto del avance contra los 31 RQ de `docs/producto/Requerimientos_MVP.md`. Los estados salen del historial de git, del tamaño y contenido de las páginas y de las pruebas existentes; **no se probó cada flujo de punta a punta**. El detalle ejecutable vive en `BACKLOG.md`. Los estados "Estado:" dentro de `Requerimientos_MVP.md` están desactualizados (son del 2026-10-12, antes del Espacio del Creador).

Resumen: **creador casi completo; alumno, cobro y retención por construir.** El esquema de datos del alumno ya existe; falta toda la experiencia (inscripción, player, progreso) y depende de la decisión Q1.

## Hecho (lado creador y cimientos)

| RQ | Qué | Notas |
|---|---|---|
| RQ-02 | Alta de academia transaccional | RPC `crear_academia` (ADR 009), una academia por usuario |
| RQ-03 | Ruteo por host y 404 neutro | Fix del host del panel hecho; **faltan tests** (B-03) |
| RQ-04 | Aislamiento RLS en todas las tablas | 52 pruebas con 2 tenants (`npm run test:rls`) + job `rls` en CI. **Falta** verificar en Supabase real (B-01/B-02) y que las páginas públicas no esquiven RLS |
| RQ-06 | Rol staff y `/admin` protegido | `STAFF_EMAILS` (provisional) |
| RQ-08 | Panel con checklist de inicio | Dashboard del creador |
| RQ-09 | Curso: datos, modalidad, estado | |
| RQ-10 | Editor de temario | Editor de 6 pasos |
| RQ-11 | Lección de video + texto | Enlace de video + texto |
| RQ-12 | Publicar, vista previa y editar publicado | Reglas de publicación + vista previa |
| RQ-31 (parcial) | Operación mínima | CI (lint, build, regla `admin.ts`, RLS), pruebas unitarias del creador |

## Parcial

| RQ | Qué hay | Qué falta |
|---|---|---|
| RQ-01 | Login con correo + contraseña (ADR 003) | Google (B-05); la decisión de producto dice "solo Google" |
| RQ-07 | Marca elegida en onboarding | `configuracion/marca` es un stub de 6 líneas; ajuste de contraste |
| RQ-13 | Ficha del curso (46 líneas) | Inicio de la academia es stub; temario y CTA de inscripción |
| RQ-14 | Tabla `inscripciones` + RLS | Flujo de inscripción; depende de Q1/RQ-05 |
| RQ-16 | Tabla `progreso` + RLS | Marcado automático/manual, "continuar donde quedaste" |
| RQ-21 | `pais` y `moneda` en `tenants` | Formateo sigue fijo a ARS |
| RQ-22 | `modalidad`, `fecha_inicio`, `lecciones.dia_liberacion` (ADR 004) | Regla de liberación validada en servidor y UI en el editor |
| RQ-26 | Tabla `eventos` append-only | Instrumentar los eventos en la app |
| RQ-27 | Lista de estudiantes básica (60 líneas) | KPIs, embudo por lección, puntaje de quiz, exportación CSV |
| RQ-28 | Landing completa; `/registro` | Persistencia de solicitudes (Q4: por aplicación) |
| RQ-30 | Campo y formulario de dominio | Es un mock: esconderlo o integrarlo con Vercel Domains |

## Falta

| RQ | Qué | Esf. |
|---|---|---|
| RQ-05 | Cuenta del alumno por academia (**bloqueado por Q1**) | M |
| RQ-15 | Player de lección con control de acceso (incluye política de lectura del alumno) | M |
| RQ-17 | Quiz de término | M |
| RQ-18 | Curso completado | S |
| RQ-19 | Cobro con Mercado Pago (webhook con firma e idempotencia) | L |
| RQ-20 | Conexión de la cuenta Mercado Pago del creador (concierge primero) | S |
| RQ-23 | Correo: SMTP propio y un correo recurrente | M |
| RQ-24 | Norma social en la interfaz | S |
| RQ-25 | Presencia del creador (versión barata) | S |
| RQ-29 | Legal y privacidad mínimos (requiere revisión legal) | S |

## Para completar el MVP, por hito

**H1 — academia gratis cursable desde celular** (el siguiente): decidir Q1 → RQ-05 → RQ-13 (inicio y temario) → RQ-14 → RQ-15 (+ liberación RQ-22) → RQ-16 → RQ-18 (sin quiz) → RQ-26 (instrumentar). Además: B-05 Google, B-07 móvil/PWA, B-03 tests de middleware, RQ-29 (no se corta).

**H2 — retención medible:** RQ-17 quiz, RQ-22 completo, RQ-24, RQ-25, RQ-27 dashboard, RQ-23 correo (lo primero que se corta).

**H3 — cobro:** RQ-19, RQ-20, RQ-21 (moneda), RQ-28, RQ-30. Antes: documentar onboarding de Mercado Pago Connect y probar el sandbox.

## Decisiones abiertas que bloquean

- **Q1** identidad de alumnos: bloquea RQ-05, RQ-14, RQ-15 (todo H1 del lado alumno).
- **Q6** quiz obligatorio u opcional (RQ-17/18), **Q7** cuota fija vs comisión (RQ-20), **Q4** registro por aplicación, **Q3** MFA propio.
- Aprobar ADR 004 (hoy Propuesta).

## Riesgos vigentes

1. Alcance: ~83 días-persona originales; el creador ya consumió una parte, pero la experiencia del alumno + cobro siguen siendo la mayor.
2. Historia de git: `main` en GitHub no comparte historia con `dev`; hay que resolverlo antes del primer PR.
3. Migraciones aplicadas en Supabase pero sin verificar políticas de Storage.
4. Video por enlace (YouTube/Vimeo) no protege contenido de pago.
