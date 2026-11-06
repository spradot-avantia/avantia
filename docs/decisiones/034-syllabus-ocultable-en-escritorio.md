# 034 — Syllabus ocultable en escritorio

- **Fecha:** 2026-11-06
- **Estado:** Aceptada (pedida por Samuel el 2026-11-06; complementa el ADR 033)

## Contexto

El ADR 033 dejó el syllabus siempre visible desde 900 px. Con lecciones de lectura, el alumno puede querer todo el ancho para el contenido, como permite Microsoft Learn con su tabla de contenidos.

## Decisión

1. Desde 900 px, un botón «Ocultar / Mostrar contenido del curso» (`aria-expanded`, `aria-controls`) sobre el contenido pliega el syllabus; el contenido y el índice «En esta lección» ocupan el espacio liberado.
2. La preferencia se guarda en `localStorage` (`avantia:syllabus-oculto`) y se lee tras montar, para no desajustar el HTML del servidor. Por defecto, visible.
3. Bajo 900 px no cambia: el syllabus sigue siendo un panel plegable.
4. El índice de la lección mantiene la regla del ADR 033 (aparece con al menos 2 títulos `#`/`##`/`###` en el texto); no se inventan títulos a partir de texto en negrita.

## Alternativas descartadas

- **Guardar la preferencia en base de datos:** es una preferencia de pantalla; no justifica una tabla ni RLS.
- **Cookie para renderizar oculto desde el servidor:** evita el parpadeo, pero fuerza lectura de cookies en la ruta; se reevalúa si el parpadeo molesta.

## Consecuencias

- `ShellCurso` pasa a ser Client Component (sus hijos siguen siendo Server Components).
- Posible parpadeo breve al cargar si el alumno lo dejó oculto.
