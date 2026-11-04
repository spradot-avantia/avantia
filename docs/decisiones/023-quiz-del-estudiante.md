# 023 — Quiz de repaso del estudiante: respuestas y XP

- **Fecha:** 2026-11-04
- **Estado:** Aceptada (aprobada por Samuel el 2026-11-04; migración 0011 aplicada en producción; completa la [022](022-quiz-de-repaso-por-modulo.md))

## Contexto

La prueba E2E en producción (2026-11-04) mostró que el creador arma quizzes que el estudiante nunca ve: completa el curso sin responderlos. La 022 dejó el lado del estudiante para después (B-17).

## Decisión

- **Tabla `quiz_respuestas`** (migración `0011`): una fila por respuesta (`alumno_id`, `pregunta_id`, `opcion`, `acierto`, `primer_intento`), con `tenant_id`, RLS por tenant (lectura del creador), índices que empiezan por `tenant_id` y FK compuestas. El estudiante no la lee ni escribe directo: solo el servidor (service role) tras validar sesión, inscripción activa y que la pregunta sea del módulo/curso.
- **Corrección en el servidor.** Las preguntas viajan al estudiante sin `correcta` ni `explicacion`; la explicación y la correcta se devuelven recién al responder.
- **Solo preguntas completas** de un quiz completo (3 a 5): un quiz roto no se muestra.
- **XP derivada** (sin tabla de XP, como el resto): +5 por pregunta respondida y +5 por acierto al primer intento. Se suma a la XP de lecciones.
- **Insignia «Módulo dominado»:** 80 % o más de aciertos al primer intento en el quiz del módulo (derivada).
- **El quiz es opcional para el estudiante:** no bloquea completar lecciones ni el curso.
- **Fuera de esta versión:** repaso espaciado, barra de dominio y resultados del quiz para el creador (diseño 04, 4.3).

## Alternativas descartadas

- Leer `quiz_preguntas` desde el cliente del estudiante: entregaría la respuesta correcta.
- Tabla de XP/insignias materializada: puede desfasarse; se deriva.
- Quiz obligatorio para terminar el módulo: no está decidido (Q6); empieza opcional.

## Consecuencias

- Los estudiantes pueden repetir el quiz; solo el primer intento da XP de acierto y cuenta para la insignia.
- Crece `quiz_respuestas` (≤ 5 filas por módulo por intento): sin problema de volumen en el MVP.
