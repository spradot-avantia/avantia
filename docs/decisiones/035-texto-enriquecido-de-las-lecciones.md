# 035 — Texto enriquecido de las lecciones (Markdown ampliado + barra de herramientas)

- **Fecha:** 2026-11-06
- **Estado:** Aceptada (alcance elegido por Samuel el 2026-11-06: Markdown ampliado con barra de herramientas, sin imágenes por ahora)

## Contexto

El texto de una lección admitía solo títulos, listas, negrita, cursiva y enlaces (RQ-11, «Markdown simple»). Samuel pidió algo más cercano a Canvas, Obsidian y los módulos de Microsoft Learn: tablas, tarjetas, bloques destacados. Referencias **no verificadas con fuente primaria**; hipótesis de producto a contrastar con los creadores piloto.

## Decisión

1. **Se amplía el parser propio** (`lib/creador/markdown.ts`), que produce un árbol de datos y se renderiza como elementos React: el texto nunca se inyecta como HTML (NF-20). Sin dependencias nuevas ni migración; el texto sigue siendo Markdown en `lecciones.contenido_texto`, así que las lecciones existentes no cambian.
2. **Sintaxis nueva:** `` `código` ``, `~~tachado~~`, `==resaltado==`; tablas con barras y alineación; citas `>`; avisos estilo Obsidian `> [!nota|consejo|importante|advertencia] Título` (con alias en inglés); bloques de código; separador `---`; listas de tareas `- [ ]` / `- [x]` (solo lectura); contenedores `:::pestanas`, `:::tarjetas` (cada elemento con `=== Título`) y `:::desplegable Título`.
3. **Límites:** anidado hasta 3 niveles, 8 elementos por contenedor, 8 columnas y 200 filas por tabla, texto total 20.000 caracteres. Enlaces solo `https`.
4. **Editor:** barra de herramientas sobre el mismo textarea (acciones puras y probadas en `lib/creador/markdownEditor.ts`), atajos Ctrl/⌘ + B, I, K, guía de formato plegable y vista previa al lado del texto desde 1100 px. Botones ≥ 44 px; la barra se desplaza en horizontal en móvil.
5. **Vista del alumno:** pestañas con patrón ARIA y teclado (único componente cliente), tablas con desplazamiento propio, desplegable nativo (`details`). El índice «En esta lección» (ADR 033) sigue contando solo los títulos del nivel superior.

## Alternativas descartadas

- **Editor WYSIWYG (Tiptap) con bloques:** contradice el requerimiento vigente, añade una dependencia pesada, obliga a migrar el formato a JSON y cuesta más en móvil y accesibilidad. Se reevalúa si esto no basta.
- **Librería Markdown + HTML saneado:** más sintaxis gratis, pero un saneador mal configurado es un riesgo de XSS entre academias; el árbol propio es seguro por construcción.
- **Solo tablas, avisos y código:** no cubre tarjetas ni pestañas.

## Consecuencias

- **Imágenes dentro del texto: fuera por ahora.** Exigen almacenamiento (ADR 030), texto alternativo obligatorio y vista con URL firmada; se tratan en un ADR aparte.
- Sin resaltado de sintaxis en el código ni botón de copiar.
- La barra reescribe el valor del textarea: tras usarla, «deshacer» del navegador puede no revertir esa acción.
- Un texto con líneas que empiezan con `>`, `---`, `|…|` o `:::` ahora se interpreta como bloque; no se detectaron casos en el contenido actual, pero conviene revisarlo.
- Cobertura: 31 pruebas unitarias nuevas y `e2e/texto-enriquecido.spec.ts` (12 pruebas en escritorio y móvil 360/390, incluida una carga con `<script>` que no se ejecuta).
