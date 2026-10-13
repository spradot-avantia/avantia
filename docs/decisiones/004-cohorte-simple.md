# 004 — Cohorte simple: modalidad del curso y liberación por día

- **Fecha:** 2026-10-13
- **Estado:** Propuesta (pendiente de aprobación de Samuel; esquema en `db/migrations/0003_inscripciones_progreso_eventos.sql`)

## Contexto

RQ-22 pide una versión mínima de cohorte: la evidencia de retención (calendario sincronizado) es la palanca más fuerte pero el efecto está sobrestimado (ver `Investigacion_Retencion.md`), así que se construye lo más simple y se **mide** con RQ-26. Ya existe `cursos.modalidad` (`a_su_ritmo` | `con_fechas`) y `cursos.fecha_inicio` (migración 0001).

## Decisión

- Se conservan los valores existentes de `cursos.modalidad`: `a_su_ritmo` (= autoguiado) y `con_fechas` (= cohorte). No se renombran.
- Nueva columna `lecciones.dia_liberacion` (entero ≥ 0, nulo = disponible desde el inicio). Una lección está liberada si `hoy >= fecha_inicio + dia_liberacion` (zona horaria del tenant). Si el curso es `a_su_ritmo`, `dia_liberacion` se ignora.
- Una sola edición por curso: sin tabla `cohortes`, sin cupos ni varias ediciones.
- `inscripciones.fecha_inicio_alumno` registra desde cuándo cuenta el alumno; quien se inscribe tarde ve todo lo ya liberado.
- **La liberación se valida en servidor** (y en RLS cuando se implemente el player, RQ-15); no basta con ocultarla en la UI. Esta migración solo agrega los datos; la regla se implementa en RQ-15/RQ-22.
- `inscripciones`, `progreso` y `eventos` nacen con `tenant_id`, RLS e índices que parten por `tenant_id`. `eventos` es append-only. El alumno no crea inscripciones directamente: lo hace el servidor (RQ-14) cuando se defina la identidad del alumno (Q1).

## Alternativas descartadas

- Tabla `cohortes` con varias ediciones por curso: costo M–L sin evidencia de que el MVP la necesite.
- Fecha absoluta de liberación por lección: obliga a reeditar todo al reutilizar el curso; el desfase relativo al inicio es más simple.
- Renombrar `modalidad` a `autoguiado`/`cohorte`: churn sin beneficio.

## Consecuencias

- Pendiente: lógica de liberación y UI de `dia_liberacion` en el editor (RQ-22), y control de acceso del player (RQ-15).
- Pendiente: ADR de identidad del alumno (Q1) antes de RQ-14/RQ-05.
- Migración 0003 sin aplicar a ninguna base remota; falta la suite de pruebas RLS con dos tenants.
