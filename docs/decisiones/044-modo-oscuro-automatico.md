# 044 — Modo oscuro automático en las pantallas de Avantia

- **Fecha:** 2026-11-17
- **Estado:** Propuesta (espera la aprobación de Samuel)

## Contexto

Se pidió que la plataforma cambie sola a modo oscuro cuando el sistema o el navegador de la persona lo tiene activado. Los colores ya viven en los tokens `--av-*` (`avantia-tokens.css`), pero solo existía la paleta clara. Los sitios de las academias y la experiencia del alumno usan el color de marca de cada academia y el equipo los dejó fijos en claro (`color-scheme: only light` en `academia.css`).

## Decisión

- **Automático, sin interruptor:** se sigue `prefers-color-scheme`. Sin JavaScript ni cookie, así que no hay parpadeo al cargar.
- **Alcance: solo Avantia.** Aplica dentro de `.av-scope`: landing, postulación, acceso, onboarding, panel del creador y admin. Las academias y el alumno no usan `.av-scope` y siguen en claro.
- **Una sola hoja nueva**, `styles/tema-oscuro.css`, importada en `globals.css` después de los tokens. Redefine los tokens de color en oscuro (`:root:has(.av-scope)` para que también cambie el fondo del `body`) y corrige los pocos colores fijos de las hojas de componentes. Las correcciones llevan `:root` delante para ganarle a la regla original sin `!important`.
- **Las vistas previas de una academia siguen en claro**, como las verá el alumno: mockups de la landing (`.lp-stage`, `.lp-dstage`), vista previa del curso (`.fc`), marca (`.mk-prev`) y página (`.pg-nav__cuerpo`). Para una vista previa nueva basta la clase `.av-claro`.
- **Contraste AA** en oscuro: texto principal 14,5:1 sobre las tarjetas, secundario 6,9:1, enlaces 8:1 y blanco sobre el azul primario 4,7:1.
- El logotipo de texto (`avantia-wordmark.png`) se muestra en blanco con un filtro; el isotipo no cambia.

## Alternativas descartadas

- **Interruptor claro/oscuro guardado por persona:** necesita guardar la preferencia y evitar el parpadeo con un script antes de pintar. Se puede sumar después sobre los mismos tokens.
- **Oscuro también en las academias:** el color de marca de cada academia puede no leerse sobre fondo oscuro. Exigiría calcular una variante por academia y revisar cada plantilla.
- **Duplicar cada hoja de componentes con su versión oscura:** son unas 20 hojas; los tokens ya resuelven casi todo.

## Consecuencias

- Las hojas nuevas deben usar tokens `--av-*`, no colores fijos. Si un color fijo es inevitable, hay que agregar su corrección en `tema-oscuro.css`.
- Las pantallas que no se revisaron en navegador con datos reales (editor del curso completo, página de la academia, estudiantes, analítica, admin con datos) pueden tener detalles por corregir.
- Si luego se quiere un interruptor manual, se agrega `data-tema` en `<html>` y se duplican los tokens bajo ese selector.