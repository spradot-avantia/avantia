# 033 — Syllabus lateral e índice de la lección en la vista del alumno

- **Fecha:** 2026-11-06
- **Estado:** Aceptada (pedida por Samuel el 2026-11-06 a partir de Microsoft Learn; se implementa en una sola fase)

## Contexto

Hoy el alumno ve el temario del curso como una tarjeta a la **derecha** de la lección, con todos los módulos desplegados, y no hay forma de moverse dentro de una lección larga. Microsoft Learn (páginas revisadas el 2026-11-06) pone el contenido del curso a la izquierda y, a la derecha, un índice de la página que acompaña el scroll. El ADR 032 agregó la pantalla de módulo; falta que la navegación del curso esté siempre a mano.

## Decisión

1. **Syllabus a la izquierda** (lección y pantalla de módulo): avance del curso y un acordeón de módulos. El módulo actual parte abierto y el resto plegado; cada módulo muestra «Resumen del módulo», sus lecciones con estado (completada, disponible, aún no disponible) y el quiz.
2. **Índice de la lección a la derecha**: tarjeta «En esta lección» con los títulos del texto de la lección (`#`, `##`, `###`, que se muestran como h2, h3 y h4 porque el h1 es el título de la página), con sangría por nivel. **Se queda fija mientras se hace scroll** (`position: sticky`) y marca la sección que se está leyendo. Aparece solo si la lección es de texto y tiene al menos 2 títulos; las de video o documento no tienen títulos que indexar.
3. **Responsive:** ≥1180 px, tres columnas (syllabus, contenido, índice). Entre 900 y 1179 px, syllabus a la izquierda y el índice como panel plegable sobre el contenido. En móvil, ambos son paneles plegables («Contenido del curso» y «En esta lección») sobre el contenido, cerrados por defecto.
4. Los títulos del texto reciben un `id` estable derivado de su texto (sin tildes, único dentro de la lección) para poder enlazarlos.
5. Sin cambios de datos ni de RLS: el índice se calcula del texto ya cargado.

## Alternativas descartadas

- **Mantener el temario a la derecha:** no deja lugar al índice de la página y se aleja de la referencia pedida.
- **Índice generado con JavaScript leyendo el DOM:** frágil y sin contenido en el HTML inicial; se calcula en el servidor desde el mismo parser que renderiza el texto.
- **Índice para video y documento:** no hay títulos; se evaluaría con capítulos o marcas de tiempo, fuera de alcance.
- **Syllabus siempre desplegado:** en cursos largos obliga a hacer scroll dentro del panel.

## Consecuencias

- Cambio de diseño transversal del alumno: componentes nuevos de marco del curso (`ShellCurso`, `SyllabusCurso`, `IndiceLeccion`); el marco antiguo (`.al-player`) se mantiene para el quiz y el repaso.
- `MarkdownMinimo` pasa a emitir `id` en los títulos, también en la vista previa del creador y la ficha (sin efecto visible).
- Accesibilidad: los paneles plegables usan `aria-expanded`, el índice es una `nav` con nombre y marca `aria-current="location"`; el scroll suave respeta `prefers-reduced-motion`.
- Hipótesis, no hecho: que el índice y el syllabus mejoren la finalización de lecciones largas; se mide junto con lo del ADR 032.
