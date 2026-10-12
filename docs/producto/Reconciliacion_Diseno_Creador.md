# Reconciliación: diseño "Creador White Label" vs decisiones del proyecto

Fecha: 2026-10-12. Fuente: `Creador White Label.html` (12 pantallas/flujos; fuentes extraídas en `docs/design/creador-white-label/pantallas/`).
Se contrasta con: `Revision_Flujos_Creador_Alumno_2026-10-12.md`, `Requerimientos_MVP.md`, `docs/decisiones/*`, `Supuestos_y_Pendientes.md`, `CLAUDE.md`, `Impacto_Movil_UX.md`.

## 1. Qué propone el diseño (puntos clave)

**Contexto:** el espacio del creador se piensa para **un piloto con empresas/expertos** ("Contratos Mineros" de ejemplo). Todos los cursos son **sin costo** en esta etapa; "cobros, comunidad y estructurar con IA" figuran como "aún no disponible".

1. **Shell del creador ("Espacio del Creador"):** menú lateral (móvil: barra superior) con **logo + nombre de la academia** y la firma discreta "Con la tecnología de Avantia" al pie. Secciones: Inicio, Cursos, Estudiantes, Mi academia.
2. **Onboarding de 3 pasos (primera vez):** 1 Bienvenida (qué puede hacer hoy) → 2 Tu academia (nombre, frase, área) → 3 Color y logo (logo opcional, iniciales como respaldo, color, vista previa) → "Entrar a mi espacio".
3. **Carga de logo:** PNG/JPG/SVG/WebP, ≤ 2 MB, ≥ 128 px por lado; 6 estados (vacío, arrastrando, revisando, cargado, error, "logo y nombre/solo logo"); logos anchos (> 1,8:1) se muestran solos por defecto; errores dicen qué pasó y cómo resolverlo.
4. **Mi academia → Marca:** nombre, logo, cómo se muestra, color, vista previa (menú lateral y página del estudiante), guardar/descartar, indicador "cambios sin guardar/guardado". Aviso de dónde aparece el logo y quién ve la academia.
5. **Inicio:** checklist "Tus pasos para abrir el piloto" (4: configurar academia, crear curso, publicar, **registrar estudiantes del piloto**), KPIs (cursos publicados, estudiantes registrados, sesiones en 14 días, avance de estudiantes) y "Próximas sesiones en vivo". Tarjeta "Sube tu logo" si no hay logo.
6. **Crear curso — "Cómo empezar":** estructura sugerida (3 módulos: contexto, casos reales, aplicación; recomendado) o desde cero; mismo editor en ambos casos.
7. **Editor de 6 pasos** (cualquier orden, borrador autoguardado, "Guardar y salir"):
   1 Lo esencial (título 5–80 car., descripción 50–400, ¿para quién? opcional) · 2 Objetivo (1–3 objetivos "Al terminar podrán…", guía Evita/Mejor) · 3 Estructura y contenido (**módulos → lecciones**; formato **Video / Texto / Documento**; "Listo" por lección) · 4 Modalidad y fechas (**A su ritmo** o **Con fechas de inicio y término**; opción "Incluir sesiones en vivo" con asistencia manual) · 5 Acceso (**Solo personas que yo invite** —recomendado en pilotos— o **Cualquiera con el enlace**) · 6 Revisar y publicar.
8. **Revisar y publicar:** lista "Necesario para publicar" con enlace "Corregir en <paso>", "Recomendaciones" que no bloquean, resumen editable, **vista previa escritorio/móvil como estudiante** (botones desactivados), diálogo de confirmación, estado "Publicando…", error con "tu borrador sigue guardado — Reintentar", éxito con **enlace para compartir** y "Lo que sigue".
9. **Inicio con curso publicado:** 3 de 4 pasos, siguiente "Registrar a los estudiantes del piloto", "Copiar enlace del curso", lista de cursos con estado y "N estudiantes · solo invitados".
10. **Flujos:** configuración de academia, crear primer curso, publicar primer curso (diagramas en pantallas 05, 08, 12).

## 2. Reconciliación

Estados: ✅ compatible · 🟡 compatible con ajuste · 🔴 conflicto (decisión de Samuel).

| # | Tema del diseño | Decisión/arquitectura vigente | Estado | Resolución propuesta |
|---|---|---|---|---|
| 1 | Entrada con cuenta del creador | Solo Google (RQ-01); sin DEMO_TENANT_SLUG | 🟡 | El diseño no define login. Mientras no exista auth, las páginas usan `getCurrentTenant()` (hoy DEMO_TENANT_SLUG, provisional ya registrado) y se cambia por sesión en RQ-01. |
| 2 | Onboarding nombre/frase/área | RQ-02: alta transaccional, subdominio, "elige otro"; RQ-07 | 🟡 | Se agregan `tenants.frase` y `tenants.area`. El nombre sigue derivando slug/subdominio (RQ-02); el diseño no muestra la elección de subdominio: se muestra como texto "tu academia vivirá en <slug>.avantia.app" con edición opcional. |
| 3 | Logo subido (PNG/JPG/SVG/WebP) | Decisión previa: identidad **genérica con iniciales** (CR-04); RQ-07 solo iniciales | 🟡 | Compatible: el logo es **opcional** y las iniciales son el respaldo. Requiere **Supabase Storage** (bucket por tenant) y **sanitizar SVG** (XSS en un tenant podría tocar sesiones del mismo origen, NF-20). Propuesta: aceptar SVG solo tras sanitizar (o convertir a raster); si el equipo prefiere recortar, quitar SVG. → ADR 005. |
| 4 | Color de la academia | RQ-07 incluye ajuste de contraste AA ("ajuste sugerido" aprobado) | ✅ | Mantener el cálculo de contraste del botón/enlace sobre el color elegido. |
| 5 | Firma "Con la tecnología de Avantia" | CLAUDE.md: no mostrar marca Avantia dentro de una academia salvo 404 neutro | 🟡 | Solo en el **panel del creador** (su espacio), nunca en el sitio público del estudiante. Aclarado en el diseño: "solo como firma discreta al pie del menú". Sin conflicto. |
| 6 | Menú: Inicio · Cursos · Estudiantes · Mi academia | Dashboard actual es admin de Avantia (lista todas las academias); RQ-06 | 🟡 | El espacio del creador reemplaza el panel actual por tenant; el listado global pasa a una ruta `/admin` protegida con rol staff (RQ-06). |
| 7 | **Módulos → lecciones** | RQ-10: "sin tabla de módulos; sección = texto" | 🔴→🟡 | El diseño exige módulos reales (nombre, orden, "Agregar módulo", estructura sugerida de 3). **Se revierte el recorte de RQ-10**: tabla `modulos`. Costo S adicional. ADR 006. |
| 8 | Formatos Video / Texto / **Documento** | Decisión: solo video + texto, sin archivos (CU-03) | 🟡 | "Documento" es **enlace a Google Drive** (no subida de archivos; el diseño dice "Subir archivos aún no está disponible"). Se admite como tipo `documento` solo con enlace validado (lista blanca). Es una ampliación menor y reversible; se anota en el doc de revisión. Video: YouTube, Vimeo y **Google Drive** (el diseño lo menciona; Drive video no es embebible igual → validar). |
| 9 | **Acceso: "Solo personas que yo invite" (recomendado) / "Cualquiera con el enlace"** | Revisión de flujos: se tachó "por invitación" en CU-05 (y RQ-09: "sin rama por invitación") | 🔴 | **Conflicto real.** Mi lectura del tachado en el PDF pudo ser incorrecta (la fila CU-05 aparecía con check verde y solo el texto "por invitación" tachado en el nodo). El diseño trata la invitación como el modo del **piloto con empresas**. Implementación: campo `acceso` (`invitados` \| `enlace`) y **inscripción manual por el creador** (lista de correos) — barato de soportar ambos. **Necesito confirmación de Samuel** antes de construir "Registrar estudiantes". |
| 10 | Registrar estudiantes (manual) | No estaba en RQ; "inscripciones" las crea el alumno (RQ-14) | 🟡 | Nuevo RQ-32 (S–M): el creador pega correos → crea `invitaciones`/pre-inscripciones; el alumno entra con su método y queda inscrito (depende de Q1 identidad). Enlace de invitaciones por correo **no** disponible (el diseño lo dice: el creador comparte el enlace). |
| 11 | Modalidad "con fechas de inicio y término" | RQ-22: cohorte con `fecha_inicio` y `dia_liberacion` por lección | 🟡 | Compatible con RQ-09 (`modalidad`, `fecha_inicio`) más `fecha_termino` opcional. La liberación por lección (RQ-22) **no** está en el diseño: queda para H2. |
| 12 | **Sesiones en vivo** (programar con enlace Zoom/Meet/Teams, asistencia manual, KPI "sesiones en 14 días") | Requerimientos: comunidad/eventos en vivo → DESPUÉS | 🔴→🟡 | Fuera del primer corte de construcción. La UI de Inicio muestra el módulo **vacío/deshabilitado** ("Próximamente") o se omite; la opción "Incluir sesiones en vivo" del paso 4 se oculta hasta tener el backend. Decidir con Samuel si entra a H2. |
| 13 | Objetivos de aprendizaje (1–3) y "¿para quién es?" | No estaban; encaja con captura de intención y calidad de oferta | ✅ | Columnas/tabla `curso_objetivos` (máx. 3) y `cursos.publico`. |
| 14 | Autoguardado de borrador + "Guardar y salir" | RQ-09 estado `borrador`/`publicado` | ✅ | Guardado optimista (debounce ~800 ms) con server actions; sin pérdida al salir. |
| 15 | Vista previa escritorio/móvil como estudiante | RQ-12: "no se construye modo preview separado; se reutilizan las páginas reales con permiso de dueño" | 🟡 | El diseño muestra una pantalla de preview dedicada con botones desactivados. Decisión: componente de **vista previa del curso** (ficha) reutilizable, renderizado con los mismos componentes del sitio público y un flag `preview` (CTAs desactivados), en marco de escritorio/móvil. No se duplica lógica. |
| 16 | Publicación con checklist de requisitos y confirmación | RQ-12 | ✅ | Reglas de publicación = validaciones del diseño (título ≥5, descripción 50–400, ≥1 objetivo, módulos con nombre y lecciones con contenido, modalidad y acceso definidos). |
| 17 | Enlace del curso `contratosmineros.academia/<slug>` | Dominio propio: concierge (RQ-30); subdominio `*.avantia.app` por defecto | 🟡 | El enlace usa `custom_domain` si existe, si no `<slug>.avantia.app/curso/<slug-curso>` (ruta ya existente). |
| 18 | KPIs del Inicio (avance, sesiones) con "Sin datos todavía" | CR-11/RQ-27 en H2; RQ-26 eventos | 🟡 | H1 muestra KPIs reales que ya se pueden calcular (cursos publicados, estudiantes registrados) y estados vacíos para el resto. |
| 19 | Móvil: barra superior con logo | Impacto_Movil_UX: creador lee/responde en móvil, edición pesada en escritorio | 🟡 | El diseño está en 1440 px. Se construye responsive: en móvil, navegación inferior/superior, editor en una columna con pasos como stepper compacto; aviso "para editar la estructura es más cómodo en escritorio". Reordenar con botones (sin drag&drop). |
| 20 | Texto de lección "tal como lo escribiste" | NF-20: Markdown simple sanitizado | ✅ | Textarea con Markdown mínimo y sanitización. |
| 21 | Actividades ("Caso para decidir", "agrega una actividad") | Quiz/actividades: RQ-17 (H2) | 🔴→🟡 | En H1 **no** se construye tipo "actividad"; la recomendación "agrega una actividad" se oculta. Reaparece con RQ-17. |
| 22 | Aislamiento por tenant | RQ-04, CLAUDE.md | ✅ | Todas las tablas nuevas con `tenant_id` + RLS + índice; acceso con cliente de sesión. |

## 3. Decisiones que pide el diseño (para Samuel)

1. **Acceso por invitación (fila 9):** ¿confirmas que el modo "Solo personas que yo invite" entra al MVP (como pide el piloto con empresas) y reviertes el tachado de la revisión? Recomendación: sí, ambos modos, con inscripción manual por el creador.
2. **Módulos reales (fila 7):** recomendado aceptar (revierte el recorte de RQ-10).
3. **Documento por enlace de Drive (fila 8):** recomendado aceptar solo como enlace.
4. **Sesiones en vivo (fila 12):** recomendado diferir a H2; en H1 se muestra "Próximamente".
5. **Logo con SVG (fila 3):** recomendado aceptar con sanitización, o excluir SVG si preferimos menor superficie de ataque.

## 4. ADRs a abrir (estado Propuesta)

- **ADR 005 — Almacenamiento y validación del logo** (Supabase Storage por tenant, límites, sanitización SVG, servido con tipo de contenido seguro).
- **ADR 006 — Estructura de curso: módulos reales** (reemplaza el recorte "sección = texto" de RQ-10).
- **ADR 007 — Modo de acceso a curso e inscripción por el creador** (depende de la decisión 1).
- ADR 003 (identidad compartida) sigue pendiente de Samuel.

## 5. Cambios al alcance H1

Entran: onboarding 3 pasos, Mi academia/Marca con logo, shell del creador, Inicio con checklist, Cursos (lista), crear curso (sugerida/desde cero), editor de 6 pasos con módulos, revisar y publicar con vista previa, Inicio con publicado, **registrar estudiantes por correo** (pendiente decisión 1).
Quedan fuera: sesiones en vivo, actividades, cobros, IA, drag&drop, subida de archivos, invitaciones por correo desde la plataforma.

## 6. Decisiones de Samuel (2026-10-12)

1. Acceso: **ambos modos** (`invitados` y `enlace`), con inscripción manual por el creador.
2. **Módulos reales**: aceptado (revierte el recorte de RQ-10).
3. Documento: por enlace en el MVP; el modelo queda listo para archivos propios (`storage_path`, bucket privado por tenant con URLs firmadas) como evolución.
4. Sesiones en vivo: **"Próximamente"**.
5. Logo SVG: **aceptado con sanitización**.
