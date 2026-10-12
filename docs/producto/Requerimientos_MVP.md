# Requerimientos del MVP — Avantia LMS

> Recogida de requerimientos (2026-10-12). Fuentes leídas: `Revision_Flujos_Creador_Alumno_2026-10-12.md` (decisiones de Samuel), `Avantia_Flujos_MVP.md`, `avantia-viaje-usuario-mvp` (workflow), `Mercado_Segmento_Expertos_Entrevistas.md`, `Retencion_Evidencia_Inicial.md`, `docs/arquitectura/*`, `db/schema.sql` y `apps/web`.
>
> Límites de este documento: no tuve el PDF original de Inkodo; los códigos CR/CU/AL/N salen de la revisión escrita (no aparecen CU-04 ni AL-06; verificar contra el PDF). Las cifras de retención y de mercado están **sin verificar** (lo dicen sus propios documentos). La ley chilena y los datos de Mercado Pago deben confirmarse antes de comprometerse (marcados con "verificar").
>
> Escala de esfuerzo (días-persona de un dev con asistencia de IA, incluye pruebas): **S** ≤ 2 días, **M** 3–5 días, **L** 6–10 días.

---

## 0. Resumen ejecutivo

- El repo hoy es **un esqueleto, no un producto**: 911 líneas de TypeScript fuera de la landing; la mayoría de las pantallas son stubs de 7–13 líneas. Existen: ruteo por host, resolución de tenant con caché, 3 tablas (`tenants`, `cursos`, `membresias`), una landing de marketing (el formulario no guarda nada) y un mock de dominio. **No existen**: auth, lecciones, inscripciones, progreso, quiz, pagos, correo, ni un solo test.
- Propongo **31 requerimientos MVP-AHORA, ~83 días-persona**. Con un dev a tiempo completo y un aprendiz a media jornada (más revisión), son **12–16 semanas calendario**. Es demasiado para "MVP rápido", por eso se entrega en **tres hitos** con línea de corte (sección 3.7):
  - **H1 (~7–8 semanas)**: un design partner opera una academia real con cursos gratuitos (cuenta, academia, curso con lecciones, inscripción, player, progreso). Sin quiz, sin cobro, sin correo.
  - **H2**: quiz de término, liberación programada, norma social, correo semanal, dashboard CR-11.
  - **H3**: cobro con Mercado Pago.
- Orden deliberado: **el cobro va al final** (como ya decía `Avantia_Flujos_MVP.md`) y se puede sustituir por cobro externo + inscripción asistida para los 2–3 primeros partners. Pero la tesis "cobro local" es una de las dos razones por las que alguien dejaría Hotmart, así que no puede quedar fuera de la versión que se muestre a más gente.
- Hallazgos del código que cambian el plan (detalle en 4.1): el panel interno usa service role **sin ninguna autenticación**; el middleware tiene un bug de ruteo (`myapp.avantia.app` caería al panel); **Supabase Auth tiene un solo pool de usuarios por proyecto**, lo que choca con "credenciales por academia" (decisión de Samuel); la moneda está fija en ARS; `generar-curso` acepta `tenantId` del body (cualquiera podría gastar créditos de IA de otro tenant).

---

## 1. Supuestos y objetivo del MVP

### 1.1 Objetivo

> Que **3 a 5 expertos (design partners) de LatAm hispanohablante** lancen una academia con marca y subdominio propios, publiquen un curso de video + texto, lo vendan o regalen a su audiencia en el celular, y vean **quién avanza y quién abandona**, en menos de un día de trabajo del creador. Y medir si las palancas de retención (cadencia, recuperación, presencia) mueven la finalización.

El MVP no tiene que ganarle a Hotmart en funciones. Tiene que probar dos cosas: (1) que un experto pequeño paga o prefiere una plataforma suya en español con cobro local, y (2) que la retención como producto (finalización medible por tenant) es algo que el creador valora. Todo lo que no ayude a probar (1) o (2) en las primeras 8–12 semanas va a DESPUÉS.

### 1.2 Supuestos

| # | Supuesto | Fuente / estado |
|---|---|---|
| S1 | Usuario objetivo: experto con audiencia pequeña (<50.000 seguidores) y primer o segundo programa; luego productor multiproducto. Agencias son canal, no cliente del MVP | Mercado doc; **hipótesis** |
| S2 | El alumno final entra por celular (78% de compras en Hotmart LatAm), edad 40–59, estudios superiores | Mercado doc (fuente parte interesada) |
| S3 | Cada experto tiene **una sola academia** y un solo dueño (sin equipo) | `auth_tenant_id()` ya lo asume |
| S4 | Contenido = **video por enlace (YouTube/Vimeo) + texto**; el creador aloja el video. Sin archivos, sin PDF, sin hosting de video propio | Decisión Samuel |
| S5 | Registro de creador solo con Google | Decisión Samuel |
| S6 | Acceso abierto: nadie entra "por invitación" | Decisión Samuel |
| S7 | Un país/moneda por academia en el MVP (CLP primero por foco de Samuel/equipo; AR/MX/CO después) | **Supuesto mío; confirmar** |
| S8 | Se arranca con design partners con acompañamiento humano (concierge) para lo caro de automatizar: dominio propio, conexión de pago, soporte | Revisión de flujos: entrada "design partner" aprobada |
| S9 | Modelo de ingresos de Avantia aún indefinido (cuota fija vs. comisión) | **Abierto**, condiciona el diseño de pagos |
| S10 | Equipo: Samuel (producto), un dev, un aprendiz; CEO y CPO apoyan en entrevistas. Capacidad total ≈ 1,4 dev equivalentes | Contexto del encargo |

### 1.3 No-objetivos del MVP

Competir en funciones con Kajabi/Hotmart; vender fuera de LatAm; contenido corporativo/compliance; marketplace de Avantia; multi-academia por creador; app nativa; que el creador gestione un equipo.

---

## 2. Catálogo de capacidades y clasificación MoSCoW

Criterio de corte: **AHORA** solo si (a) está en una decisión ya tomada por Samuel, o (b) sin eso no se puede probar la hipótesis (1) o (2) del objetivo, o (c) es un riesgo legal/seguridad que no se puede posponer. Todo lo demás es DESPUÉS (con disparador explícito) o NO (con razón). Los números RQ-xx se detallan en la sección 3.

| Capacidad | MVP AHORA | DESPUÉS (disparador) | NO (por qué) |
|---|---|---|---|
| **Cuenta del creador** | Google OAuth (RQ-01). Sin MFA propio: Google ya valida el correo | Usuario+contraseña (si un partner sin cuenta Google lo exige); equipo/ayudantes con roles | Multi-academia por creador (rompe `auth_tenant_id()`, sin demanda conocida) |
| **Cuenta del alumno** | Registro/ingreso por academia (RQ-05) | Perfil, foto, datos extra | Dashboard de alumno multi-academia (cada academia es una marca aparte) |
| **Autoría de contenido** | Lección = video (enlace) + texto Markdown simple (RQ-11) | Editor rico (Tiptap); duplicar lección/curso; borradores por lección; adjuntos/PDF (tachado por Samuel) | Subida y hosting de video propio; editor de diapositivas; grabación en plataforma |
| **IA para crear cursos** | — (el stub existe pero se difiere; ver 5.2 decisión discutible) | Primero: "IA propone temario a partir de descripción/transcripción" (L→M si se limita a títulos); luego tutor/asistente al alumno | Generación automática de contenido completo sin revisión |
| **Estructura de curso** | Curso → lecciones ordenadas con "sección" opcional (RQ-09, RQ-10) | Módulos reales anidados; prerrequisitos; múltiples cursos por ruta/programa; bundles | Rutas de aprendizaje adaptativas |
| **Evaluación / quiz** | Quiz de término, opción múltiple, intentos ilimitados, feedback (RQ-17) | Quiz por lección; banco de preguntas aleatorio; repaso espaciado por correo; preguntas abiertas; tareas con revisión del creador | Proctoring; examen cronometrado con anticopia |
| **Progreso** | Lección completada (auto en video + manual), "continuar donde quedaste", curso completado (RQ-16, RQ-18) | Tiempo de visionado; rachas; hitos | Gamificación pesada (puntos, insignias, ranking): sin evidencia como palanca de retención |
| **Cohortes / calendario** | Un curso con modo "cohorte": fecha de inicio + liberación programada por día (RQ-22) | Varias ediciones del mismo curso; cohortes con cupo y lista de espera; clases en vivo con calendario; recordatorios de sesión | Zoom/Meet integrado; reservas 1:1 |
| **Comunidad** | Contacto directo con el creador (enlace WhatsApp/correo) (RQ-25) | Comentarios/preguntas por lección con respuesta del creador (primer candidato) | Foros generales, chat, grupos privados, feed tipo Skool (la evidencia indica que las visitas al foro decaen tras la semana 1; costo de moderación alto) |
| **Certificados** | — | Constancia web imprimible al aprobar quiz (candidato a subir si las entrevistas lo piden; S) | Certificados verificables con terceros / insignias abiertas |
| **Pagos / checkout / cobro local** | Pago único con Mercado Pago, un país por academia, inscripción solo tras webhook confirmado (RQ-19, RQ-20, RQ-21) | Conexión OAuth autoservicio de MP; Flow/Webpay (Chile); cuotas explícitas; cupones; reembolso desde UI; split/comisión; PayPal | Suscripciones/membresías recurrentes; multimoneda por curso; afiliados; order bumps/upsells; boleta electrónica integrada (ver pregunta Q8) |
| **Marca y dominio** | Subdominio `*.avantia.app`, iniciales + color con ajuste de contraste (RQ-07); dominio propio **operado a mano por el equipo** para los partners que lo exijan (RQ-30) | Dominio propio autoservicio con verificación DNS y SSL automáticos (Vercel Domains API); logo y favicon subidos; correos desde dominio propio | Temas y CSS personalizado; constructor de páginas |
| **Páginas de venta** | Ficha del curso con descripción, temario, precio, bio del creador (RQ-13) | Testimonios, FAQ, video de venta, constructor de landing por curso | A/B de páginas de venta (competimos en retención, no en ventas) |
| **Analítica** | Registro de eventos desde el día 1 (RQ-26); dashboard CR-11: inscritos, avance, embudo por lección, resultados de quiz, ventas, exportación CSV (RQ-27) | Cohortes de retención comparadas; A/B por tenant; integración Meta Pixel/GA por academia | BI propio con constructor de reportes |
| **Notificaciones / email** | SMTP propio para correos de auth (RQ-23); un correo recurrente: "se liberó tu lección" con norma social (RQ-23) | Recordatorios por inactividad; repaso espaciado; correos masivos del creador; WhatsApp | Editor de campañas/automatizaciones de marketing; push nativo |
| **Soporte** | Soporte humano de Avantia a creadores (canal directo, concierge) (RQ-30) | Centro de ayuda con guías (incluye guía de dominio por proveedor); impersonación para soporte | Chat en vivo, tickets, SLA contractual |
| **Admin multi-tenant (Avantia)** | Rol staff y panel interno protegido: lista de academias, cursos, estado (RQ-06) | Métricas por tenant para Avantia; suspensión de cuentas; facturación a creadores | Panel de agencias multi-marca (hasta validar el canal agencias) |
| **Importación / exportación** | Exportar alumnos y progreso a CSV (RQ-27): la propiedad de los datos es parte de la tesis | Importar alumnos desde Hotmart/Teachable (reduce costo de cambio); exportar contenido del curso; borrado de datos desde UI | Migración automática de plataformas ajenas |
| **Accesibilidad** | WCAG 2.1 AA en lo que construimos (sección 4) | Subtítulos obligatorios/aviso; auditoría externa | Cumplimiento certificado (VPAT) |
| **SCORM / xAPI** | — | — | NO: es demanda corporativa; no aparece en el segmento. Sabionet ya lo ofrece; no es nuestro hueco |
| **API pública / webhooks** | — | Webhooks salientes (alta de alumno, compra) para Zapier/CRM | API pública documentada, SDK |
| **App móvil** | Web responsive mobile-first (sección 4) | PWA instalable | App nativa o app de marca (cara de mantener; el segmento no la pide hasta ahora) |
| **SEO / marketing** | Páginas públicas renderizadas en servidor (ya existe) | Sitemap, metadatos OG por curso | Blog/CMS dentro de la academia |
| **Legal / privacidad** | Términos, política de privacidad, consentimiento del alumno, borrado por solicitud (RQ-29) | DPA firmable, portabilidad en UI, registro de tratamientos | — |
| **Landing de Avantia** | CTA a Google, solicitud de design partner guardada, testimonios solo si son reales (RQ-28) | Precios públicos, casos de éxito, SEO de contenido | — |

---

## 3. Requerimientos MVP-AHORA

Para cada ítem: **Req.** (qué), **CA** (criterio de aceptación), **Flujo**, **Estado** (existe / parcial / falta, contra el código actual), **Esf.**, **Dep.**, **Por qué AHORA**.

### 3.1 Bloque A — Fundaciones: cuenta, tenant, aislamiento

**RQ-01 Auth del creador con Google** — Esf. M
- Req.: Supabase Auth con proveedor Google; sesión por cookies (SSR) en `app.avantia.app`; logout; reemplaza `DEMO_TENANT_SLUG` en todo el panel.
- CA: un usuario nuevo entra con Google y llega a "Nombra tu academia"; uno con academia llega a su panel; sin sesión, cualquier ruta del panel redirige al login; ninguna página usa `DEMO_TENANT_SLUG`.
- Flujo: CR-01, CR-02. Estado: **falta** (existen los clientes SSR de Supabase, no hay login). Dep.: proyecto Google Cloud (pantalla de consentimiento verificada), URLs de callback por entorno.
- Por qué AHORA: nada funciona sin esto. Sobre CR-02 ("MFA y validar correo"): con Google el correo ya viene verificado y el MFA lo aplica la cuenta Google; **construir MFA propio es trabajo sin valor en el MVP** (ver Q3).

**RQ-02 Alta de academia (tenant) transaccional** — Esf. M
- Req.: formulario de nombre; deriva slug/subdominio; comprueba unicidad y lista de subdominios reservados (`app`, `www`, `api`, `admin`, `staging`, `mail`, etc.); crea `tenant` + `membresia` (rol dueño) + tema base en una sola transacción (función SQL/RPC); sesión real, no body.
- CA: el nombre "Academia de Juan" genera `academia-de-juan.avantia.app`; dos altas simultáneas del mismo nombre no producen dos tenants; si el subdominio está tomado, se muestra "elige otro" (sin sugerencias; ver Q5); un usuario que ya es dueño no puede crear otra academia.
- Flujo: CR-03. Estado: **parcial** (`POST /api/tenants` existe pero sin sesión, sin membresía, con service role y sin transacción). Dep.: RQ-01.
- Por qué AHORA: es el primer paso del valor.

**RQ-03 Ruteo por host y 404 neutro** — Esf. S
- Req.: middleware decide marketing / panel / academia por host; corregir la comparación del panel (hoy `endsWith("app.avantia.app")` captura `myapp.avantia.app`); 404 con marca Avantia cuando el host no es un tenant; host `localhost` documentado para pruebas con dominios de prueba.
- CA: tests (aunque sean de función pura) para `avantia.app`, `app.avantia.app`, `myapp.avantia.app`, dominio propio, host desconocido; un tenant llamado "myapp" funciona.
- Flujo: N-01, CR-03. Estado: **parcial**. Dep.: ninguna.
- Por qué AHORA: es "la pieza crítica" según Samuel y tiene un bug real.

**RQ-04 Aislamiento por tenant: RLS completo + pruebas** — Esf. M (transversal, se paga en cada tabla)
- Req.: toda tabla nueva lleva `tenant_id` + RLS con políticas select/insert/update/delete; las lecturas de contenido de pago usan el cliente con sesión (RLS), **no** `supabaseAdmin`; `supabaseAdmin` restringido a webhooks, resolución de tenant y jobs; `tenant_id` siempre se deriva de sesión/host, nunca del body; migraciones versionadas en `db/migrations` (hoy vacía) en lugar de editar `schema.sql` a mano.
- CA: suite de pruebas SQL/integración con dos tenants: el creador A no lee ni escribe cursos, alumnos, progreso ni quiz de B; el alumno de A no lee lecciones de un curso al que no está inscrito; regla de lint o grep en CI que falla si `admin.ts` se importa fuera de lista blanca.
- Flujo: todos (N-03). Estado: **parcial** (solo `cursos` tiene RLS y solo `select`; la página pública del curso lee con `supabaseAdmin`, así que RLS no la protege). Dep.: RQ-01.
- Por qué AHORA: es la promesa de producto y el riesgo reputacional #1 si falla con el primer partner.

**RQ-05 Cuenta del alumno por academia** — Esf. M
- Req.: registro/ingreso desde `curso/[slug]` y `/login` de la academia; tras autenticar vuelve a la inscripción que lo trajo; sesión aislada por host (cookies por dominio); un mismo correo puede ser alumno de dos academias sin que una vea a la otra. Método de ingreso: ver Q1 y Q2.
- CA: mismo correo en academia A y B → dos registros de alumno distintos para el creador de cada una; el creador de A no ve que existe en B; cerrar sesión en A no cierra B; reset de acceso llega con la marca de la academia.
- Flujo: AL-03, N-03. Estado: **falta**. Dep.: RQ-04, RQ-23 (correo), decisión Q1.
- Por qué AHORA: es decisión explícita de Samuel ("por tenant") y el núcleo de la tesis white-label. **Ojo técnico:** Supabase Auth tiene un único `auth.users` por proyecto. Ver 4.1 para las dos opciones.

**RQ-06 Rol staff de Avantia y panel interno protegido** — Esf. S
- Req.: la lista global de academias solo la ve un usuario con rol `staff` (tabla o claim); el resto del panel es por tenant.
- CA: un dueño de academia que abre `/` ve solo su academia; sin sesión, 401/redirect; consultas con service role solo tras verificar rol staff.
- Flujo: soporte/admin multi-tenant. Estado: **falta y es un agujero hoy** (`app/(dashboard)/page.tsx` lista todos los tenants con service role sin auth). Dep.: RQ-01.
- Por qué AHORA: seguridad; ya está listado como pendiente en `Supuestos_y_Pendientes.md`.

**RQ-07 Identidad visual mínima** — Esf. S
- Req.: iniciales de la academia como logo, color primario elegido; cálculo automático de contraste y "ajuste sugerido" aprobado; tema aplicado en las 4 vistas (landing, login, inicio, contenido).
- CA: un color con contraste < 4.5:1 con texto sobre el botón dispara el ajuste sugerido; el sitio de la academia nunca muestra texto ilegible.
- Flujo: CR-04, CR-05. Estado: **parcial** (`color_primario`, `TenantLogo` y theming en layout existen; falta UI en `configuracion/marca`, que es un stub, y el ajuste de contraste). Dep.: RQ-02.
- Por qué AHORA: decisión aprobada, barato y alimenta la sensación de "mi marca" en el primer minuto.

### 3.2 Bloque B — Creación

**RQ-08 Panel del creador con checklist de inicio** — Esf. S
- Req.: inicio del panel con 4 pasos derivados del estado (marca lista, primer curso, primera lección, publicado) y enlace a "ver mi academia".
- CA: el checklist se completa solo al cumplir cada condición; no hay decisión "¿academia ya publicada?" (eliminada por Samuel).
- Flujo: CR-06. Estado: **falta**. Dep.: RQ-02.
- Por qué AHORA: es lo que evita el "dashboard vacío" y guía a un creador no técnico.

**RQ-09 Curso: datos, modalidad y estado** — Esf. S
- Req.: título, descripción, precio (0 = gratis), moneda (heredada del tenant), modalidad (`autoguiado` | `cohorte`), fecha de inicio (solo cohorte), estado (`borrador` | `publicado`), mensaje de bienvenida (RQ-25), contacto del creador. Esquema: añadir columnas a `cursos`.
- CA: un curso nace en borrador; no aparece en la academia hasta publicarlo; cambiar el precio no altera inscripciones previas.
- Flujo: CU-01, CU-05 (acceso abierto: gratis o de pago, **sin rama por invitación**). Estado: **parcial** (tabla con título, descripción, precio; sin estado ni modalidad; las páginas `cursos/nuevo` y `cursos/[cursoId]` son stubs). Dep.: RQ-04.
- Por qué AHORA: el doc anterior proponía "todo está publicado", pero CR-10 y CU-07 (editar publicado) ya están aprobados; el costo del estado es mínimo.

**RQ-10 Editor de temario** — Esf. M
- Req.: tabla `lecciones` (`curso_id`, `tenant_id`, `titulo`, `seccion` texto opcional, `orden`, tipo = video+texto, `dia_liberacion` opcional); crear, renombrar, reordenar con botones subir/bajar (sin arrastrar y soltar), eliminar con confirmación.
- CA: el orden se conserva y se refleja igual en el panel, la ficha y el player; borrar una lección con progreso de alumnos pide confirmación y no rompe el avance de los demás.
- Flujo: CU-02. Estado: **falta**. Dep.: RQ-09.
- Recorte: **sin tabla de módulos**; la "sección" es un texto que agrupa lecciones. Si luego hacen falta módulos reales, se migra.

**RQ-11 Lección de video + texto** — Esf. M
- Req.: pegar enlace de YouTube o Vimeo → se valida y convierte a embed (lista blanca de hosts, CSP `frame-src`); texto en Markdown simple con vista previa, sanitizado; indicador de duración si el proveedor la entrega y **aviso suave "videos de más de ~9 min retienen peor"** (guía de lecciones cortas); sin archivos adjuntos.
- CA: enlaces `youtu.be`, `youtube.com/watch`, `vimeo.com/<id>` funcionan; cualquier otro host se rechaza con mensaje claro; un `<script>` en el texto no se ejecuta; el embed usa "facade" (miniatura + clic) para no cargar el iframe antes del clic.
- Flujo: CU-03. Estado: **falta** (`aprender/...` es un stub). Dep.: RQ-10.
- Riesgo declarado: el contenido de pago queda tan protegido como el enlace (un "no listado" de YouTube se comparte). Es un costo asumido de la decisión de Samuel; ver Q9 y la hipótesis H-4.

**RQ-12 Publicar, vista previa y editar publicado** — Esf. S
- Req.: botón Publicar con verificación mínima (≥1 lección con contenido, precio válido); "Ver como alumno" abre el sitio real de la academia con el curso en borrador visible solo para el dueño; editar un curso publicado guarda cambios sin despublicar.
- CA: un alumno nunca ve un borrador; el dueño ve las 4 vistas (landing, login, cursos/inicio, contenido) con su tema; un cambio de texto en una lección publicada se ve de inmediato.
- Flujo: CR-05, CR-10, CU-06, CU-07. Estado: **falta**. Dep.: RQ-09, RQ-11.
- Recorte: no se construye un "modo preview" separado; se reutilizan las páginas reales con permiso de dueño.

### 3.3 Bloque C — Experiencia del alumno

**RQ-13 Inicio de la academia y ficha del curso** — Esf. S
- Req.: inicio (`[domain]/page.tsx`) lista cursos publicados (si solo hay uno, lo destaca); ficha con título, descripción, temario (títulos de lecciones y secciones), precio en la moneda del tenant, bio y foto/iniciales del creador, botón Inscribirme.
- CA: se ve y se lee bien a 360 px de ancho; el precio no está fijo en ARS; sin lecciones publicadas no hay botón de inscripción.
- Flujo: AL-01 (marcado "revisar"/tachado por Samuel: aquí solo un listado mínimo), AL-02. Estado: **parcial** (ficha existe sin temario ni CTA; inicio es stub). Dep.: RQ-09, RQ-10.

**RQ-14 Inscripción gratuita** — Esf. S
- Req.: tabla `inscripciones` (`alumno_id`, `curso_id`, `tenant_id`, `estado` con `activa|cancelada`, `fecha_inicio_alumno`, `created_at`) con RLS (alumno ve solo las suyas, creador las de su tenant); curso con precio 0 → inscripción inmediata y redirección a la primera lección disponible.
- CA: doble clic no crea dos inscripciones (unique `alumno_id, curso_id`); sin sesión, el botón lleva al login y vuelve al curso.
- Flujo: AL-02 → AL-03 → AL-04. Estado: **falta**. Dep.: RQ-05.

**RQ-15 Player de lección con control de acceso** — Esf. M
- Req.: `aprender/[cursoId]/[leccionId]` renderiza video + texto, navegación anterior/siguiente, lista lateral/colapsable de lecciones con estado (hecha, disponible, bloqueada hasta fecha); acceso solo con inscripción activa **y** lección liberada, validado en servidor/RLS.
- CA: URL directa a una lección sin inscripción → redirige a la ficha; lección aún no liberada → muestra fecha de liberación y no entrega contenido; funciona con pulgar en celular (botones ≥44 px).
- Flujo: AL-04. Estado: **falta** (stub). Dep.: RQ-11, RQ-14.

**RQ-16 Progreso** — Esf. M
- Req.: tabla `progreso` (`alumno_id`, `leccion_id`, `tenant_id`, `completada_at`, `ultimo_acceso_at`); completada automática al terminar el video (API de YouTube/Vimeo, umbral configurable ~90%) **y** botón manual "Marcar completada" como respaldo; "Continuar donde quedaste".
- CA: terminar el video marca la lección; si la API falla, el botón sigue disponible; el avance del alumno es idéntico entre celular y computador.
- Flujo: AL-05 ("marcar completada, automático video"). Estado: **falta**. Dep.: RQ-15.

**RQ-17 Quiz de término** — Esf. M
- Req. (creador): un quiz opcional por curso, preguntas de opción múltiple (una respuesta correcta), explicación por pregunta, nota mínima de aprobación (default propuesto 70%; ver Q6). Tablas `quizzes`, `preguntas`, `opciones`, `intentos` (cada pregunta con `leccion_id` opcional, para habilitar el repaso espaciado futuro).
- Req. (alumno): disponible al completar todas las lecciones liberadas; **intentos ilimitados**, retroalimentación inmediata por pregunta con explicación; resultado guardado por intento.
- CA: el alumno no ve las respuestas correctas antes de enviar el intento (no se envían al cliente); reprobar no bloquea ni expulsa, ofrece repasar la lección vinculada; el creador ve el puntaje por alumno.
- Flujo: nuevo (entre "Completado" y AL-07). Estado: **falta**. Dep.: RQ-16.
- Por qué AHORA: decisión de Samuel y práctica de recuperación es palanca #2 de retención. Se entrega **la versión mínima** (ver sección 5).

**RQ-18 Curso completado** — Esf. S
- Req.: un curso se marca completado cuando todas las lecciones están hechas **y** (si existe quiz) el quiz está aprobado; pantalla final con mensaje del creador y, opcionalmente, qué sigue (otro curso de la academia).
- CA: el estado `completado` aparece en el dashboard del creador con fecha.
- Flujo: AL-07. Estado: **falta**. Dep.: RQ-16, RQ-17.
- Decisión pendiente: ¿el quiz es obligatorio para marcar completado? (Q6).

### 3.4 Bloque D — Dinero

**RQ-19 Cobro con Mercado Pago (pago único)** — Esf. L
- Req.: Checkout Pro de Mercado Pago creando una preferencia con el token del creador y moneda/país del tenant; el webhook valida la notificación **consultando el pago en la API** (y la firma `x-signature` si está disponible), es idempotente y **recién ahí** crea la inscripción; página de "pago pendiente / aprobado / rechazado" con reintento.
- CA: un pago aprobado crea exactamente una inscripción aunque llegue 3 veces el webhook; un pago rechazado o pendiente no da acceso; si el webhook tarda, el alumno ve "estamos confirmando tu pago" y accede al aprobarse; el alumno nunca recibe `access_token`.
- Flujo: AL-02 → pago → AL-04. Estado: **falta** (`lib/mercadopago.ts` instancia el cliente; el webhook devuelve `{received:true}`; `checkout/page.tsx` es un stub; los docs mencionan un webhook de Stripe que **no existe** en el código). Dep.: RQ-14, RQ-20, RQ-21.
- Por qué AHORA (pero en H3): "cobro local" es una de las dos razones de existir frente a Hotmart. Plan B documentado: cobro fuera de plataforma + inscripción asistida (el creador marca "pagó" en una lista) para los primeros partners. Esta alternativa NO es "invitación": el curso sigue siendo abierto a inscribirse, pero la activación es manual.

**RQ-20 Conexión de la cuenta Mercado Pago del creador** — Esf. S (concierge) → L (OAuth, DESPUÉS)
- Req. MVP: el equipo Avantia carga a mano las credenciales de MP del creador en un campo cifrado (Supabase Vault o cifrado de aplicación), con un indicador "cobro activo" en el panel; el creador no ve ni edita el token.
- CA: credenciales nunca en logs ni en el cliente; si faltan, el curso de pago no se puede publicar.
- Estado: **falta**; es "lo más grande que falta" según `Avantia_Flujos_MVP.md` si se hace OAuth completo. Dep.: Q7 (modelo de ingresos), cuenta MP de los partners.
- Recorte: sin OAuth ni split de comisión en el MVP. Si Avantia cobra cuota fija, el split no hace falta todavía.

**RQ-21 País y moneda por academia** — Esf. S
- Req.: campos `pais` y `moneda` en `tenants`, elegidos al crear (CLP por defecto); formato de precio con `Intl.NumberFormat` según moneda; el código actual fija `es-AR`/ARS en la ficha.
- CA: un curso de $29.990 CLP se muestra "$29.990" sin decimales; un tenant AR muestra ARS.
- Estado: **parcial** (formateo existe, fijo a ARS). Dep.: RQ-02.

### 3.5 Bloque E — Retención y datos

**RQ-22 Liberación programada (cohorte mínima)** — Esf. M
- Req.: si el curso es `cohorte`: tiene `fecha_inicio`; cada lección tiene `dia_liberacion` (0 = desde el inicio, 7 = una semana después). Una lección está liberada si `hoy >= fecha_inicio + dia_liberacion`. El alumno que se inscribe después de la fecha de inicio ve todo lo ya liberado. Zona horaria del tenant.
- CA: lección no liberada no se puede abrir ni siquiera por URL (validación en servidor); la fecha de liberación se muestra en el temario; sin cohorte, comportamiento autoguiado (todo disponible).
- Flujo: nuevo (afecta CU-01, CU-03, AL-04). Estado: **falta**. Dep.: RQ-10, RQ-15.
- Por qué AHORA: es la palanca #1 del Pareto (45% vs 13%) aunque el estudio es cuasi-experimental y el efecto viene sobre todo del inicio sincronizado; por eso se hace la versión simple (una sola edición por curso) y no un sistema de cohortes.

**RQ-23 Correo: SMTP propio y un correo recurrente** — Esf. M
- Req.: (a) SMTP propio (Resend, Postmark o SES) conectado a Supabase Auth: el SMTP por defecto de Supabase tiene un límite muy bajo y no sirve ni para el primer lanzamiento; remitente "<Academia> vía Avantia"; (b) un solo correo programado (cron de Vercel o pg_cron): "Se liberó la lección X de <curso>" con una línea de norma social ("el N% de tu grupo ya completó la lección anterior"), enlace directo y baja de suscripción.
- CA: correos de acceso llegan a Gmail/Outlook sin ir a spam (SPF/DKIM configurados); un alumno puede darse de baja con un clic; el correo solo sale a alumnos inscritos, nunca cruza tenants.
- Flujo: AL-03, retención. Estado: **falta**. Dep.: RQ-22, RQ-24, dominio de envío.
- Corte: es lo primero que se cae del H2 si hay retraso (el creador puede usar la lista de alumnos exportada para avisar por WhatsApp).

**RQ-24 Norma social en la interfaz** — Esf. S
- Req.: en la lección y en el temario: "El N% de tus compañeros ya completó esta lección", solo si el grupo tiene ≥ 10 alumnos activos (umbral editable por plataforma); redacción en positivo, no mostrar cifras bajas.
- CA: con menos de 10 alumnos no se muestra nada; no revela datos de otro tenant ni identidades.
- Estado: **falta**. Dep.: RQ-16.

**RQ-25 Presencia del creador (versión barata)** — Esf. S
- Req.: mensaje de bienvenida del creador al abrir el curso (texto + enlace opcional a un video corto personal); botón "Escribirle al creador" que abre WhatsApp o correo configurado por curso.
- CA: el creador configura ambos en el formulario del curso; si no configura canal, el botón no aparece.
- Estado: **falta**. Dep.: RQ-09.
- Por qué AHORA: hacer preguntas y sentirse acompañado es la forma más barata de presencia; los comentarios por lección (que implican moderación, notificaciones y respuesta) se difieren.

**RQ-26 Registro de eventos de producto** — Esf. S
- Req.: tabla `eventos` (tenant, alumno, tipo, entidad, timestamp) para: inscripción, lección abierta, lección completada, intento de quiz, curso completado, correo abierto/clic (si el proveedor lo da).
- CA: cada evento lleva `tenant_id`; no guarda IP ni datos innecesarios.
- Estado: **falta**. Dep.: RQ-16.
- Por qué AHORA: instrumentar tarde es imposible de recuperar; es el cimiento del dashboard y de un futuro A/B por tenant.

**RQ-27 Dashboard del creador (CR-11) y exportación** — Esf. M
- Req.: (1) KPIs: inscritos, activos en los últimos 7 días, % de finalización, ingresos del período; (2) **embudo por lección** (cuántos llegaron, cuántos completaron) para ver dónde abandonan; (3) lista de alumnos con avance, último acceso y puntaje del quiz; (4) exportación CSV de alumnos+progreso; (5) vista de ventas con estados de pago.
- CA: números coinciden con los datos fuente en una prueba de verificación con dataset sembrado; con 0 alumnos muestra estado vacío con el siguiente paso; el CSV se abre bien en Excel con tildes (UTF-8 con BOM).
- Flujo: CR-11 (prioridad marcada con asterisco por Samuel), `estudiantes/page.tsx`. Estado: **falta** (stub vacío). Dep.: RQ-16, RQ-17, RQ-26.
- Por qué AHORA: es el entregable que convierte "retención" de promesa en producto visible.

### 3.6 Bloque F — Go-to-market, legal y operación

**RQ-28 Landing de Avantia conectada** — Esf. S
- Req.: la landing de marketing (ya existe, `components/marketing/*`) pasa de prototipo a funcional: botón "Entrar con Google" (RQ-01) y formulario de solicitud de design partner que **guarda** en `solicitudes` (hoy dice "el registro todavía no se guarda"); testimonios: solo reales o ninguno.
- CA: una solicitud llega a base y avisa al equipo; la página mantiene la explicación de qué hace/cómo (decisión de Samuel).
- Estado: **parcial** (landing completa y accesible, formulario sin persistencia). Dep.: RQ-01. Pregunta Q4: ¿registro abierto o por aplicación?

**RQ-29 Legal y privacidad mínimos** — Esf. S (más tiempo de revisión legal)
- Req.: Términos de uso y Política de privacidad de Avantia; casilla de consentimiento al registrarse (alumno y creador); texto estándar de tratamiento de datos entre Avantia (encargado) y el creador (responsable); procedimiento de borrado/exportación de datos de un alumno **por solicitud** atendido por el equipo (no UI).
- CA: no se puede crear cuenta sin aceptar; existe un correo de contacto de privacidad; los documentos están enlazados en pie de página de landing y de cada academia.
- Estado: **falta**. Dep.: abogado/plantilla. Ver 4.4.

**RQ-30 Dominio propio y soporte "concierge"** — Esf. S
- Req.: para los partners que exijan dominio propio, el equipo lo agrega en Vercel y llena `tenants.custom_domain` a mano (el middleware ya ruta cualquier host no reconocido a tenant). Soporte: canal directo con los partners (WhatsApp/correo) y guía corta de DNS por proveedor (NIC Chile, GoDaddy, Spaceship, Wix, WordPress) en un documento, sin pantalla de verificación automática.
- CA: un dominio propio de prueba sirve la academia con HTTPS en < 1 día hábil desde que el partner cambia el DNS.
- Estado: **parcial** (campo, ruta de API y formulario existen, pero con registros DNS y estado simulados; hay que **quitar o esconder el mock** para no prometer lo que no hace). Dep.: RQ-03.
- Por qué AHORA así: responde Q-dominio de la revisión con el menor costo; la automatización (L: Domains API, polling de verificación, SSL, mensajes de error por proveedor) espera a tener tracción.

**RQ-31 Operación mínima** — Esf. S
- Req.: entornos dev/prod, migraciones aplicadas por CI, backups automáticos de Supabase activados, Sentry (o equivalente) para errores, script de seed con dos tenants para pruebas de aislamiento, CI con lint + typecheck + pruebas de RLS.
- CA: un deploy a producción no puede romper el aislamiento sin que CI falle.
- Estado: **parcial** (hay `.github/workflows/pr-review.yml` previsto en docs; no hay tests). Dep.: RQ-04.

### 3.7 Orden, hitos y línea de corte

| Hito | Contenido | Días-persona | Resultado demostrable |
|---|---|---|---|
| **H1** Academia en vivo (gratis) | RQ-01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 18*, 26, 31 (*curso completado sin quiz) | ≈ 46 | Un partner crea su academia, publica un curso gratuito y su audiencia lo cursa desde el celular, con aislamiento probado |
| **H2** Retención medible | RQ-17, 22, 24, 25, 27 y (si hay tiempo) 23 | ≈ 22 | Cohorte con liberación programada, quiz, panel con embudo y exportación |
| **H3** Cobro y salida | RQ-19, 20, 21, 28, 29, 30 | ≈ 15 | Venta real en moneda local; landing y legales listos para abrir a más partners |

Total ≈ 83 días-persona. **Si hay que cortar**, se cae en este orden: RQ-23 (correo recurrente), RQ-24, RQ-12 parte "ver como alumno" para usar el sitio real sin guardas, RQ-19 → cobro externo con inscripción asistida. **No se corta**: RQ-04 (aislamiento), RQ-06 (panel staff), RQ-29 (legal), RQ-26 (eventos).

---

## 4. Requerimientos no funcionales

### 4.1 Multi-tenant, aislamiento y datos

| ID | Requerimiento | Criterio de aceptación |
|---|---|---|
| NF-01 | Todo dato de negocio lleva `tenant_id` y RLS en las cuatro operaciones | Prueba automática con 2 tenants en CI; falla el build si una tabla nueva no tiene política |
| NF-02 | `tenant_id` se deriva de host o sesión, nunca del body o de query string | Revisión del código: `generar-curso` hoy recibe `tenantId` en el body (hay que corregirlo si se mantiene) |
| NF-03 | Service role solo en webhooks, resolución de tenant y jobs | Lista blanca en lint; las lecturas de contenido de pago usan cliente con sesión |
| NF-04 | Sesión aislada por host; mismo correo en dos academias sin cruce | Prueba manual y automatizada de login cruzado |
| NF-05 | Subdominios reservados y validados (`[a-z0-9-]`, 3–40, sin guiones al borde) | Pruebas de unidad |
| NF-06 | Resolución de tenant con caché de 60 s ya existe; un cambio de dominio debe verse en ≤ 60 s | Documentado; revisar si molesta en soporte |

**Decisión técnica clave (Q1): "credenciales por academia" frente a Supabase Auth.** Supabase Auth tiene un solo `auth.users` por proyecto. Opciones:
- **Opción A (recomendada para el MVP):** una identidad global por correo, con tabla `alumnos(tenant_id, user_id)` y RLS. El aislamiento de **datos y sesión** es total (cookies por dominio, el creador solo ve sus alumnos), pero la **credencial** (la contraseña o la cuenta Google) es compartida entre academias y un tercero podría inferir que un correo está registrado. Costo: bajo. Se sostiene si el método es Google/código por correo.
- **Opción B:** cuentas realmente separadas por academia, codificando el correo de acceso como `tenantId+correo` y guardando el correo real en un perfil. Aislamiento total de credenciales, pero rompe los correos de Supabase (hay que mandar todo por SMTP propio con plantillas propias) y complica cualquier migración. Costo: M–L adicional.

Si lo que Samuel quiere es "el alumno de A no ve nada de B ni sus credenciales se mezclan en el panel del creador", la A basta. Hay que confirmarlo (Q1).

### 4.2 Rendimiento y móvil

| ID | Requerimiento | Criterio |
|---|---|---|
| NF-10 | Mobile-first real: diseño base 360 px, objetivos táctiles ≥ 44 px, sin scroll horizontal | Revisión en dispositivo Android de gama media |
| NF-11 | Páginas públicas de academia: LCP < 2,5 s en 4G simulado; JS inicial < ~170 KB; SSR (ya existe) | Lighthouse móvil en CI o manual por hito |
| NF-12 | Embeds de video con "facade" (se carga el iframe al tocar); no cargar el SDK de YouTube/Vimeo hasta que haga falta | Medición de peso en la lección |
| NF-13 | Modo ahorro de datos: sin autoplay; sin imágenes pesadas sin dimensiones | Revisión |
| NF-14 | Disponibilidad objetivo 99,5% (Vercel + Supabase); degradación elegante si un video falla (se puede marcar completada manualmente) | Sin SLA contractual en el MVP |

### 4.3 Seguridad

| ID | Requerimiento | Criterio |
|---|---|---|
| NF-20 | Texto del creador (Markdown) sanitizado; embeds solo de lista blanca; CSP básica | Prueba con payload XSS: no se ejecuta en el sitio de la academia ni en el panel (XSS en un tenant podría tocar sesiones del mismo origen) |
| NF-21 | Webhook de MP: validar firma y confirmar el pago por API; idempotencia | Prueba de reenvío triple |
| NF-22 | Tokens de MP cifrados en reposo; nunca al cliente ni a logs | Revisión |
| NF-23 | Rate limit en login, registro y endpoints costosos (IA, si se activa) | Prueba de carga básica |
| NF-24 | Protección de acceso: URLs de lección no adivinables no sustituyen la autorización; validar inscripción en cada request | Prueba de acceso directo |
| NF-25 | Registro de auditoría mínimo de acciones sensibles (publicar, cambiar precio, conectar pago, exportar alumnos) | Tabla `auditoria` |
| NF-26 | Contenido de pago embebido de YouTube/Vimeo es compartible por quien tenga el enlace; se avisa al creador y se recomienda "no listado" o Vimeo con restricción de dominio | Texto de ayuda en editor (RQ-11) |

### 4.4 Privacidad y datos personales (Chile / LatAm)

- Avantia actúa como **encargado** del tratamiento; el creador es el **responsable** de los datos de sus alumnos. Esto debe quedar en los términos (RQ-29).
- **Chile:** la Ley 21.719 de protección de datos personales (publicada en diciembre de 2024) entraría en plena vigencia a fines de 2026, es decir, en semanas desde hoy. **Verificar con abogado** fecha exacta, bases de licitud, derechos ARCO+ (acceso, rectificación, supresión, oposición, portabilidad, bloqueo) y obligaciones sobre transferencias internacionales (Supabase y Vercel procesan fuera de Chile).
- Otros mercados prioritarios (por el segmento Hotmart): México (LFPDPPP), Colombia (Ley 1581), Argentina (Ley 25.326), Perú (Ley 29733). Mínimo común: aviso de privacidad, consentimiento, derecho de supresión.
- NF-30: recolectar solo nombre, correo y actividad de aprendizaje; sin documentos de identidad en el MVP.
- NF-31: poder borrar a un alumno (inscripciones, progreso, intentos) y exportar sus datos en < 15 días por solicitud (proceso manual aceptable).
- NF-32: seleccionar región de Supabase y documentarla en la política; evaluar São Paulo para latencia a LatAm.
- NF-33: pagos: Avantia no almacena datos de tarjeta (Checkout Pro redirige a MP). Facturación/boleta del creador queda fuera (Q8).

### 4.5 Accesibilidad

- NF-40: WCAG 2.1 AA en lo construido: contraste ≥ 4.5:1 (el ajuste automático de RQ-07 lo cubre para el color de marca), foco visible, navegación completa con teclado, etiquetas en formularios, `alt` en imágenes, errores asociados a campos. La landing actual ya sigue buenas prácticas (aria-label, foco en error); mantener ese estándar.
- NF-41: el creador es responsable de subtítulos de su video; el editor muestra un aviso pero no obliga.
- NF-42: texto escalable (rem), sin información solo por color (estado de lección con ícono y texto), respeto de `prefers-reduced-motion`.
- NF-43: público 40–59 años: tamaño de letra base ≥ 16 px y lenguaje sin tecnicismos.

### 4.6 Idioma y localización

- NF-50: interfaz en español neutro de LatAm; sin regionalismos en el producto (el trato "vos" aparece en algunos mensajes del código, p. ej. "Corré", "revisá"; decidir tono: sugerido tuteo neutro "tú"/formal para alumnos). Fechas con zona horaria del tenant.

---

## 5. Palancas de retención: qué entra al MVP

Fuente: `Retencion_Evidencia_Inicial.md` (pendiente de verificación). La fuerza de la evidencia es desigual y los tamaños de efecto vienen de contextos distintos (MOOCs, aula universitaria), no de cursos de expertos LatAm. Por eso el MVP **mide** antes de optimizar.

| Palanca | Evidencia (según el doc) | Entra al MVP | Se difiere | Cómo se medirá |
|---|---|---|---|---|
| **1. Cadencia / cohorte con liberación programada** | 45% vs 13% de retención en MOOC, cuasi-experimental; el efecto parece venir del inicio sincronizado | RQ-22: un curso en modo cohorte con fecha de inicio y goteo por día. RQ-23 (correo de liberación) como estirable | Varias ediciones por curso, cupos, lista de espera, clases en vivo, calendario | Finalización de cursos cohorte vs. autoguiados del mismo tenant (si hay tamaño suficiente) |
| **2. Quiz con recuperación espaciada** | g = 0,67 práctica de recuperación; espaciada g = 0,74; efectos variables en cursos reales | RQ-17: quiz de término con feedback e intentos ilimitados; preguntas ligables a una lección (`leccion_id`) | Repaso espaciado por correo (D+3, D+7 con preguntas falladas), quiz por lección, banco aleatorio | % que aprueba al primer intento; % que reintenta; abandono antes/después del quiz |
| **3. Presencia del creador** | Relación fuerte con satisfacción; la presencia no predice persistencia directamente; visitas a foro decaen tras semana 1 | RQ-25: bienvenida del creador (texto + video corto enlazado) y botón de contacto | Comentarios por lección con respuesta del creador; avisos y anuncios; sesiones en vivo | Uso del botón de contacto; satisfacción en una pregunta al final del curso |
| **4. Nudges con normas sociales** | RCT: normas descriptivas (% de pares que completó) mejoran la entrega; recordatorios genéricos pueden ser contraproducentes | RQ-24 (norma en la interfaz con umbral n ≥ 10) y una línea de norma social en el correo RQ-23. **No** se envían recordatorios genéricos de fecha | Segmentación por inactividad; mensajes personalizados; WhatsApp | Tasa de reingreso tras correo; finalización con y sin norma (solo cuando haya volumen) |
| **5. Lecciones cortas (<6–9 min)** | Engagement cae tras ~6 min; dividir videos +10% de visionado | RQ-11: aviso suave en el editor y guía del creador; el embudo por lección (RQ-27) muestra dónde cae el interés | Medición de duración por embed; sugerencia automática de dividir | Abandono por lección vs. duración |
| **6. Analítica + A/B por tenant** | Efectos heterogéneos entre cursos; razón de ser del white-label | RQ-26 (eventos desde el día 1) y RQ-27 (dashboard con embudo, sin A/B) | Experimentos A/B por tenant, comparación entre cohortes | **Advertencia:** con audiencias de <500 alumnos por tenant, un A/B no alcanza potencia estadística; el A/B por tenant solo tiene sentido con volumen o agregando entre tenants. Se difiere hasta tener ≥ 5 tenants con tráfico |
| Motivación al inicio | Motivos académicos = factor principal | Pregunta opcional de 1 clic al inscribirse ("¿para qué haces este curso?") — **estirable**, S, no numerado | Segmentación según motivo | Correlación motivo ↔ finalización |
| Gamificación, adaptatividad (IA) | No probadas como palanca de retención | — | — | Posponer, como indica el doc |

**Crítica honesta:** (1) el MVP incluye 4 de las 5 palancas del Pareto en versión mínima, pero **ninguna está validada para este segmento**; son hipótesis baratas de poner, no promesas. (2) El correo es la "tubería" de dos palancas (cadencia y norma social); si se corta RQ-23, ambas pierden fuerza fuera de la visita espontánea. (3) No se deben vender resultados ("sube tu finalización X%") en la landing hasta tener datos propios.

---

## 6. Preguntas abiertas para decidir con Samuel

Priorizadas: las 1–5 bloquean desarrollo de H1; las 6–10 bloquean H2/H3; el resto puede esperar.

| # | Pregunta | Recomendación del documento |
|---|---|---|
| Q1 | **"Credenciales por tenant":** ¿basta con aislar datos y sesión por academia (opción A, identidad global) o hace falta cuenta totalmente separada por academia (opción B)? | A. B cuesta M–L más y obliga a SMTP propio para todo |
| Q2 | **Método de ingreso del alumno:** ¿Google, correo+contraseña, o código/enlace por correo? ("usuario pass" quedó ambiguo) | Google + código por correo (sin contraseñas ni flujo de recuperación); el público es de 40–59 años y móvil, y evita reset de claves |
| Q3 | **CR-02 "MFA y validar correo":** con Google ya está validado; ¿se descarta el MFA propio? | Descartar en MVP; exigir cuenta Google verificada |
| Q4 | **Entrada:** ¿cualquiera puede crear una academia o solo design partners aprobados (landing con "aplicar")? | Solo aprobados al inicio: se controla soporte y calidad; se guarda la solicitud y se habilita al usuario |
| Q5 | **Subdominio ocupado:** ¿solo "elige otro" o con sugerencias? | Solo "elige otro" (la nota "Etapa 2" lo respalda) |
| Q6 | **Quiz:** ¿obligatorio para marcar completado? ¿nota mínima? ¿solo opción múltiple? ¿se puede reintentar sin límite? | Opcional por curso; si existe, requerido para "completado"; nota mínima configurable por curso, default 70%; solo opción múltiple; intentos ilimitados |
| Q7 | **Modelo de ingresos de Avantia:** ¿cuota fija mensual, comisión por venta, o gratis para design partners? Define si se necesita split/`application_fee` | Gratis para los 3–5 primeros; probar cuota fija en entrevistas (la guía A mide disposición a pagar). Evita construir split antes de saber |
| Q8 | **Facturación:** el creador en Chile debe emitir boleta/factura; ¿Avantia lo resuelve o el creador lo hace afuera? | Afuera en MVP; preguntarlo en entrevistas porque puede ser decisivo |
| Q9 | **Protección del contenido:** ¿se acepta que un video de pago en YouTube/Vimeo sea compartible por enlace? | Aceptar y advertir; verificar en entrevistas cuánto importa |
| Q10 | **País/moneda del primer partner y pasarela:** ¿Chile con Mercado Pago? ¿o Flow/Webpay (más usados en Chile)? ¿multi-país desde el inicio? | Un país por tenant; confirmar cobertura de Mercado Pago (Checkout Pro/OAuth) en Chile y el medio de pago que prefieren los partners (verificar) |
| Q11 | **Dominio propio:** ¿hito de MVP (como dibuja el diagrama) o etapa 2? ¿Concierge manual es aceptable? | Concierge (RQ-30); autoservicio después |
| Q12 | **IA para crear cursos:** el stub y probablemente la landing la prometen. ¿Se difiere? | Diferir; si se quiere un "wow", limitarlo a proponer temario (títulos) a partir de una descripción, M |
| Q13 | **Cohorte:** ¿el creador define una fecha de inicio común (cohorte) o el goteo parte del día en que se inscribe cada alumno (individual)? | Fecha común para cohorte (la evidencia apunta al inicio sincronizado); individual como modo alternativo solo si un partner lo exige |
| Q14 | **Multi-curso:** ¿una academia con un solo curso o varios en el MVP? | Varios, pero optimizar la experiencia de uno (inicio destaca el curso principal) |
| Q15 | **Tono y trato:** "tú", "usted" o "vos" en el producto | Tuteo neutro; confirmar con CEO/CPO |
| Q16 | **Testimonios en landing:** no existen aún; ¿se omiten hasta tener reales? | Omitir; no inventar |
| Q17 | **Compromiso legal:** ¿quién revisa términos y privacidad antes de abrir? Ley 21.719 | Asignar antes de H3 |
| Q18 | **Reembolsos y garantía:** ¿política estándar (p. ej. 7 días) y quién la ejecuta? | Manual por el creador en MP; Avantia no interviene en el MVP |
| Q19 | **Datos de investigación:** ¿se puede usar la analítica agregada de los tenants para mejorar el producto? (consentimiento en términos) | Sí, agregada y anónima, informado en términos |

---

## 7. Hipótesis a validar en las entrevistas

Cada decisión de alcance asume algo. La columna "Pregunta de la guía" refiere a `Mercado_Segmento_Expertos_Entrevistas.md` (Guía A salvo que diga B). La **señal de invalidación** indica qué obligaría a mover el ítem entre columnas.

| ID | Decisión de alcance | Hipótesis que supone | Cómo probarla (preguntas) | Señal de invalidación → cambio |
|---|---|---|---|---|
| H-1 | Solo Google para el creador | Los expertos tienen cuenta Google y no la ven como barrera | Contexto y herramientas (sección 2); observar al registrarse en el prototipo | Más de 1 de cada 4 sin cuenta Google → agregar correo+contraseña |
| H-2 | Solo video + texto, sin PDF/archivos | El material del experto cabe en video y texto; no depende de plantillas, guías o descargables | Sección 2 ("paso a paso de tu último curso"): ¿qué entregaste además del video? | Que la mayoría use PDFs/plantillas como parte central → mover adjuntos a AHORA |
| H-3 | Video por enlace, sin hosting propio | Ya tienen sus videos en YouTube/Vimeo o aceptan subirlos ahí | Sección 2: ¿dónde alojas tus videos hoy? | Piden protección o subida directa → hosting (Bunny/Mux) a DESPUÉS temprano |
| H-4 | Aceptar que el contenido sea compartible por enlace | A los creadores pequeños no les preocupa la fuga de contenido o ya usan Vimeo privado | Sección 5 (riesgo) y 3: ¿has tenido filtraciones? ¿qué haces para protegerlo? | Preocupación recurrente → Vimeo con dominio restringido como requisito o hosting protegido |
| H-5 | Sin acceso por invitación | Venden a audiencia abierta, no a grupos cerrados o privados | Sección 2/6: ¿cómo entra un alumno hoy? ¿pagan o se les invita? | Coaches de ticket alto que invitan a mano → inscripción asistida/privada como DESPUÉS prioritario |
| H-6 | Subdominio en MVP, dominio propio concierge | La marca percibida con `*.avantia.app` basta para empezar | Sección 5 (qué tan importante es dominio propio) | Que más de la mitad lo exija para firmar → automatizar dominio propio antes |
| H-7 | Identidad visual solo con iniciales + color | La marca visual (logo) no es decisiva en el primer mes | Sección 5 | Rechazo explícito → logo y favicon subidos a AHORA (S) |
| H-8 | Cobro único con Mercado Pago, un país por academia | Sus alumnos pagan con medios que MP cubre; no necesitan suscripciones ni multimoneda | Sección 6 (países, cobros) y 7 (gasto) | Pasarela distinta (Flow/Webpay, transferencia) o venta recurrente → cambiar pasarela o priorizar suscripciones |
| H-9 | Sin comisión/split por ahora; cuota fija o gratis | Prefieren pagar una cuota previsible a pagar comisión | Sección 7 (disposición a pagar, "caro" vs "sospechosamente barato") y Guía B (cómo pagan las agencias) | Nadie declara gasto mayor al plan más barato de la competencia → replantear precio (criterio de descarte del doc) |
| H-10 | Mobile-first | Sus alumnos consumen principalmente desde celular | Sección 6 (alumnos y países); revisar analítica de su plataforma actual | Consumo mayoritario en escritorio → relajar prioridad móvil del player |
| H-11 | Cohorte con inicio común y goteo | Los expertos pueden y quieren sostener una cadencia fija | Sección 4 (qué has probado: cohortes, desafíos); módulo coach | Prefieren acceso inmediato o "a tu ritmo" → cohorte opcional y marketing "a tu ritmo" |
| H-12 | Quiz de término | Un quiz agrega valor para el alumno y el creador lo creará | Módulo académico: ¿qué evaluación exigen? Sección 4 | Nadie usa evaluación → dejarlo opcional y de bajo énfasis; priorizar certificados si piden constancia |
| H-13 | Sin comunidad, solo contacto directo | El alumno se conforma con acceso al creador; la comunidad no es requisito de compra | Sección 3: ¿qué haces a mano? (WhatsApp, Zoom); sección 4 | Comunidad aparece como dolor central → comentarios por lección pasan a AHORA |
| H-14 | Dashboard como prioridad (CR-11) | El creador mide hoy poco o nada de avance y abandono, y lo desea | Sección 4: ¿qué % termina? ¿cómo lo mides? | Les basta con ventas/inscritos → recortar embudo por lección |
| H-15 | Exportar CSV como propiedad de datos | Les importa poseer los datos y contacto de alumnos | Sección 5: ¿quién tiene los datos? | Indiferencia → bajar a DESPUÉS |
| H-16 | IA diferida | El tiempo de armar el curso no es el principal freno para publicar | Sección 2: ¿qué fue lo más lento? ¿cuántas horas tomó armar? | La creación del curso es el dolor número uno → IA de temario sube a AHORA |
| H-17 | Certificados diferidos | El experto no los exige como parte de la venta | Módulo académico; sección 2 | Más de la mitad los pide → constancia web simple a AHORA (S) |
| H-18 | Soporte concierge a 3–5 partners | El equipo puede atender manualmente dominios, conexión de pago y dudas | Guía B: tiempos de montaje por cliente | Que el onboarding manual supere ~4 horas por partner → automatizar |
| H-19 | Español LatAm como diferencial + cobro local | Importa más que el precio de entrada cero de Hotmart | Sección 2/7: por qué eligieron su plataforma; qué los haría cambiar | Mayoría conforme con Hotmart y valora costo cero (criterio de descarte del doc) → replantear el posicionamiento |
| H-20 | Las palancas de retención son valoradas por el creador | El creador percibe la finalización como problema propio, no solo la venta | Sección 4 completa; criterio "el dolor principal es conseguir alumnos y no operar el curso" | Si el dolor es captar alumnos, no operarlos → revisar tesis y mover recursos a venta/embudos |

---

## 8. Apéndice

### 8.1 Mapa de trazabilidad (flujos → requerimientos)

| Flujo | Requerimientos |
|---|---|
| CR-01 Crear cuenta | RQ-01, RQ-28 |
| CR-02 Revisa correo | RQ-01 (cubierto por Google; ver Q3) |
| CR-03 Nombra academia | RQ-02, RQ-03 |
| CR-04 Identidad visual | RQ-07 |
| CR-05 Vista previa | RQ-07, RQ-12 |
| CR-06 Panel | RQ-08 |
| CR-07/08/09 Dominio propio | RQ-30 (concierge); autoservicio DESPUÉS |
| CR-10 Publicar | RQ-12 |
| CR-11 Dashboard | RQ-26, RQ-27 |
| CU-01 Datos del curso | RQ-09 |
| CU-02 Temario | RQ-10 |
| CU-03 Nueva lección | RQ-11 |
| CU-05 Acceso al curso | RQ-09, RQ-14, RQ-19 |
| CU-06/07 Vista previa y edición publicada | RQ-12 |
| N-01 Dominio activo | RQ-03 |
| AL-01/02 Catálogo y ficha | RQ-13 |
| AL-03 Cuenta / ingreso | RQ-05 |
| N-03 Credenciales por academia | RQ-04, RQ-05 |
| AL-04/05 Lección y completada | RQ-15, RQ-16 |
| Quiz de término (nuevo) | RQ-17 |
| AL-07 Curso completado | RQ-18 |
| Nuevo (retención) | RQ-22 a RQ-26 |
| Nuevo (cobro) | RQ-19 a RQ-21 |

### 8.2 Riesgos y supuestos a vigilar

1. **Alcance:** 83 días-persona para un equipo de 1,4 devs. Cualquier ítem nuevo debe sacar otro.
2. **Dependencias externas** (Google OAuth, Mercado Pago, SMTP/dominio de envío, DNS del partner): iniciar trámites en la semana 1 aunque se usen en la semana 8.
3. **Un solo desarrollador con conocimiento de RLS** es un punto único de falla: el aprendiz debe escribir pruebas de aislamiento desde RQ-04.
4. **Evidencia de retención no verificada:** no condicionar la arquitectura a que se confirme (los eventos de RQ-26 sirven en cualquier caso).
5. **Sabionet y Hotmart** compiten en cobro local y español: el diferencial a demostrar es retención medida y white-label real, no funciones.
