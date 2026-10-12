# 007 — Acceso al curso e inscripción por el creador

- **Fecha:** 2026-10-12
- **Estado:** Aceptada (Samuel, 2026-10-12)

## Contexto

La revisión de flujos tachó "por invitación" en CU-05. El diseño del Creador trata el acceso por invitación como el modo del piloto con empresas ("Solo personas que yo invite", recomendado) junto a "Cualquiera con el enlace". Samuel confirmó que **ambos modos** entran al MVP, con inscripción manual por el creador.

## Decisión

- `cursos.acceso` ∈ `invitados | enlace` (por defecto `invitados`).
- El creador registra correos (pegados, separados por coma/espacio/salto de línea) en `invitaciones` (`tenant_id`, `curso_id`, `email` en minúsculas, `estado` `pendiente|aceptada|revocada`, único por curso+email).
- La plataforma **no envía correos de invitación** en el MVP: el creador comparte el enlace del curso. Al entrar, el alumno se identifica y, si su correo está registrado (modo `invitados`), queda inscrito; en modo `enlace` cualquiera con el enlace puede inscribirse.
- Los alumnos siguen siendo por tenant: el mismo correo puede estar en academias distintas.
- Publicar con `invitados` y sin estudiantes es solo una recomendación, no un bloqueo.

## Alternativas descartadas

- Solo enlace público: no cubre el piloto con empresas.
- Invitaciones por correo desde la plataforma: fuera del MVP (requiere proveedor de correo y manejo de rebotes).

## Consecuencias

- Depende de la decisión de identidad del alumno (ADR 003, pendiente) para cerrar el vínculo correo → cuenta → inscripción.
- Las páginas públicas del curso deben respetar `acceso` y `estado = publicado`.
- Nueva superficie de datos personales (correos): limitarla por RLS por tenant.
