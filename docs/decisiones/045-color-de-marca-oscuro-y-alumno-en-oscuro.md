# 045 — Color de marca para fondo oscuro y modo oscuro en la experiencia del alumno

- **Fecha:** 2026-11-19
- **Estado:** Propuesta (espera la aprobación de Samuel). Reemplaza en parte al 044 (solo el alcance).

## Contexto

El 044 dejó a las academias en claro porque el color de cada una puede no leerse sobre fondo oscuro. El alumno es 100 % móvil y muchos celulares usan modo oscuro, así que Samuel pidió que, al crear la academia, también se elija el color para oscuro, con el contraste revisado contra fondo claro **y** oscuro. Además, en el panel oscuro el color de la academia (`--cr-brand`) no cumplía AA con ningún color de la paleta: #0A1029 daba 1,1:1.

## Decisión

- **Columna nueva `tenants.color_primario_oscuro`** (migración 0024), con `check` hexadecimal. `null` significa automático.
- **Automático por defecto:** `colorParaOscuro` mezcla el color con blanco, manteniendo el tono, solo lo necesario para llegar a 4,5:1 sobre los tres fondos oscuros (`#0c1020`, `#151b30`, `#1e2542`). El creador puede elegir otro color, pero no se guarda si no cumple AA en oscuro.
- **Selector con vista previa doble** (onboarding y Mi academia): el color como texto y como botón sobre fondo blanco y sobre fondo oscuro, con sus ratios.
- **Alcance del modo oscuro:**
  - Panel del creador y admin (como en el 044), ahora con la variante oscura de la marca.
  - **Experiencia del alumno (`.al`)**: cuenta, cursos, lecciones, quiz y progreso.
  - La página de inicio pública de la academia (plantillas `.st`, 67 colores fijos) **sigue en claro** por ahora.
- **Mecanismo:** `varsMarca()` entrega `--{cr,al}-brand-claro` y `--{cr,al}-brand-osc`. `tema-oscuro.css` usa la variante `-osc` bajo `prefers-color-scheme: dark`. Las vistas previas `.av-claro` siguen en claro.
- **Fondo:** el fondo oscuro es el de Avantia, el mismo para todas las academias. El creador no lo elige.

## Alternativas descartadas

- **Que el creador elija también el fondo oscuro:** multiplica las combinaciones que hay que validar y no aparece como necesidad. Se puede sumar con otra columna si las entrevistas lo piden.
- **Solo ajuste automático, sin elección:** es más simple, pero el pedido fue elegir. El automático queda como recomendado.
- **Oscurecer también la página pública ahora:** sus plantillas tienen colores fijos propios; es un trabajo aparte (backlog).

## Consecuencias

- **Orden de despliegue:** la migración 0024 debe aplicarse en cada entorno **antes** del código, porque `resolve.ts` y `tenantActual.ts` leen la columna. Ya está aplicada en dev (2026-11-19). En producción, solo cuando Samuel lo pida.
- Hay que revisar en un navegador, con datos reales, las pantallas del alumno en oscuro: lección con video y texto enriquecido, quiz, tareas y progreso.
- Queda pendiente la versión oscura de las plantillas públicas (`sitio.css`).
