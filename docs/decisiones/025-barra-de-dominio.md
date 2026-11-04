# 025 — Barra de dominio del curso

- **Fecha:** 2026-11-05
- **Estado:** Aceptada (aprobada por Samuel el 2026-11-05; usa las reglas de la [023](023-quiz-del-estudiante.md) y la [024](024-repaso-espaciado-del-quiz.md))

## Contexto

El avance de un curso mide **lecciones completadas**, no si se aprendió. Un estudiante puede llegar al 100 % sin recordar nada. Separamos retención del alumno (que no abandone, que mide el avance) de retención de conocimiento (que mide el quiz y el repaso). Hoy el estudiante solo ve lo primero. El editor del quiz prometió una «barra de dominio» y se retiró porque no existía.

## Decisión

- **Dominio = preguntas del curso que el estudiante da por dominadas ÷ total de preguntas de los quizzes completos del curso**, en porcentaje. Se muestra en «Mis cursos» y en «Mi progreso», **aparte** de la barra de avance y con otro nombre («Lo que dominas»), para que no se confundan.
- Una pregunta cuenta como **dominada** si:
  1. la acertó **al primer intento**, o
  2. la falló y llegó a **«aprendida»** en el repaso espaciado (3 aciertos en fechas de repaso, ADR 024).
  Equivale a: respondidas menos las que hoy están en repaso. Una pregunta fallada que sigue en repaso **no** cuenta todavía; una falla nueva la saca de dominadas.
- **Derivada, sin tabla ni migración** (como la XP y la insignia): se calcula desde `quiz_respuestas`. Reusa las reglas puras de `repasoReglas.ts` para decidir «aprendida», de modo que el repaso y el dominio nunca discrepen.
- **Escala:** las preguntas respondidas salen de las filas del alumno en ese curso (`tenant_id` + `alumno_id` + `curso_id`, índice existente; es la misma lectura que ya alimenta la XP del quiz y crece solo con los intentos de **un** alumno). Si esa lectura llegara a pesar, se reemplaza por una función agregada, sin cambiar la regla. Las preguntas falladas usan la función acotada `quiz_respuestas_para_repaso` (ADR 024: últimas 8 respuestas por pregunta). Ninguna consulta recorre respuestas de otros alumnos.
- **Sin quiz, sin barra:** un curso sin quizzes completos, o donde el estudiante aún no respondió nada, no la muestra (no se inventa un 0 %).
- **El dominio no bloquea nada** (ni el certificado ni el avance): es información para el estudiante.
- **Para el creador:** no cambia lo ya resuelto (acierto al primer intento por módulo). Un indicador de dominio por estudiante queda para el dashboard del creador (CR-11), con su propia decisión.
- Redacción sin culpa: «Lo que dominas» y «Aún por repasar», nunca «fallaste».

## Alternativas descartadas

- **Dominio = solo aciertos al primer intento:** más simple, pero castiga para siempre al que falla y luego aprende; contradice la idea del repaso.
- **Tabla materializada `dominio`:** puede desfasarse de las respuestas y exige migración y RLS; no hace falta con el volumen del MVP.
- **Fusionarlo con la barra de avance:** mezcla dos señales distintas (constancia vs. conocimiento) y esconde justo lo que el producto busca mostrar.
- **Ponderar por dificultad:** sin datos para calibrarlo.

## Consecuencias

- El estudiante ve su progreso de **conocimiento**, no solo de constancia, y el repaso tiene un efecto visible (la barra sube al aprender lo fallado).
- Mientras pocos cursos tengan quiz completo, la barra aparecerá en pocos lugares.
- **Hipótesis, no hecho:** que ver la barra aumente el repaso o la retención. Se mide: % de estudiantes que entran a repasar tras ver la barra y el cambio de dominio entre la primera y la segunda semana.
- Los intervalos y el umbral viven en archivos de reglas puras con pruebas; cambiarlos no toca datos.
