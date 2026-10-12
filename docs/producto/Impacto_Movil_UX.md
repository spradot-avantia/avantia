# Impacto móvil en UX: MVP mobile-first de Avantia (2026-10-12)

> Decisión: el MVP es **mobile-first**. Dato de partida (a verificar con fuente Hotmart): 78% de las compras en Hotmart LatAm son por celular; compradores de 40-59 años, 60% mujeres. Implicación: pantallas simples, texto legible, objetivos táctiles grandes, red 4G irregular y gama media/baja de dispositivos.
>
> Fuentes internas: `docs/Revision_Flujos_Creador_Alumno_2026-10-12.md`, `docs/producto/Avantia_Flujos_MVP.md`, `docs/producto/Retencion_Evidencia_Inicial.md`, código en `apps/web/src`.
>
> Nota de método: el HTML del viaje de usuario (`avantia-viaje-usuario-mvp.html`) guarda el diagrama en un formato no extraíble como texto. Los códigos de pantalla se tomaron de la Revisión de Flujos. **AL-06 y AL-08 no aparecen descritos allí**; se asumen como AL-06 = quiz de término y AL-08 = estado "mis cursos / volver" (supuesto a confirmar). Los hallazgos de investigación web provienen de blogs y documentación de terceros, no de especificaciones primarias; se marcan los puntos a verificar.

---

## 1. Resumen ejecutivo

1. **Alumno 100% móvil**: todo el recorrido (landing de academia, ficha, registro, checkout, lecciones, quiz, certificado) se diseña primero para 360-412 px de ancho, y escritorio es una adaptación.
2. **Creador: móvil para ver y responder, escritorio para construir.** En móvil: dashboard CR-11, ver alumnos, responder mensajes/dudas, publicar/despublicar, compartir enlace, editar un texto o corregir un enlace de video. En escritorio: onboarding largo (dominio propio, identidad visual), editor de temario, creación de curso con IA, revisión de vista previa multi-vista.
3. **PWA como primer paso** (manifest + service worker mínimo + instalación guiada + push opcional en Android). Nativa queda fuera del MVP.
4. Hoy el código **no tiene meta viewport explícito, ni manifest, ni service worker, ni layout responsive en dashboard ni en páginas públicas del alumno** (salvo la landing de marketing). Hay que construir casi todo el shell móvil.

---

## 2. Investigación: buenas prácticas móviles

### 2.1 Reproductor de lecciones (video + texto, temario, marcar completada)
- Video arriba, fijo al hacer scroll (sticky) a 16:9; texto de la lección debajo; temario en **panel inferior (bottom sheet)** que se abre desde un botón "Lecciones (3/12)". Lógica: el pulgar alcanza la parte baja de la pantalla; las acciones principales no deben ir en las esquinas superiores (guía de zona del pulgar, Hoober/Smashing, no verificada con estudio primario).
- Botón primario fijo abajo: "Marcar completada y seguir" (una sola acción). Con la decisión AL-04/05, la completación del video es automática: dejar el botón manual solo para lecciones solo-texto.
- Tamaño táctil mínimo de controles 44-48 px (ver 2.7); tipografía de lectura 17-18 px y línea 1.5-1.6 para público 40-59 años; contraste AA (4.5:1).
- Retención (coherente con `Retencion_Evidencia_Inicial.md`): lecciones de 6-9 min; mostrar progreso del curso y "norma social" (por ejemplo "el 62% ya terminó esta semana") en el panel inferior, no como pop-up.
- Un artículo de eLearning sugiere hacer tareas calificadas en escritorio según el tipo; para quiz de opción múltiple no aplica, sí en tareas largas.
- Referencias: [Kashida, UX/UI para eLearning](https://elearningindustry.com/kashidas-ux-ui-insights-pitfalls-and-tips-that-actually-work), [guía edX/MITx: diseñar cursos para móvil](https://mitx-documentation.readthedocs.io/en/latest/reaching_learners/design_for_mobile.html). Cobertura de investigación sobre sticky video y bottom sheet fue limitada; se trata como buena práctica de industria.

### 2.2 Login con enlace mágico / Google en móvil
- Google como botón principal (decisión del creador: solo Google) y para alumno ofrecer Google + email.
- Enlace mágico en móvil tiene un fallo conocido: el enlace abre otro navegador/app (webview de Gmail, Instagram) y **se pierde la sesión**. Las guías recomiendan **código de 6 dígitos (OTP por email) como alternativa o complemento**, que mantiene al usuario en la app, y expiración 5-15 min con token de un solo uso. Algunos escáneres de correo "consumen" el enlace antes que el usuario.
- Recomendación Avantia: para alumno, **código de 6 dígitos + enlace en el mismo correo**, con campo numérico (`inputmode="numeric"`, `autocomplete="one-time-code"`). Para creador, Google. SMS OTP descartado (costo y guías NIST SP 800-63-4 lo desaconsejan como AAL2, según fuente de terceros).
- Mensaje claro de "Revisa tu correo" con botón "Abrir Gmail/Outlook", y reenviar tras 30 s.
- Google One Tap: la búsqueda no devolvió información; verificar en la documentación de Google antes de comprometerlo.
- Aislamiento por tenant: la sesión de alumno es por academia; avisar con el nombre/inicial de la academia en la pantalla de login para que el alumno sepa dónde entra.
- Referencias: [Scalekit, OTP vs magic links](https://www.scalekit.com/blog/otp-vs-magic-links-passwordless-authentication), [Gupta, Magic links vs OTP](https://guptadeepak.com/ciam-compass/guides/magic-links-vs-otp/).

### 2.3 Editor de curso/temario con drag & drop en móvil
- Arrastrar en pantalla táctil choca con el scroll y falla a menudo. WCAG 2.2 criterio 2.5.7 (AA) exige alternativa de un solo toque a cualquier acción de arrastre; el reordenamiento de listas **no** se considera esencial.
- Alternativa estándar: botones **"Subir / Bajar"** visibles por ítem (deshabilitados en extremos), campo "mover a posición N", menú "Mover a módulo…", y anuncio a lector de pantalla ("Lección 3 movida a posición 1 de 5"). El arrastre queda como mejora en escritorio, con asa (drag handle) explícita.
- Recomendación: en móvil, **modo "Reordenar"** con flechas; el editor completo se prioriza en escritorio.
- Referencias: [WCAG 2.5.7 Dragging Movements](https://tabnav.com/academy/wcag/success-criterion-2.5.7), [Smashing Magazine, Accessible List Reordering](https://www.smashingmagazine.com/2018/01/dragon-drop-accessible-list-reordering/), [alternativas accesibles](https://ezud.com/accessible-drag-drop-alternatives/).

### 2.4 Dashboard del creador en móvil
- Navegación inferior de 3-5 destinos de nivel superior (Resumen, Cursos, Alumnos, Mensajes, Más). Lo demás en "Más".
- Tarjetas KPI: solo las 3-4 accionables (alumnos nuevos, progreso medio, compras de la semana, dudas sin responder), con delta vs. período anterior; el resto bajo "Ver más". Tablas anchas se transforman en listas de tarjetas (nombre, estado, último acceso).
- Prioridad a **acciones rápidas**: responder, copiar enlace del curso, compartir por WhatsApp.
- Referencias: [Querio, dashboards móviles](https://querio.ai/articles/how-to-design-dashboards-for-mobile-users), [Smashing, zona del pulgar](https://smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users). No se halló fuente específica para paneles de administración; el criterio KPI es general.

### 2.5 PWA vs app nativa para un LMS
| Aspecto | PWA | Nativa |
|---|---|---|
| Instalación | Android: `beforeinstallprompt` (guardar el evento y disparar desde un botón propio). iOS: sin prompt, solo "Compartir > Añadir a pantalla de inicio"; hay que mostrar instrucciones | Tienda (fricción, revisión, 15-30% de comisión según tienda) |
| Notificaciones push | Android OK. iOS requiere 16.4+, **solo si la PWA está instalada en pantalla de inicio**, permiso pedido tras un gesto del usuario y manifest; algunos reportes de suscripciones que se pierden. Una fuente afirma que no funciona en UE por la DMA (no verificado; irrelevante para LatAm) | Fiable |
| Offline | Service worker: cachear shell y lecciones de texto. El video de YouTube/Vimeo **no** se puede cachear offline; no hay sync en segundo plano en iOS | Descargas posibles pero el video de terceros tampoco |
| Costo/tiempo | Mismo código Next.js, un solo despliegue, multi-tenant por dominio | Dos apps, y white-label por academia sería inviable por tienda |
| Marca por academia | Manifest dinámico por tenant (nombre, ícono con iniciales, color) | Una app por academia: no escala |

Conclusión: **PWA**. El white-label multi-tenant con dominio propio es exactamente el caso donde la nativa no escala. El video embebido de YouTube/Vimeo ya elimina la ventaja offline principal.
Referencias: [MagicBell, PWA iOS limitaciones](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide), [Pushpad, requisitos iOS](https://pushpad.xyz/blog/ios-special-requirements-for-web-push-notifications), [MagicBell, PWA vs nativa](https://www.magicbell.com/blog/pwa-vs-native-app-when-to-build-installable-progressive-web-app), [Joel.net, instalación PWA](https://joel.net/building-a-native-app-install-experience-with-a-pwa). Verificar estado vigente 2026 en notas de Apple (las fuentes son blogs de proveedores).

### 2.6 Video embebido YouTube/Vimeo en móvil
- Usar **fachada (facade)**: miniatura estática + botón play; el iframe se carga al tocar (`lite-youtube-embed`, `lite-vimeo-embed`, patrón recomendado en web.dev). `loading="lazy"` solo retrasa el costo, no lo evita. Un iframe estándar afecta LCP e INP.
- Contenedor `aspect-ratio: 16/9` fijo (evita CLS), ancho 100%, sin márgenes laterales en móvil; `allowfullscreen`; en iOS `playsinline`. Los datos de sizing/`playsinline` no salieron en la búsqueda; son práctica estándar, verificar en prueba real.
- Parámetros YouTube: `rel=0`, `modestbranding=1`; autodetección de fin de video por IFrame Player API / Vimeo Player SDK para la **completación automática** (AL-05). En iOS el autoplay con sonido está bloqueado; se requiere toque.
- Validar el enlace en el editor (CU-03) y mostrar vista previa mínima; aceptar `youtu.be`, `watch?v=`, `vimeo.com/ID` y videos "no listados". Advertir al creador que si el video es privado, el alumno verá error.
- Referencias: [web.dev, lazy load de imágenes e iframes](https://web.dev/learn/performance/lazy-load-images-and-iframe-elements), [OpenReplay, embeber YouTube](https://blog.openreplay.com/embedding-youtube-videos/).

### 2.7 Tamaños táctiles
- WCAG 2.2 criterio 2.5.8 (AA): mínimo 24x24 px CSS o 24 px de separación; 2.5.5 (AAA): 44x44. Apple HIG 44 pt; Material 48 dp.
- **Regla Avantia: 48 px de alto mínimo para botones y filas tocables, 8 px de separación; campos de formulario 16 px de fuente mínimo** (evita el zoom automático de iOS Safari al enfocar), primario a ancho completo en móvil. Público de 40-59: subir cuerpo a 17-18 px.
- Fuentes: [Front-End Checklist: touch targets](https://frontendchecklist.io/rules/accessibility/touch-targets), [guía WCAG 2.5.8](https://allaccessible.org/blog/wcag-258-target-size-minimum-implementation-guide).

### 2.8 Core Web Vitals en 4G LatAm
- Umbrales "buenos" al percentil 75 de datos de campo: **LCP <= 2,5 s, INP <= 200 ms, CLS <= 0,1** (malos: 4 s, 500 ms, 0,25). Lighthouse simula móvil gama media con 4G lenta; en campo, con dispositivos viejos, se puede fallar aunque el laboratorio pase.
- No se encontró dato regional de CrUX para LatAm; **tarea: consultar CrUX por país (AR, CL, MX, CO, PE) tras el piloto**.
- Presupuesto sugerido para páginas del alumno: JS inicial < 170 KB comprimido, 1 fuente web (o fuentes del sistema), imágenes WebP/AVIF con `next/image`, sin librerías de gráficos en el camino del alumno, Server Components por defecto (ya es el caso) y video con fachada.
- Referencias: [Core Web Vitals, umbrales](https://www.mintlify.com/addyosmani/web-quality-skills/concepts/thresholds), [definición de umbrales en web.dev](https://web.dev/articles/defining-core-web-vitals-thresholds).

---

## 3. Cambio de UX móvil por pantalla

Leyenda "Creador en móvil": **Sí** = completo en móvil; **Lectura** = ver/responder/acciones simples; **Escritorio** = se recomienda solo escritorio (en móvil se muestra aviso amable con opción "Enviarme el enlace por correo" para continuar luego); **N/A** = pantalla del alumno.

### 3.1 Landing de Avantia, checkout y pantallas transversales
| Pantalla | Layout móvil | Se prioriza | Se simplifica | Móvil |
|---|---|---|---|---|
| Landing Avantia (marketing) | 1 columna, hero con CTA fijo inferior (ya existe `MobileBar`) | Qué hace, cómo, CTA "Ingresar con Google", testimonios en carrusel de scroll nativo | Quitar maquetas/mock pesados del hero en móvil; 1 CTA primario | Sí (ya parcialmente responsive) |
| Checkout (`/checkout`, alumno) | 1 columna, resumen del curso colapsado arriba, botón de pago fijo abajo con precio | Métodos locales (Mercado Pago, billeteras) y botón "Pagar $X"; autocompletado de nombre/email desde la sesión | Un solo proveedor en MVP; sin cupones ni campos extra; campos numéricos con `inputmode` | N/A (100% móvil) |

### 3.2 Viaje del creador (CR)
| Código | Pantalla | Layout móvil | Prioriza | Simplifica | Móvil |
|---|---|---|---|---|---|
| CR-01 | Crear cuenta (solo Google) | Pantalla única, un botón grande "Continuar con Google" | Botón Google; texto corto de beneficio | Sin formulario; "usuario/pass" (si queda) como enlace secundario | Sí |
| CR-02 | Revisa correo / MFA | Pantalla de espera con campo de código de 6 dígitos y botón "Abrir correo" | Entrada de código con autocompletado | Un paso; reenviar a los 30 s | Sí |
| CR-03 | Nombra academia (subdominio) | Un campo + vista en vivo "nombre.avantia.app", disponibilidad al escribir (debounce) | Resultado claro disponible/no | "Elige otro" simple; alternativas sugeridas fuera de MVP (Etapa 2) | Sí (corto) |
| CR-04 | Identidad visual (iniciales) | Selector de color en grilla de muestras grandes; vista previa de la inicial | Color y contraste sugerido | Sin subir logo/favicon en MVP | Sí |
| CR-05 | Vista previa (landing, login, cursos, contenido) | Pestañas segmentadas sobre un marco de teléfono real a ancho completo | Ver exactamente lo que verá el alumno en su celular | Se elimina el selector de dispositivos; móvil es el valor por defecto; escritorio como opción | Lectura (es ideal para revisar; en móvil se ve "real") |
| CR-06 | Panel / checklist de próximos pasos | Lista vertical de tarjetas con estado, siguiente paso destacado | "Siguiente paso" único como botón primario | Sin explicaciones largas; progreso x/y | Sí |
| CR-07/08/09 | Dominio propio (instrucciones DNS, verificación) | Lista numerada paso a paso, botón "Copiar" en cada registro DNS, botón "Enviar instrucciones por correo" | Copiar registros; estado de verificación automático | Es tarea de registrador (GoDaddy, NIC, etc.), se hace en otra pestaña/app: engorrosa en móvil | **Escritorio** (móvil: solo ver estado y recibir instrucciones). Si dominio propio sale de MVP, queda pospuesto |
| CR-10 | Publicar | Resumen de verificación + botón fijo "Publicar", luego pantalla de éxito con **Compartir por WhatsApp** y copiar enlace | Compartir el enlace | Sin configuraciones extra | Sí |
| CR-11 | Dashboard del creador/admin (prioridad) | Bottom nav (Resumen, Cursos, Alumnos, Mensajes, Más); 3-4 KPI en tarjetas con delta; lista de actividad reciente | Alumnos nuevos, progreso medio, compras, dudas sin responder (presencia del creador mejora satisfacción, según evidencia de retención) | Tablas → lista de tarjetas; filtros en hoja inferior; sin gráficos complejos (una sparkline) | **Sí (lectura y respuesta)**; exportes y analítica profunda en escritorio |

### 3.3 Curso (CU)
| Código | Pantalla | Layout móvil | Prioriza | Simplifica | Móvil |
|---|---|---|---|---|---|
| CU-01 | Datos del curso | Formulario de una columna con secciones colapsables; autoguardado | Título, precio, portada opcional | Descripción larga en pantalla propia; sugerencia IA como botón | Sí para editar; **crear con IA recomendado en escritorio** (texto largo) |
| CU-02 | Editor de temario | Lista de módulos/lecciones como tarjetas; modo "Reordenar" con flechas Subir/Bajar y "Mover a…"; sin arrastre | Agregar lección, reordenar, ver estado | Árbol de máx. 2 niveles (módulo > lección); acciones en menú "⋯" de 48 px | **Escritorio recomendado** (edición pesada). Móvil: ver, renombrar, reordenar con flechas, ocultar |
| CU-03 | Nueva lección: video + texto | Pantalla completa por pasos: 1) pegar enlace de video (validación + miniatura), 2) texto | Pegar enlace con botón "Pegar" del portapapeles | Editor de texto solo con negrita, listas, enlaces (sin tablas/imágenes); sin PDF/archivos (decisión) | **Parcial**: escribir texto largo y armar estructura mejor en escritorio; corregir enlace/título en móvil |
| CU-04 | (no descrito en la revisión; probablemente precio/ajustes) | Formulario simple | Precio y moneda | Un solo proveedor de pago | Sí |
| CU-05 | Acceso al curso (abierto, sin invitación) | Interruptor gratis/pago + precio | Claridad del precio | Sin lista de correos | Sí |
| CU-06 | Vista previa del curso | Idéntica a la vista del alumno en móvil | Probar reproductor y temario | Un botón "Ver como alumno" | Sí (es la experiencia del alumno) |
| CU-07 | Editar curso publicado | Mismo editor; aviso "cambios visibles al guardar" | Corregir erratas y enlaces rápido | Sin versionado en MVP | Sí para correcciones menores; reestructuración en escritorio |

### 3.4 Viaje del alumno (AL), 100% móvil
| Código | Pantalla | Layout móvil | Prioriza | Simplifica | Móvil |
|---|---|---|---|---|---|
| N-01 | Resolución de dominio/academia | Sin UI; si falla, 404 neutro de Avantia con texto grande y enlace al sitio | Velocidad (middleware < 50 ms) | n/a | N/A |
| AL-01 | Catálogo / inicio de academia (revisar) | Cabecera con inicial y nombre, tarjetas de curso apiladas con portada 16:9, precio y botón; 1 curso → ir directo a la ficha | El curso destacado | Sin búsqueda/filtros en MVP | N/A |
| AL-02 | Ficha del curso (venta) | Hero con título y precio, **botón fijo inferior "Inscribirme / Comprar"**, secciones colapsables (qué aprenderás, temario, creador) | Precio, promesa, CTA fijo | Temario en acordeón; descripción corta arriba | N/A |
| AL-03 | Crear cuenta / ingresar | Pantalla corta con nombre de la academia: botón Google + email con código de 6 dígitos | Un toque con Google; volver al curso que traía | Sin contraseña ni perfil | N/A |
| N-03 | Credenciales válidas en esta academia | Mensaje de error amable: "no encontramos tu cuenta en {academia}" con opción de registrarse | Claridad: la cuenta es por academia | Una sola línea de error | N/A |
| AL-04 | Inicio del curso / "mis lecciones" tras inscribirse | Tarjeta "Continuar donde quedaste" arriba, barra de progreso, lista de lecciones | Botón "Continuar" | Sin dashboard de alumno complejo | N/A |
| AL-05 | Reproductor de lección | Video 16:9 sticky arriba (fachada), texto debajo, **botón "Lecciones" abre hoja inferior** con temario y estado, botón fijo "Siguiente" | Video, progreso, siguiente lección | Completar automático al terminar video; sin barra lateral; sin comentarios en MVP | N/A |
| AL-06 | Quiz de término (supuesto) | Una pregunta por pantalla, opciones como botones de 56 px, progreso "2/5", feedback inmediato | Práctica de recuperación con feedback (evidencia de retención) | Solo opción múltiple; reintentos sin penalidad; decisiones pendientes: obligatorio y nota mínima | N/A |
| AL-07 | Curso completado | Pantalla de celebración sobria, certificado/compartir opcional, siguiente curso | Compartir logro por WhatsApp | Sin animaciones pesadas | N/A |
| AL-08 | Volver / mis cursos (supuesto) | Lista de cursos inscritos con progreso | Reanudar | Sin perfil | N/A |

---

## 4. Brechas del código actual (auditoría)

Alcance revisado: `apps/web/src`. Estado general: el panel y las rutas públicas son **placeholders sin estilos responsive**; solo la landing de marketing tiene breakpoints.

| # | Brecha | Evidencia / ruta | Acción |
|---|---|---|---|
| 1 | No hay `viewport` explícito. Next 14 App Router inyecta un viewport por defecto razonable, pero no se exporta `viewport` (themeColor, `viewportFit: "cover"` para `safe-area`, `initialScale`) | `apps/web/src/app/layout.tsx` (solo `metadata.title`) | Exportar `viewport` con `width: device-width`, `viewportFit: "cover"`, `themeColor`; agregar `metadata.manifest`, `appleWebApp` |
| 2 | No hay PWA: sin manifest, sin service worker, sin íconos 192/512 ni apple-touch-icon; `public/` no existe | `apps/web/` (sin carpeta `public`), `next.config.mjs` | Crear `manifest` dinámico por tenant (`app/(public)/[domain]/manifest.webmanifest/route.ts`), íconos con iniciales, SW mínimo |
| 3 | El dashboard usa una barra lateral fija de 220 px y padding 2.5rem: en móvil deja unos 140 px útiles | `apps/web/src/app/(dashboard)/dashboard.module.css` (`.sidebar`, `.content`), `apps/web/src/app/(dashboard)/layout.tsx` | Breakpoint < 768 px: ocultar sidebar, bottom nav de 4-5 ítems, padding 1rem; `min-height: 100dvh` |
| 4 | `min-height: 100vh` se rompe con la barra del navegador móvil | `dashboard.module.css` (`.shell`), `components/marketing/landing.css` (`.av-landing`) | Usar `100dvh` con fallback |
| 5 | Tablas globales sin versión móvil (`table`, `th`, `td`) | `apps/web/src/app/globals.css`; tabla de academias en `apps/web/src/app/(dashboard)/page.tsx` | Contenedor con scroll horizontal o patrón lista-de-tarjetas; componente `ResponsiveTable` |
| 6 | Inputs sin tamaño táctil ni 16 px: `input[type="text"]` con `font-size: .95rem` (15.2 px, **dispara zoom en iOS**), `max-width: 320px`, padding 0.5rem | `apps/web/src/app/globals.css` | Fuente 16 px, alto 48 px, ancho 100%; cubrir `email`, `tel`, `search`, `textarea` |
| 7 | `Button` con padding 0.5rem 1rem y 0.9rem de fuente (unos 36 px de alto) y estilos en línea, sin estados `:active`/focus | `apps/web/src/components/ui/Button.tsx` | `min-height: 48px`, fuente >= 16 px, variante `fullWidth`/`sticky`, foco visible |
| 8 | Enlaces de navegación del dashboard de ~34 px de alto | `dashboard.module.css` (`.navLink`, padding .55rem) | Alto mínimo 48 px |
| 9 | Fuente base 15 px, apropiada para escritorio pero baja para 40-59 años | `globals.css` (`body`) | 16-17 px base en móvil |
| 10 | Layout público de academia sin estilos: header sin CSS, sin contenedor, sin tipografía propia; `<img>` sin dimensiones (riesgo de CLS) | `apps/web/src/app/(public)/[domain]/layout.tsx` | Shell móvil: header compacto con inicial/logo, contenedor `max-width`, `width/height` en logo, `--color-primario` aplicado con contraste |
| 11 | Reproductor es un stub sin video, temario ni progreso | `apps/web/src/app/(public)/[domain]/aprender/[cursoId]/[leccionId]/page.tsx` (el comentario menciona Bunny/Mux, pero la decisión es YouTube/Vimeo) | Componentes `LessonPlayer` (fachada, 16:9), `SyllabusSheet`, `CompleteBar`; actualizar comentario al enlace YouTube/Vimeo |
| 12 | Ficha de curso sin CTA, sin portada, sin temario; precio hardcodeado `es-AR`/`ARS` | `apps/web/src/app/(public)/[domain]/curso/[slug]/page.tsx` | CTA fijo inferior, moneda/locale por tenant |
| 13 | Checkout y landing de academia son stubs de una línea | `.../[domain]/checkout/page.tsx`, `.../[domain]/page.tsx` | Diseñar según tabla 3.1 y AL-01 |
| 14 | Editor de curso inexistente (stubs); no se ha elegido librería de drag&drop | `apps/web/src/app/(dashboard)/cursos/[cursoId]/page.tsx`, `cursos/nuevo/page.tsx` | Reordenar con botones primero; arrastre solo como mejora en escritorio |
| 15 | No hay login ni sesión en ninguna superficie (todo sobre `DEMO_TENANT_SLUG`) | `apps/web/src/lib/supabase/*`, `apps/web/src/middleware.ts` | Pantallas de login: Google (creador), código/enlace (alumno); no hay `/login` aún |
| 16 | Dashboard (`(dashboard)/page.tsx`) es panel interno de Avantia, lista todas las academias; **no es** el CR-11 del creador | `apps/web/src/app/(dashboard)/page.tsx` | Separar panel admin Avantia del dashboard de creador (por tenant) |
| 17 | La landing de marketing es la única con breakpoints (960/640) y `safe-area-inset-bottom`; buen patrón reutilizable (`MobileBar`, botones 48 px). Pero define su propio CSS no compartido con el resto | `apps/web/src/components/marketing/landing.css`, `MobileBar.tsx` | Extraer tokens (tamaños táctiles, safe area) a `globals.css` para reutilizar |
| 18 | Sin modo oscuro ni `color-scheme` fuera de la landing | `globals.css` | Opcional MVP; `color-scheme: light` declarado para evitar mezclas |
| 19 | Sin `prefers-reduced-motion` global ni estilos de foco consistentes | `globals.css` | Añadir foco visible y reducción de movimiento |
| 20 | Sin medición de campo (Web Vitals) ni presupuesto de rendimiento | `apps/web/package.json`, `layout.tsx` | `useReportWebVitals` hacia log/analítica; auditar con Lighthouse móvil en CI |

---

## 5. Recomendación: PWA primero y alcance del MVP

### 5.1 Entra al MVP (P0)
1. `viewport`, `themeColor` y safe areas; shell responsive (dashboard con bottom nav, layout público mobile-first).
2. **Manifest dinámico por tenant** (nombre, iniciales como ícono, color primario, `start_url` al dominio de la academia, `display: standalone`).
3. Service worker mínimo: caché del shell y página offline amable ("Sin conexión; tu progreso se guarda"). Sin caché de video.
4. Instalación guiada: botón propio con `beforeinstallprompt` en Android; en iOS, tarjeta con instrucciones de "Compartir > Añadir a inicio", mostrada tras completar la primera lección (no al entrar).
5. Pantallas del alumno completas AL-01..AL-08 con el reproductor (fachada, completación automática, hoja de temario).
6. Login: Google (creador) y código de 6 dígitos + enlace (alumno).
7. Dashboard CR-11 en móvil (lectura y respuesta) y publicar/compartir por WhatsApp.
8. Reordenar temario con botones (cumple WCAG 2.5.7) y aviso "para editar a fondo usa un computador".
9. Medición Web Vitals de campo y presupuesto de rendimiento.

### 5.2 Fase 2 (no MVP)
- Web push: Android primero; iOS solo con PWA instalada (16.4+), tratarlo como mejora no garantizada y mantener **correo y WhatsApp como canal confiable** para recordatorios (cadencia y nudges de la evidencia de retención).
- Caché offline de lecciones de texto; arrastre en escritorio; subida de logo; dominio propio móvil; chat/mensajes creador-alumno avanzado.
- App nativa: solo si hay demanda comprobada de tiendas o necesidad de descargas offline de video propio.

### 5.3 Criterios de aceptación sugeridos
- LCP <= 2,5 s e INP <= 200 ms p75 en Moto G Power / 4G lenta (lab) en AL-02 y AL-05; CLS <= 0,1.
- Todo control tocable >= 48x48 px; ningún campo con fuente < 16 px; sin scroll horizontal a 360 px.
- Flujo completo del alumno (registro con código, pago, primera lección) probado en Android Chrome e iPhone Safari reales, incluyendo apertura del enlace desde la app de Gmail.

---

## 6. Por qué esta división creador móvil / escritorio
- **Alumno 100% móvil**: es quien compra y consume, y el dato de mercado (78% móvil) lo exige.
- **Creador lectura/respuesta en móvil**: la evidencia de retención indica que la **presencia del creador** (responder, video corto personal) mejora satisfacción, y eso ocurre en momentos libres; el móvil lo facilita. Ver métricas y compartir por WhatsApp también es natural en el celular.
- **Edición pesada en escritorio**: temarios, texto largo, IA de generación, DNS/dominio y revisión multi-vista requieren teclado, pantalla amplia y varias ventanas; el arrastre táctil es poco fiable y WCAG exige alternativas. Se permite en móvil lo ligero (renombrar, reordenar con flechas, corregir enlaces) para no bloquear al creador.
- Hipótesis a validar con los design partners: creadores de 40-59 años pueden preferir hacerlo todo desde el teléfono. Si 2 de 5 piden crear lecciones desde el móvil, subir CU-03 a "Sí".

---

## 7. Riesgos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Enlace mágico abre otro navegador/webview y pierde la sesión | Alumnos no pueden entrar | Código de 6 dígitos como vía principal; enlace como complemento |
| Push en iOS limitado (requiere instalar, permisos tras gesto, suscripciones que se pierden) | Menos recordatorios de cadencia | Correo/WhatsApp como canal base; push como extra |
| Instalación PWA en iOS no es evidente para 40-59 años | Baja instalación | Instrucciones con capturas, mostrar tras valor demostrado; no depender de la instalación |
| Video de YouTube/Vimeo: autoplay bloqueado, anuncios, videos privados/eliminados, sin offline | Pérdida de progreso o error | Fachada con toque, validación del enlace, mensaje de error, recomendar "no listado" |
| Completar automáticamente por fin de video falla si el alumno salta al final | Progreso falso | Umbral (por ejemplo 90% reproducido) y respaldo manual de "marcar completada" |
| Rendimiento en gama baja/4G: aumento de JS por reproductor, quiz, PWA | LCP/INP fuera de umbral | Presupuesto, Server Components, fachada, medir en campo |
| Cuenta por tenant en PWA instalada: sesiones separadas por dominio, confusión si un alumno tiene varias academias | Soporte | Manifest por tenant; nombre de la academia visible en login |
| Creador sin acceso a escritorio | Abandono del onboarding | Opción "enviarme el enlace por correo"; evaluar con design partners |
| Datos de mercado (78%, 40-59 años) sin fuente verificada en este documento | Decisiones sobre supuestos | Citar fuente Hotmart y medir con analítica propia |
| Fuentes de investigación web son blogs de terceros | Posibles imprecisiones (especialmente iOS push, EU) | Verificar en Apple/Google/W3C antes de comprometer alcance |
| Código tiene dos paneles mezclados (admin Avantia y creador) | Retrabajo al construir CR-11 | Separar rutas/roles antes de diseñar responsive |
