# 024 — Repaso espaciado de las preguntas falladas

- **Fecha:** 2026-11-04
- **Estado:** Propuesta (espera la aprobación de Samuel; extiende la [023](023-quiz-del-estudiante.md))

## Contexto

La retención es el diferenciador del producto: práctica de recuperación y cadencia. Hoy el estudiante responde el quiz una vez y, si falla, no hay nada que lo haga volver. La [022](022-quiz-de-repaso-por-modulo.md) y la 023 prometían un repaso espaciado («día siguiente, 3 y 7 días»); se retiró esa promesa del editor porque no existía. Separamos retención de conocimiento (lo que esta decisión busca) de retención del alumno (que no abandone): el repaso las mueve en distinta medida y se mide aparte.

## Decisión

- **Sin tabla nueva ni migración.** El calendario de repaso se **deriva** de `quiz_respuestas` (ya tiene `created_at`, `acierto` y `pregunta_id` por alumno). Cada respuesta de repaso es una fila más, con `primer_intento = false`.
- **Reglas** (por alumno y pregunta, a partir de una falla):
  1. Una pregunta entra al repaso cuando su **última** respuesta es incorrecta; vence 1 día después de esa respuesta.
  2. Acierto en el repaso: sube de etapa y vence a los **3 días**; otro acierto, a los **7 días**; un tercer acierto la da por **aprendida** y sale del repaso.
  3. Una falla en cualquier etapa vuelve a la etapa 1 (vence al día siguiente).
- **Día calendario en `America/Santiago`** (es-CL por defecto): «a los 3 días» es el tercer día calendario, no 72 horas, para que el repaso caiga en la mañana siguiente y no a media noche.
- **Dónde se ve:** tarjeta «Repaso de hoy» en Mis cursos con la cantidad de preguntas vencidas y un botón «Repasar» que abre un mini-quiz con solo esas preguntas (mismo `QuizPlayer`, misma corrección en el servidor).
- **XP:** el repaso **no** da XP ni cuenta para «Módulo dominado» (que sigue siendo solo primer intento): evita jugar el sistema repitiendo para sumar.
- **Server-side, mismas reglas de seguridad:** `tenant_id` del host, alumno de la sesión, inscripción activa, pregunta del curso; el estudiante nunca recibe `correcta` antes de responder.
- **Fuera de esta versión:** recordatorios por correo/WhatsApp («tienes 3 preguntas para repasar»), que son un nudge aparte y dependen de la decisión de canal; barra de dominio (decisión propia).

## Alternativas descartadas

- **Tabla `repasos` materializada** (próxima fecha y etapa guardadas): más rápida de consultar, pero puede desfasarse de las respuestas y exige migración y RLS nuevas. Se reevalúa si el volumen lo pide.
- **Algoritmo tipo SM-2 / Leitner completo:** más preciso, pero sin datos propios para calibrarlo; los intervalos 1-3-7 ya estaban prometidos y son fáciles de explicar al estudiante y al creador.
- **Repaso con XP:** incentiva repetir por puntos y no por aprender; contradice la decisión de dejar la gamificación pesada fuera del MVP.

## Consecuencias

- Cada consulta de «Repaso de hoy» recorre las respuestas del alumno en sus cursos (≤ 5 filas por módulo por intento): sin problema de volumen en el MVP, con índice `(tenant_id, alumno_id, curso_id)` ya existente.
- Los intervalos quedan como constantes en un solo archivo de reglas puras, con pruebas unitarias; cambiarlos no toca datos.
- Los resultados del quiz para el creador (primer intento) no cambian: el repaso no los contamina.
- **Se mide** (evidencia, no hipótesis): % de preguntas falladas que se repasan, % que llegan a «aprendida» y retorno al curso en días de repaso. Hasta tener esos datos, el beneficio sobre la retención es una **hipótesis**, no un hecho.
