# 032 — Flujo curso → módulo → lección más directo

- **Fecha:** 2026-11-06
- **Estado:** Aceptada (aprobada por Samuel el 2026-11-06; se implementa por fases F1–F3). Nota: el número 031 queda reservado para el ADR de Google Drive que menciona el backlog (B-30), que aún no se escribe.

## Contexto

El ADR 029 separó la edición en dos niveles (lista de módulos → pantalla del módulo). Funciona, pero el recorrido no es directo:

- **Creador:** para editar la 2.ª lección del módulo 3 hay que ir a Paso 3 → «Abrir» módulo 3 → bajar hasta la lección → volver a la lista para pasar a otro módulo. Con 3 módulos de 2 lecciones eso son varias pantallas de ~3.000 px en móvil. La lista no muestra las lecciones ni permite ver el curso completo de un vistazo.
- **Alumno:** al entrar a un curso (`/aprender/[cursoId]`) se redirige directo a una lección. **No existe una pantalla de módulo**: la descripción, «Qué aprenderás» y la duración del módulo solo aparecen en la ficha pública del curso, y el temario lateral solo lista títulos de lecciones. El alumno nunca ve la presentación que el creador escribió.

Referencias consultadas el 2026-11-06 (documentación pública y páginas de Microsoft Learn; **no se vieron los paneles de creador**, que exigen cuenta):

- **Teachable** (ayuda oficial): curso → sección → lección, edición en una pestaña *Curriculum* con arrastrar y soltar. La liberación (*drip*) es solo por sección.
- **Kajabi** (ayuda oficial): curso → módulo → submódulo → lección o quiz, en una sola página de esquema con un botón «+» por nivel; generador de esquema con IA.
- **Microsoft Learn** (páginas vistas): curso (ficha «At a glance», resumen, requisitos, syllabus) → módulo (objetivos, requisitos, lista de unidades con minutos, evaluación) → unidad (duración arriba, contenido en video o texto, cierre con «siguiente»). Todos los módulos siguen la misma secuencia: introducción, contenido, ejercicio, evaluación, resumen.
- **Sabionet:** solo reseñas de terceros (hipótesis, sin verificar).

Hipótesis, no hechos: que un esquema único reduzca el tiempo de armado, y que una pantalla de módulo para el alumno mejore la continuidad. Se miden (ver Consecuencias).

## Decisión

### A. Creador: un esquema único del curso (Paso 3)

1. El Paso 3 pasa de «lista de módulos» a **esquema del curso**: cada módulo como bloque plegable que muestra sus lecciones (título, tipo, duración, estado Listo/Falta contenido) y su quiz.
2. Desde el esquema se puede, **sin abrir el módulo**: renombrar módulo y lección, reordenar (subir/bajar, ya existente), agregar y eliminar lecciones, y abrir una lección para editar su contenido.
3. La pantalla del módulo (ADR 029) se mantiene para lo que necesita espacio: presentación («Qué aprenderás», duración), materiales del módulo y quiz. «Abrir» pasa a llamarse «Presentación y quiz».
4. Editar una lección abre su pantalla con migas «Curso › Módulo › Lección» y navegación «Lección anterior / siguiente» que cruza módulos.
5. Estructura sugerida (ya existente) se amplía con una **plantilla de módulo** opcional: Introducción → Lecciones → Ejercicio → Quiz → Resumen. Es una sugerencia que el creador puede borrar, no una regla.

### B. Alumno: pantalla de módulo

6. Ruta nueva `/aprender/[cursoId]/modulo/[moduloId]` con: título, descripción, «Qué aprenderás», duración total, lista de lecciones con duración y estado (completada / disponible / se abre el…), quiz de repaso y progreso del módulo.
7. Entrada al curso: si el alumno **nunca abrió** el curso, aterriza en la pantalla del primer módulo; si ya tiene avance, sigue yendo a la lección donde quedó (sin cambio).
8. Al terminar la última lección de un módulo se ofrece pasar a la pantalla del módulo siguiente (hoy ofrece el quiz y luego la siguiente lección).
9. La ficha pública del curso y esta pantalla reutilizan el mismo componente de presentación de módulo.

### C. Fuera de esta decisión

- Liberación (*drip*) por módulo en vez de por lección: se evalúa aparte, junto con el ADR de cohortes (004).
- Selector video/texto por lección (como Learn): queda como idea; hoy cada lección tiene un solo formato.
- Sin migración de datos: todo se resuelve con las columnas y tablas de 0015–0017.

## Alternativas descartadas

- **Quedarse con el ADR 029 tal cual:** el recorrido de edición sigue siendo largo y el alumno no ve la presentación del módulo.
- **Arrastrar y soltar:** Teachable y Kajabi lo usan, pero exige más trabajo de accesibilidad con teclado y táctil. Se mantiene subir/bajar y se reevalúa.
- **Submódulos (Kajabi):** un nivel más de jerarquía; no hay demanda de creadores y complica el móvil.
- **Secuencia de módulo fija como Learn:** quita decisiones, pero impone la forma a todos los creadores; se ofrece como plantilla.
- **Editor de una sola página sin pantalla de módulo:** vuelve al problema que originó el ADR 029 (pantalla de ~3.000 px).

## Consecuencias

- Sin cambios de esquema ni de RLS. Las acciones existentes (`crear/mover/eliminar módulo y lección`, `actualizarModuloAction`) cubren el esquema; las queries nuevas del alumno filtran por `tenant_id` como el resto de `lib/alumno`.
- Cambios de código acotados: `PasoEstructura` (esquema), `EditorModulo` (menos secciones), una ruta nueva de alumno y un componente compartido de presentación de módulo. **Se coordina con el trabajo sin commit de B-30** (`EditorLecciones`, `EditorMateriales`), que toca los mismos archivos.
- Actualizar `docs/arquitectura` (rutas del alumno y editor) y `BACKLOG.md`.
- Mobile-first: el esquema se verifica a 360–390 px (el riesgo es que un esquema con todas las lecciones se vuelva largo; por eso los módulos van plegados por defecto en móvil).
- **Cómo se mide:** tiempo de armado de un curso de 3 módulos con un creador piloto, y proporción de alumnos que pasan del módulo 1 al 2, antes y después. Sin estas medidas la mejora sigue siendo hipótesis.
- Fases desplegables por separado: **F1** pantalla de módulo del alumno (aporta valor solo y no toca el editor); **F2** esquema del creador; **F3** plantilla de módulo.

## Nota de implementación (F1 y F2, 2026-11-06)

- **F1** (alumno): ruta `/aprender/[cursoId]/modulo/[moduloId]` con la lógica pura en `lib/alumno/moduloReglas.ts`. La primera entrada al curso (sin lecciones abiertas ni completadas) redirige a la presentación del primer módulo con lecciones; con avance se mantiene el comportamiento anterior. Al cambiar de módulo, «Siguiente» de la lección pasa por la presentación del módulo siguiente.
- **F2** (creador): el Paso 3 es el esquema plegable. **Desviación respecto al punto 4:** no se creó una pantalla propia por lección con migas «Curso › Módulo › Lección»; «Editar» abre la pantalla del módulo con esa lección ya desplegada (`?leccion=<id>`, validado contra el módulo) y el foco en su título. Evita duplicar el editor de lecciones (600 líneas, con archivos y materiales). La navegación «lección anterior/siguiente» entre módulos queda pendiente.
- **Punto 9 resuelto (2026-11-06):** la ficha pública y la pantalla de módulo del alumno comparten `components/tenant/PresentacionModulo.tsx` (`DescripcionModulo` y `ObjetivosModulo`); cambia solo el contenedor visual.
- **F3 hecha (2026-11-06):** botón «Usar plantilla de lecciones» en un módulo vacío del esquema. Crea cuatro lecciones de texto vacías: Introducción, Desarrollo, Ejercicio y Resumen (el quiz de repaso del módulo ocupa el lugar de la evaluación de Microsoft Learn). La acción `aplicarPlantillaModuloAction` solo actúa si el módulo no tiene lecciones, así que nunca pisa ni duplica; la plantilla vive en `lib/creador/plantillaModulo.ts`.
- **Punto 4, navegación entre lecciones:** al abrir una lección en la pantalla del módulo, «← Lección anterior» y «Lección siguiente →» recorren todo el curso y cruzan de un módulo a otro.
- **Corrección del punto 8 (2026-11-06):** la prueba con clics reales mostró que completar la última lección de un módulo saltaba directo a la primera del módulo siguiente, sin pasar por su presentación ni por el aviso del quiz. Ahora, al completar la última lección de un módulo, el alumno se queda en ella (ya completada, con los XP ganados) y desde ahí elige el quiz de repaso o «Siguiente módulo →»; al terminar el último módulo sigue yendo al cierre del curso (`esUltimaDelModulo` en `lib/alumno/moduloReglas.ts`).