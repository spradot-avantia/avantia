# 027 — Identidad visual por academia más allá del color

- **Fecha:** 2026-11-05
- **Estado:** Aceptada (aprobada por Samuel el 2026-11-05; la implementación queda como ítem de backlog, sin migración aún)

## Contexto

Hoy cada academia solo personaliza **color primario, logo (o iniciales) y frase**. Con el mismo tipo, los mismos radios y la misma composición, dos academias se ven casi iguales y el alumno no siente que está en «la casa» de su creador. La auditoría de diseño (B-24) lo señaló como la mayor brecha frente a productos como Skool. Al mismo tiempo, CLAUDE.md pide tokens (nada de tipografías ni colores sueltos), accesibilidad AA y que en el sitio de una academia no aparezca marca Avantia.

## Decisión (propuesta)

Ampliar la identidad con **un conjunto cerrado de opciones**, no con estilos libres:

1. **Par tipográfico** a elegir entre 3–4 pares curados (p. ej. «Clásico» serif + sans, «Moderno» solo sans, «Cercano» redondeada, «Editorial» serif de titulares). Se cargan con `next/font` solo si la academia los usa.
2. **Forma:** dos escalas de radio (`recta` / `suave`), aplicadas por token (`--al-radio`, `--st-radio`).
3. **Portada de la academia:** imagen opcional (ya existe `fotoUrl` en la página pública); en el sitio del alumno se reutiliza como cabecera de «Mis cursos».
4. **Color:** se mantiene el primario actual; se deriva un tono de superficie (tinte muy claro) calculado con `color-mix`, validando contraste AA como hoy con `textoSobre`.

Datos: columnas nuevas en `tenants` (`tipografia text`, `forma text`, ambas con `check` de valores permitidos y default), migración `0014` y actualización de `schema.sql`. Son configuración del tenant, no tablas nuevas, así que la RLS y los índices por `tenant_id` existentes cubren el cambio. El valor se lee en servidor desde el host; nunca del body.

Edición: sección «Apariencia» en la configuración del creador, con vista previa en vivo en móvil; en el MVP solo lo ve el creador.

## Alternativas descartadas

- **CSS o fuentes libres por academia:** rompe el sistema de diseño, la accesibilidad y el rendimiento, y es difícil de soportar.
- **Temas completos por plantilla (más allá de las dos de la 021):** mucho costo de diseño para un MVP con pocas academias.
- **Dejar solo color + logo:** deja la brecha de percepción que originó esta propuesta.

## Consecuencias

- Cada par tipográfico agrega peso de fuente solo para quien lo elige; hay que medir el LCP del sitio del alumno en 4G antes de aprobar el conjunto final.
- Hay que verificar contraste AA de cada combinación color × tipografía × forma (matriz pequeña, automatizable con axe).
- Queda fuera del alcance: modo oscuro por academia y fuentes subidas por el creador.
- Si se aprueba: migración 0014, tokens en `alumno.css`/`sitio.css`, pantalla «Apariencia» y actualización de `docs/design` y `docs/arquitectura`.
