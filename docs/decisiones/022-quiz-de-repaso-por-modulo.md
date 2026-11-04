# 022 — Quiz de repaso por módulo (lado del creador)

- **Fecha:** 2026-11-03
- **Estado:** Propuesta (espera la aprobación de Samuel; ligada a la pregunta abierta Q6)

## Contexto

El diseño "03 · Cursos, crear, quiz y publicar" agrega, dentro del paso 3 del editor, un **quiz de repaso por módulo** (pantalla 3.3) y una recomendación en Revisar y publicar (3.4). RQ-17 pedía un quiz de término por curso; el diseño lo cambia a uno por módulo, alimentando luego XP, la insignia «Módulo dominado», el repaso espaciado y la barra de dominio (diseño 05, B-17). No existían tablas de quiz.

## Decisión

- **Tabla `quiz_preguntas`** (migración `0009`) con `tenant_id`, RLS por tenant en las cuatro operaciones, índices que empiezan por `tenant_id` y FK compuestas a `cursos` y `modulos` (borrar el módulo borra su quiz). No hay tabla `quizzes`: el quiz de un módulo es el conjunto de sus preguntas.
- **Pregunta:** opción múltiple (2 a 4 respuestas) o verdadero/falso (respuestas fijas), una sola correcta (`correcta`, índice) y una explicación opcional. El id lo genera el editor (uuid) y se conserva al editar, para que los intentos futuros del estudiante apunten a la pregunta.
- **Borrador:** se guarda solo, aunque esté incompleto. Un quiz está **listo** con 3 a 5 preguntas completas (texto, correcta marcada, sin respuestas vacías ni repetidas).
- **Publicación (respuesta propuesta a Q6):** el quiz es **opcional**. Si un módulo no tiene quiz, Revisar y publicar lo **recomienda** (no bloquea). Si un módulo tiene un quiz empezado pero incompleto, **bloquea** la publicación hasta completarlo o eliminarlo, para no mostrar a los estudiantes un quiz roto.
- **La respuesta correcta nunca va al alumno por RLS:** el alumno no lee la tabla. Cuando exista el quiz del estudiante, el servidor le enviará las preguntas sin `correcta` y corregirá en el servidor (RQ-17, CA).
- **Vista previa** dentro del editor: el creador responde sus preguntas listas como lo vería el estudiante; no guarda nada.

## Alternativas descartadas

- Un quiz de término por curso (RQ-17 original): el diseño y la insignia por módulo lo reemplazan.
- Tablas `quizzes` + `opciones` normalizadas: más joins y escrituras sin necesidad; las opciones son 2 a 4 textos cortos y viajan juntas.
- Bloquear la publicación sin quiz: el diseño lo marca como recomendación y Q6 sugiere opcional.

## Consecuencias

- Falta el lado del estudiante (diseño 05: responder, XP, «Módulo dominado», repaso espaciado y barra de dominio) y los resultados del quiz para el creador (diseño 04, 4.3). Sigue en B-17.
- Las preguntas se reemplazan por módulo en cada guardado (actualiza, crea y borra); con 5 preguntas como máximo, el costo es bajo.