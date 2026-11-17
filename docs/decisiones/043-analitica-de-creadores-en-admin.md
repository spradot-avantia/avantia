# 043 — Analítica de creadores y academias en /admin

- **Fecha:** 2026-11-17
- **Estado:** Aceptada (Samuel, 2026-11-17)

## Contexto

La analítica de aprendizaje (ADR 040) mide al alumno. Falta ver al creador: en qué etapa de la creación de su academia va, cuándo entró por última vez y cuánta gente tiene. Hoy `/admin` solo tiene conteos globales y una lista de creadores con el último login (`auth.users.last_sign_in_at`). No existe un registro de actividad del creador: la tabla `eventos` es solo de alumnos.

## Decisión

- Página nueva `/admin/analitica`, solo staff, con la cascada de creación (postulación aceptada → academia → identidad → primer curso → con lecciones → publicado → primer alumno → primer pago o activación), tabla por academia y exportación CSV.
- **Sin tablas ni migraciones nuevas:** todo se deriva de columnas existentes, leídas con service role (la excepción ya documentada en ADR 017). El estado de cada etapa sale de fechas y conteos reales (`onboarding_completado_at`, `cursos.estado`, `inscripciones`, `pagos`).
- «Último acceso» = último login del dueño **más** la última edición real (máximo `updated_at` de curso, módulo, lección, academia y página), porque el login no se actualiza en sesiones largas.
- «Estancada» = no llegó a la última etapa y no registra login ni edición hace 14 días o más.

## Alternativas descartadas

- **Tabla `eventos_creador`** (pasos del editor, uso de IA, publicar/despublicar): da más detalle, pero exige migración e instrumentar el editor. Queda como siguiente paso si la derivación no alcanza.
- **PostHog también para creadores:** mezcla datos de personas identificables con el id seudónimo de alumnos y no es necesario para el equipo hoy.

## Consecuencias

- Sin migración: no hay nada que aplicar en producción para esta página.
- Límites: no se ve el avance dentro de los 6 pasos del editor ni el uso de IA; despublicar y republicar no deja historial; la lectura se corta en 20 000 filas por consulta (suficiente para el MVP).
- Los datos son de academias y dueños, accesibles solo para staff; el CSV incluye el correo del dueño.
