# 026 — Dominio por estudiante en el panel del creador

- **Fecha:** 2026-11-05
- **Estado:** Aceptada (aprobada por Samuel el 2026-11-05; migración 0013 aplicada en producción; completa la [025](025-barra-de-dominio.md))

## Contexto

El creador ve el avance (lecciones) y el XP de cada estudiante, y el acierto del quiz **por módulo** (ADR 023/022), pero no sabe **quién** está aprendiendo y quién solo avanza. La 025 dejó este indicador para una decisión propia porque, del lado del creador, la lectura cruza a **muchos** estudiantes: hoy `listarInscripciones` trae todas las respuestas del quiz de la academia para sumar XP, algo que no escala.

## Decisión

- **Mismo número que ve el estudiante** («Lo que dominas», `calcularDominio` + reglas del repaso de la 024), mostrado junto al avance en cada inscripción **activa** de Estudiantes: «Dominio 67 % (6/9)». Que ambos lados coincidan evita explicar dos cifras.
- **Lectura acotada, sin traer respuestas crudas de toda la academia.** Migración `0013` con dos funciones SQL de solo lectura (`security invoker`, así que aplica la RLS del creador):
  - `quiz_resumen_por_alumno(p_tenant, p_alumnos[])`: por alumno y curso, preguntas respondidas y aciertos al primer intento (agregado en la base). Reemplaza la lectura completa de `quiz_respuestas` que hoy alimenta el XP del quiz.
  - `quiz_respuestas_para_repaso_lote(p_tenant, p_alumnos[], p_ventana)`: lo mismo que la función de la 024 pero para varios alumnos (solo preguntas falladas, últimas 8 respuestas).
- **Tope por consulta: 200 estudiantes** (los más recientes con inscripción activa). Más allá, el indicador no se calcula y la fila no muestra el indicador; la paginación de Estudiantes (con el dominio calculado por página) queda como siguiente paso cuando haya academias con ese volumen.
- Ejecutables por `authenticated` y `service_role`, **no** por `anon`. Una persona autenticada de otra academia que llame con un `p_tenant` ajeno recibe 0 filas por RLS (probado).
- **Sin quiz o sin respuestas:** no se muestra el indicador (no se inventa un 0 %). Lenguaje sin culpa para el estudiante; para el creador, descriptivo («Dominio», «Aún por repasar»).
- **El Inicio no lo calcula:** `listarInscripciones({ conQuiz: false })`, porque solo usa el avance promedio; el dominio se calcula únicamente en Estudiantes.
- **No se agrega alerta ni nudge automático** con este dato: eso exige su propia decisión (cómo y cuándo contactar).

## Alternativas descartadas

- **Mostrar solo el acierto al primer intento:** distinto al número del estudiante; confunde y castiga al que aprende en el repaso.
- **Tabla materializada de dominio:** puede desfasarse y exige migración, RLS y trabajos de actualización; no hace falta con el tope y las funciones acotadas.
- **Calcularlo para todos los estudiantes en cada visita:** es justo lo que se quiere evitar al escalar.

## Consecuencias

- Mejora de paso el costo actual de Estudiantes: el XP del quiz deja de leer todas las respuestas de la academia.
- Con más de 200 estudiantes activos, los más antiguos muestran «—» hasta que exista paginación (límite conocido y documentado).
- **Hipótesis, no hecho:** que ver el dominio por estudiante lleve al creador a intervenir y mejore la retención. Se mide: cuántos creadores abren el indicador y qué hacen después; hasta entonces no es evidencia de impacto.
