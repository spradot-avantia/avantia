# 018 — Cuentas de alumno propias de cada academia

- **Fecha:** 2026-11-03
- **Estado:** Aceptada (Samuel, 2026-11-03; resuelve la Q1 del backlog B-04 y la parte de alumnos del ADR 003)

## Contexto

El diseño `docs/2026-11-03 Creador y Alumno/05 Experiencia del estudiante.html` (y la arquitectura de `04`) define que **toda persona crea su cuenta en la academia**, con nombre, correo único por academia, contraseña guardada cifrada y consentimiento con fecha. El mismo correo puede existir en dos academias sin que una vea a la otra (CLAUDE.md, RQ-05).

Supabase Auth tiene un único `auth.users` por proyecto. El ADR 003 dejó abiertas dos salidas: (a) tabla propia de alumnos por tenant con sesión firmada por host, (b) `auth.users` compartido con alias de correo. El Requerimiento Q1 recomendaba una identidad global con tabla `alumnos(tenant_id, user_id)`, pero eso comparte la credencial entre academias y contradice el diseño ("Único por academia", contraseña por academia).

## Decisión

Se adopta la opción (a), con credenciales realmente separadas por academia y sin tocar `auth.users`:

- Tablas `alumnos(tenant_id, correo, password_hash, …)` con `unique (tenant_id, correo)` y `alumno_tokens` (sesiones y enlaces de un solo uso: `sesion`, `confirmar`, `recuperar`). Solo se guarda el hash SHA-256 del token.
- Contraseña con **scrypt** de `node:crypto` (sal por usuario, parámetros en el propio hash para poder subirlos), mínimo 10 caracteres como en el creador. Sin dependencias nuevas.
- **Sesión del alumno**: cookie `av_alumno` httpOnly, `SameSite=Lax`, `Secure` en producción, emitida solo en el host de la academia (sin atributo `Domain`, por lo que no se comparte entre academias ni con el panel). Dura 30 días; el servidor la valida contra `alumno_tokens` y exige que el `tenant_id` del token coincida con el del host.
- **Correo verificado**: las invitaciones del creador solo activan la inscripción cuando el correo del alumno fue confirmado por enlace; sin eso, cualquiera podría registrarse con el correo de otro y heredar su inscripción activa. Ingresar exige correo confirmado.
- Las tablas de alumno (`alumnos`, `alumno_tokens`, `inscripciones`, `progreso`, `pagos`) las escribe **solo el backend** con service role, en `lib/alumno/*`, que es el único módulo de la zona pública autorizado a usar `admin.ts`. Toda query lleva `.eq("tenant_id", tenant.id)` con el tenant derivado del host, nunca del body. RLS queda habilitada con política solo para el creador (miembro del tenant), que lee `alumnos` sin `password_hash` (grant por columnas) y gestiona inscripciones con su propia sesión.
- Las claves foráneas compuestas `(alumno_id, tenant_id)` impiden que una fila de un tenant apunte a un alumno de otro.
- Ciclo de inscripción: `pendiente → activa | rechazada | vencida`. Entra `activa` solo si hay invitación vigente para ese correo y curso **y** el correo está confirmado; si no, `pendiente` hasta que el creador la active (pago manual registrado en `pagos`) o, a futuro, la pasarela. Cursos con `acceso = invitados` no admiten autoinscripción.

Migración: `db/migrations/0007_alumnos_por_tenant.sql` (cambia `inscripciones`, `progreso` y `eventos` de `auth.users` a `alumnos`; se detiene si hubiera filas previas).

## Alternativas descartadas

- **Identidad global + `alumnos(tenant_id, user_id)`** (recomendación original de Q1): comparte la credencial entre academias y permite inferir que un correo está registrado en otra; contradice el diseño aprobado.
- **`auth.users` con alias `tenantId+correo`**: aislamiento total, pero obliga a SMTP y plantillas propias para todo, y complica migraciones (costo M–L, ya evaluado en Q1).
- **Sesión de Supabase Auth en el host de la academia**: rompe la separación de sesiones entre panel y academias fijada en el ADR 003.
- **Código por correo / Google para el alumno** (Q2): evita contraseñas, pero el diseño ya define correo + contraseña y recuperación; se puede sumar después sin cambiar las tablas.

## Consecuencias

- Hay que implementar y mantener recuperación de contraseña, confirmación de correo y limitación de intentos propios (hoy en memoria por instancia, igual que `lib/auth/limite.ts`; TODO NF-23: compartirlo).
- Los correos del alumno salen por Resend con la marca de la academia; sin `RESEND_API_KEY` el enlace queda en el log del servidor (solo fuera de producción) y la cuenta no puede confirmarse.
- El panel de creador necesita leer `alumnos`; se resuelve con RLS + grant por columnas, no con service role.
- Datos personales de alumnos: sumar a la revisión legal (Ley 21.719, B-12).
- Pendiente: pasarela de pago (el disparador `pago` de `activada_por` queda reservado), quiz de repaso y repetición espaciada (no hay aún tablas de quiz), correo de invitación desde la plataforma (el ADR 007 lo dejó fuera; el diseño 04.2 lo incluye).
