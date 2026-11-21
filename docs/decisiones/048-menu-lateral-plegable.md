# 048 — Menú lateral del panel plegable a íconos

- **Fecha:** 2026-11-20
- **Estado:** Propuesta (espera la aprobación de Samuel).

## Contexto

En la revisión del Inicio del creador (B-53, lienzo de diseño «Inicio del creador — Avantia»), Samuel marcó el menú lateral de 264 px como espacio muerto en escritorio: no dejaba ver en una sola pantalla los cursos con su completitud, «Necesitan tu ayuda» y «Temas que cuestan más». Se compararon dos opciones en el lienzo: menú lateral plegado a íconos y barra superior. Samuel eligió el menú lateral plegado.

## Decisión

- En escritorio (≥ 900 px) el menú lateral del panel se puede **plegar a una barra de íconos de 76 px** con un botón (`BotonMenuLateral`, `aria-expanded`). Plegado, los nombres siguen disponibles para lectores de pantalla y como `title` al pasar el mouse; se ocultan el correo de la sesión y la firma.
- **Por defecto está plegado.** La elección se guarda en la cookie `cr_menu` (`plegado` | `abierto`, un año, solo preferencia de interfaz). El layout del panel la lee en el servidor para pintar el estado correcto sin parpadeo.
- En móvil no cambia nada: barra superior + menú desplegable.
- El contenido del Inicio usa *container queries* (no el ancho de la ventana), porque el ancho útil depende de si el menú está plegado.

## Alternativas descartadas

- **Barra superior en escritorio:** libera aún más ancho, pero con 7–8 secciones (más Administración) la fila se satura y cambia la navegación de todo el panel.
- **Guardar la preferencia en `localStorage`:** se lee recién en el cliente y el menú parpadearía al cargar cada página.
- **Guardarla en la base de datos por usuario:** costo de esquema y RLS para una preferencia de interfaz.

## Consecuencias

- Todas las pantallas del panel ganan ancho con el menú plegado. Las que usan breakpoints por ventana siguen funcionando, pero conviene usar *container queries* en las nuevas.
- Un creador nuevo ve íconos sin nombre hasta que despliega el menú: los íconos deben ser claros y cada enlace lleva `title`.
- Falta revisarlo en navegador (escritorio, claro y oscuro) con datos de dev.
