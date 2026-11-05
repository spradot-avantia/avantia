# 029 — Módulos enriquecidos y edición por módulo

- **Fecha:** 2026-11-05
- **Estado:** Aceptada (aprobada por Samuel el 2026-11-05; se implementa por fases F1–F3)

## Contexto

Hoy un **módulo** es solo un título y una lista de lecciones; cada **lección** es un único contenido (video, texto o enlace a un documento) con título. El Paso 3 del editor muestra todos los módulos juntos en una pantalla de ~1.800 px en escritorio y ~3.000 px en móvil, con botones de subir/bajar y de eliminar en cada fila. El curso «Claude para analítica de datos» quedó con 3 módulos de 2 lecciones de texto corto cada uno: la estructura no permite describir un módulo, declarar qué se aprende en él, estimar su duración ni adjuntar varios materiales. Samuel pidió algo más completo, como Canvas o Microsoft Learn, y poder abrir cada módulo como pantalla propia.

Referencias (**no verificadas con fuente primaria; hipótesis de producto a contrastar**): Canvas organiza el curso en módulos con ítems de distinto tipo (páginas, archivos, enlaces) y requisitos de finalización; Microsoft Learn estructura cada módulo con introducción, objetivos de aprendizaje, unidades con contenido y verificación de conocimientos, resumen y tiempo estimado.

## Decisión

1. **Edición por módulo.** El Paso 3 pasa a ser una **lista de módulos** (tarjeta con título, número de lecciones, estado «Listo / Falta contenido», si tiene quiz, subir/bajar y «Abrir»). Cada módulo se abre en su **propia pantalla** `/cursos/[cursoId]/modulos/[moduloId]`, con migas («Curso › Módulo»), guardado automático y botón «Volver a los módulos». En móvil es una pantalla completa por módulo.
2. **Pantalla del módulo**, en este orden: *Presentación* (descripción, «Qué aprenderás» con 1 a 4 puntos, duración estimada), *Lecciones* (editor completo de cada lección), *Materiales del módulo* (enlaces y documentos) y *Quiz de repaso* (el de la 022, sin cambios).
3. **Lección enriquecida:** además de su contenido principal, descripción breve, duración estimada y **materiales** (0 a N enlaces o documentos con título y nota). Los documentos siguen siendo **enlaces https** (ADR 008); la subida de archivos propios sigue fuera de alcance (ADR 005).
4. **Datos** (**migración `0015` = F1**: columnas de módulo y lección, aplicada el 2026-11-05; **migración `0016` = F2**: tabla `materiales`): `modulos.descripcion text`, `modulos.objetivos text[]` (máx. 4), `modulos.duracion_min int`; `lecciones.descripcion text`, `lecciones.duracion_min int`; tabla nueva `materiales` (`tenant_id`, `curso_id`, `modulo_id`, `leccion_id` opcional, `titulo`, `url`, `tipo` documento|enlace, `nota`, `orden`) con claves foráneas compuestas por `tenant_id`, RLS en las 4 operaciones, índice `(tenant_id, modulo_id, orden)` y validación de URL como en `validarUrlLeccion`.
5. **Alumno:** la lección muestra descripción, duración y «Materiales»; el curso muestra cada módulo con su presentación y «Qué aprenderás». Progreso y XP no cambian.
6. **IA:** el único endpoint (`generar-curso`) propone descripción, objetivos y duración por módulo; **no inventa URLs** de materiales, los aporta el creador.
7. **Fases desplegables por separado:** F1 lista de módulos + pantalla del módulo con los campos nuevos; F2 materiales; F3 vista del alumno e IA. Después se reescribe el contenido del curso de Claude con las pantallas nuevas.

## Alternativas descartadas

- **Mantener todo en una pantalla larga:** es el problema actual; no escala a módulos con más contenido.
- **Constructor de bloques libre (JSON por lección):** muy flexible pero costoso en editor, validación, accesibilidad y progreso para un MVP; se reevalúa si F1–F3 no bastan.
- **Subir archivos ahora (ADR 005):** exige almacenamiento, cuotas, antivirus y costos; los enlaces cubren el piloto.
- **SCORM / importar de Canvas:** fuera del alcance del MVP.

## Consecuencias

- Una migración y una tabla nueva con RLS por tenant (prueba de aislamiento obligatoria) y tests de validación.
- El editor tiene dos niveles de pantalla; la autoguardado y los bloqueos de publicación (`reglasPublicacion`) deben contemplar los campos nuevos como opcionales (no bloquean publicar).
- Hay que actualizar `docs/arquitectura` (modelo de datos) y el backlog.
- Sin verificar: que los creadores piloto necesiten materiales múltiples por lección; conviene validarlo en las entrevistas antes de F3.


## Nota de implementación (F1, 2026-11-05)

La migración se separó en dos para desplegar por fases: `0015` (columnas `modulos.descripcion/objetivos/duracion_min` y `lecciones.descripcion/duracion_min`, con checks de largo y rango) ya está aplicada; `0016` (tabla `materiales`) llega con la F2. Los campos son opcionales y no bloquean la publicación. Ruta nueva: `/cursos/[cursoId]/modulos/[moduloId]`.
