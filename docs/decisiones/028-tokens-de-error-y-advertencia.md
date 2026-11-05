# 028 — Tokens de error y advertencia en el sistema de diseño

- **Fecha:** 2026-11-05
- **Estado:** Propuesta (pendiente de aprobación de Samuel; sin código todavía)

## Contexto

`avantia-tokens.css` define éxito (`--av-success`, `--av-success-bg`) pero no error ni advertencia. Resultado, medido en la auditoría B-26: el rojo se escribe a mano en 7 hojas de estilo con dos valores (`#b42318`, 15 usos, y `#b3261e`), el fondo de error tiene 4 variantes (`#fdecea`, `#fef3f2`, `#fce6e4`, `#fda29b` de borde) y la advertencia se resuelve con colores sueltos (`#7a4b00` sobre `#fff6e5`). Dos pantallas de error pueden verse distintas y cualquier ajuste de contraste obliga a tocar muchos archivos. CLAUDE.md pide usar tokens y no hardcodear colores.

## Decisión (propuesta)

Agregar a `avantia-tokens.css` dos familias con el mismo patrón que éxito (texto, fondo y borde), todas con contraste ≥ 4,5:1 texto/fondo y ≥ 3:1 borde/fondo:

- `--av-danger` `#b42318`, `--av-danger-bg` `#fef3f2`, `--av-danger-line` `#fda29b`, `--av-danger-ink` `#7a271a` (texto sobre el fondo).
- `--av-warning` `#b54708`, `--av-warning-bg` `#fff6e5`, `--av-warning-ink` `#7a4b00`.

Migración mecánica: reemplazar los valores sueltos por estos tokens en `alumno.css`, `creador.css`, `editor.css`, `quiz.css`, `marca.css`, `pagina.css`, `auth.css` y `admin.css`, sin cambiar la apariencia salvo unificar `#b3261e` y las variantes de fondo. Se documenta en `docs/design/Sistema_Diseno_Avantia.md`. El éxito del alumno pasa a usar `--av-success` (ya hecho en el lote de la auditoría).

Fuera de alcance: `sitio.css` (white-label, mantiene sus neutros propios) y el color del tenant.

## Alternativas descartadas

- **Dejar los valores sueltos:** es lo que generó la divergencia.
- **Un solo rojo sin familia (solo `--av-danger`):** obliga de nuevo a escribir fondos y bordes a mano.
- **Tokens semánticos por componente (`--btn-danger`, `--alert-danger`):** más capas de las que necesita un equipo de dos personas de desarrollo.

## Consecuencias

- Un cambio de contraste o de marca se hace en un solo lugar.
- La verificación visual de la migración es acotada: pantallas con errores de formulario, quiz del alumno y avisos del panel.
- El PR debe revisar con axe las pantallas tocadas.
