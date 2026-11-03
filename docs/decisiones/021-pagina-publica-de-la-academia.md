# 021 — Página pública de la academia: templates, borrador y publicación

- **Fecha:** 2026-11-03
- **Estado:** Propuesta (espera la aprobación de Samuel)

## Contexto

El diseño "02 · Página de la academia y dominio" agrega, desde Mi academia: una encuesta de 5 preguntas que recomienda un template (Programa, Maestro o Consultor), un editor del contenido de la página con vista previa, publicación sin contenido de ejemplo y la conexión de un dominio propio. Hasta ahora `(public)/[domain]/page.tsx` era un stub y no había dónde guardar nada de esto.

## Decisión

- **Tabla `paginas_academia`**, una fila por academia (`tenant_id` es la clave primaria), con RLS por tenant en las cuatro operaciones (migración `0008`). Guarda el **borrador** (template, título, bajada, foto, acción principal, cursos ocultos, nombre y trayectoria, testimonios) y una copia **`publicado`** (jsonb) que se escribe al presionar "Publicar". El sitio público solo lee `publicado`.
- **Contenido de ejemplo:** no se guarda. Un campo vacío muestra el ejemplo del template (marcado en naranjo) solo en la vista previa del creador; no se puede publicar mientras falten título, bajada, nombre, trayectoria o queden los testimonios de ejemplo.
- **Testimonios:** solo reales, con casilla de autorización (se guarda `autorizado_at`); máximo 6.
- **Cursos:** se muestran los publicados; el creador oculta los que no quiere (`cursos_ocultos`), así un curso nuevo aparece sin pasos extra.
- **Acción principal:** "Inscribirme" (lleva a la ficha del curso). "Agendar una conversación" queda como **Próximamente** hasta que exista la pestaña Contactos de Estudiantes (diseño 04).
- **Foto de portada:** bucket `logos` existente, carpeta del tenant (`{tenant_id}/portada-<ts>.<ext>`), JPG/PNG/WebP, ≤ 2 MB, horizontal y ≥ 1.200 px de ancho. Se reutilizan la detección de tipo real y la lectura de dimensiones de `validacion.ts`.
- **Dominio propio (concierge, RQ-30):** el creador escribe su dominio y ve los registros DNS (CNAME o A + TXT `_avantia` con un token). Se guarda en `dominio_solicitado`; **el equipo** verifica y conecta el dominio en Vercel y recién entonces llena `tenants.custom_domain`. No hay verificación automática; la tarjeta lo dice. Esto reemplaza el mock de `configuracion/dominio` (B-06).
- **Lectura pública:** `lib/sitio/paginaPublica.ts` usa `supabaseAdmin` filtrando por `tenant_id` (agregado a la lista blanca de `check-admin-imports.mjs`), igual que la ficha del curso.
- **Marca Avantia:** los templates no muestran "Con tecnología de Avantia" (regla de `CLAUDE.md`: sin marca Avantia dentro de una academia), aunque el diseño la incluye en el pie.

## Alternativas descartadas

- Columnas en `tenants`: mezcla configuración de la academia con contenido editable y su versión publicada.
- Sin copia publicada (el sitio lee el borrador): cada tecla se vería en vivo; el diseño pide "Publicar cambios".
- Guardar el contenido de ejemplo como valor inicial: arriesga publicar datos inventados.
- Verificación DNS automática (Vercel Domains API): costo L; RQ-30 la deja para cuando haya tracción.

## Consecuencias

- La página pública depende de que el creador publique; mientras no lo haga, el sitio muestra un inicio simple con sus cursos publicados.
- Las respuestas de la encuesta no se guardan; solo el template elegido.
- Falta: avisar al equipo por correo cuando llega una solicitud de dominio, y la pestaña Contactos para activar "Agendar una conversación".