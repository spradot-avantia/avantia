# Auditoría de interfaz — 2026-11-06

Alcance: landing, auth, portal creador, portal admin, sitio público del tenant, cuenta y aprendizaje del alumno, estados transversales (54 pantallas).
Referencia visual: `avantia-tokens.css` + `docs/design/Sistema_Diseno_Avantia.md` (no hay PRODUCT.md ni DESIGN.md).

## Qué se verificó y qué no

| Verificado | No verificado |
|---|---|
| `npm run lint`: sin errores | Pantallas con sesión (creador, admin, alumno, checkout): no hay credenciales de prueba en esta sesión; solo revisión de código |
| Detector de Impeccable sobre `src` completo | Revisión visual con capturas |
| Detector renderizado (390 y 1280 px) en 9 rutas públicas, local | Contraste con paletas de tenant reales |
| Producción `www.goavantia.com` (landing): mismos hallazgos que local | `npm run build` y pruebas e2e: no se corrieron |
| Búsquedas estáticas: hex, foco, targets, error/loading | Teclado y lector de pantalla |

Producción y local coinciden en la landing. `app.avantia.app` devolvió 0 hallazgos en sus rutas, pero ahí el detector puede no haber alcanzado la página real (posible redirección); no lo tomo como "limpio".

## Puntaje (parcial, solo lo medido)

| Dimensión | Puntaje | Hallazgo clave |
|---|---|---|
| Accesibilidad | 2 | Sin `error.tsx`/`not-found.tsx`; contraste en 3 puntos |
| Rendimiento | sin medir | Falta Lighthouse / build; 56 archivos `'use client'` por revisar |
| Theming | 3 | 106 líneas con hex fuera de tokens |
| Responsive | 3 | Botones de 28–40 px en `academia.css`; sin overflow detectado en público |
| Integridad | 3 | Detector casi limpio; patrones de plantilla en landing |

## Hallazgos

### P1
1. **No existe ningún `error.tsx`, `loading.tsx`, `not-found.tsx` ni `global-error.tsx`** en toda la app. Un fallo de Supabase muestra la pantalla de error por defecto de Next, y un 404 de tenant no es el "404 neutro" que pide CLAUDE.md. Los estados de carga tampoco existen. Ruta: `harden`.
2. **Contraste de placeholders en `/postular` y `/registro`:** `#8b93ad` sobre blanco, 3.1:1 (mínimo 4.5:1). Son las pantallas de captación. WCAG 1.4.3. Ruta: `colorize`.
3. **Texto sobre `#c2410c` en la landing:** 4.48:1 (necesita 4.5:1), en `.lp-ac-cover small`. Falla por 0.02. Ruta: `colorize`.

### P2
4. **Targets táctiles bajo 44 px** (CLAUDE.md los exige): `.ac-btn--sm` 36 px, `.ac-btn--muestra` 40, `.ac-btn--muestra-sm` 32, `.ac-chip-color` 28 (`academia.css`), `.lp-step .k` 32 (decorativo, ignorar). Ruta: `adapt`.
5. **Hex fuera de tokens:** 106 líneas, concentradas en `lib/creador` (6 archivos), `components/marketing` (6) y `components/creador/marca` (5). Parte puede ser legítima (colores del tenant elegidos por el creador); hay que separarla de la que no. Ruta: `colorize` / `extract`.
6. **Outline eliminado:** 14 usos de `outline: none`. Los revisados tienen reemplazo (`:focus-visible` o `--av-ring`), así que no son bug; falta confirmar los de `pagina.css:138,245` y `editor.css:538,553,762`. Ruta: `audit`.
7. **Patrón "kicker sobre título"** en la landing (2 veces) y chip "Legal" en privacidad y términos. Es el patrón más repetido del detector. Ruta: `distill`.
8. **Tarjeta dentro de tarjeta** en la landing (`.lp-phone`, 3 veces) y en `restablecer-contrasena`. Ruta: `layout`.
9. **Páginas legales:** en desktop, 10 líneas de texto pasan del ancho legible (términos). Ruta: `typeset`.

### P3
10. Líneas huérfanas (`straggler`) en 6 de 9 páginas: una palabra sola en la última línea. Ruta: `typeset`.
11. Borde izquierdo de 3 px en `ficha-curso.css:246` (detector `side-tab`). Ruta: `polish`.
12. Una fuente marcada como sobreutilizada por el detector (1 caso). Ruta: `typeset`.
13. Revisar los 9 `<img>`: 5 con `alt=""` decorativo (correcto en logos junto al nombre), 4 con texto. Sin acción salvo `next/image` si importa el rendimiento.

## Positivo

- Lint limpio, y el código de alumno y creador usa tokens (`--av-ring`, `--av-blue-400`) de forma consistente.
- Los `outline: none` revisados siempre tienen un reemplazo visible.
- Solo 1 `div` con `onClick` en toda la base; 14 archivos respetan `prefers-reduced-motion`.
- El sitio de alumno cumple la regla de marca: solo menciona Avantia en los textos legales, donde es obligatorio.
- Login, signup y olvidé-contraseña salen casi limpios en ambos tamaños.
- El layout del admin exige sesión y redirige a login.

## Pendiente para completar la auditoría

1. Credenciales de prueba (creador, admin, alumno) para recorrer y capturar las ~35 pantallas con sesión.
2. Correr `npm run build` y Lighthouse móvil sobre landing, lección y editor.
3. Probar 3 paletas de tenant (incluida una clara) contra AA.
4. Revisar con teclado la lección, el quiz y el editor.

## Orden de corrección sugerido

`harden` (P1-1) → `colorize` (P1-2, P1-3, P2-5) → `adapt` (P2-4) → `layout` / `distill` / `typeset` (P2-7 a P3) → `polish`.

---

## Segunda pasada (2026-11-07): pantallas con sesión y correcciones

Se sembró una academia de prueba con creador, admin y alumno (prefijo `aud…`, correos `@example.test`), se recorrieron **39 pantallas × 2 tamaños (390 y 1280 px)** con Playwright + axe-core (WCAG 2.2 AA), y el seed se borró de la base al terminar (verificado: 0 filas residuales).

**Resultado:** sin scroll horizontal en ninguna pantalla; 0 violaciones graves de axe. Hallazgos y estado:

| Hallazgo | Estado |
|---|---|
| Sin `error`/`not-found`/`loading` (P1) | Corregido: `app/error.tsx`, `global-error.tsx`, `not-found.tsx` neutros; esqueletos de carga solo en panel, admin y aprendizaje (en la raíz hacían que los 404 respondieran 200) |
| Placeholders 3.1:1 y texto de landing 4.48:1 (P1) | Corregido (`--av-muted`; opacidad de la etiqueta de portada) |
| Botón `.ac-btn--sm` de 36 px | Corregido a 44 px |
| Ficha pública del curso sin `h1` | Corregido (h1 en el sitio; h2 en la vista previa del panel) |
| Barra de progreso del onboarding sin nombre | Corregido (`aria-label`) |
| Enlaces en texto distinguidos solo por color (admin y mensajes del alumno) | Corregido (subrayado) |
| Input de correo en Admin > Equipo de 24 px | Corregido a 44 px |
| Barra superior del admin partía "Mi panel" / "Cerrar sesión" en móvil; texto pegado a las tarjetas | Corregido |
| `/mi-academia/pagina` sin `h1` cuando aún no hay template (estado vacío) | Corregido (P3): `EmptyState` acepta `titulo1` |
| `/mi-academia/templates/*` con 2 `h1` (la vista previa del template trae el suyo) | Corregido (P3): en la vista previa los templates usan h2 |
| Estado vacío: texto centrado y botones alineados a la izquierda | Corregido (P3): acciones centradas |
| "Configurar academia" aparece dos veces en el inicio del creador (tarjeta y paso 1) | Corregido (P3): el paso 1 muestra «Siguiente» en vez de repetir el botón |

**Sin verificar todavía:** `npm run build`, Lighthouse, uso con teclado/lector de pantalla, paletas de tenant reales, ni la lección con video. Nada de esto se desplegó: los cambios están solo en el árbol local.

**Tercera pasada (2026-11-07):** P3 cerrados, más `text-wrap` global (títulos balanceados, sin palabras huérfanas). Re-recorrido de las 78 pasadas: 0 hallazgos de axe, 0 pantallas sin `h1` (salvo las que redirigen) y 0 desbordes. El borde del `blockquote` en `ficha-curso.css` es la convención de cita, no un acento decorativo: se deja. Seed borrado de nuevo (0 residuos).

## Cuarta pasada (2026-11-07): build, Lighthouse, teclado, paletas y video

- **`npm run build`:** pasa. `tsc`, `lint` y 236 pruebas unitarias pasan.
- **Lighthouse** (build de producción, una corrida por página): rendimiento 97-100 en escritorio y 97-98 en móvil; accesibilidad 94-100; SEO 100 salvo el `noindex` intencional de login, términos y privacidad. `/registro` midió otra página por `NEXT_PUBLIC_PANEL_URL=localhost:3000` del `.env.local` (no es un bug de producción). Sin resolver: `/landing` pide 2 recursos que responden 400 (error en consola).
- **Teclado y lector de pantalla** (Pixel 5 en Chromium, iPhone 13 en WebKit; ni NVDA, VoiceOver ni TalkBack reales): orden de tabulación lógico, nombres accesibles completos, landmarks, un solo `h1`, acordeón del syllabus correcto. Corregido: aro de foco, quiz con Enter y foco al resultado, aviso de XP anunciable, `main` enfocable por el enlace «saltar», nombre repetido «Módulo 1 · Módulo 1», enlaces del pie de 17 px a 44 px.
- **Paletas de tenants (prioridad):** con 8 colores extremos (amarillo, celeste, rosa, naranja, verde, gris, violeta, marino), 7 fallaban: el color de la academia se usaba como texto sobre fondo claro (contraste de 1.4 a 3.3:1) en 54 de 104 pantallas. Corregido con `colorTexto()` (variante del color apta para texto, mismo tono) para enlaces, pestañas, migas e íconos; los rellenos conservan el color original. Re-medición: 0 fallos en 104 pantallas. El aro de foco pasó a un doble aro fijo (tinta y halo blanco); antes usaba el color de la academia y tenía 1.4 a 2.7:1 en 5 de 8.
- **Lección con video:** iframe 16:9, con `title`, `loading="lazy"` y `youtube-nocookie`; sin desborde a 393 px.
- **Pendiente:** sin NVDA/VoiceOver/TalkBack ni teclado virtual real; WebKit en Windows no recorre enlaces con Tab (es el comportamiento de Safari sin Full Keyboard Access, no un bug); salto H1 a H3 en el contenido de una lección de texto de ejemplo; error 400 en `/landing`; los mensajes de error de los formularios de ingreso no se probaron. Seed de paletas borrado (0 residuos verificados).

**Corrección (2026-11-07):** el esqueleto de carga que se agregó en `aprender/loading.tsx` se quitó. Al envolver las páginas en un límite de carga, el `redirect()` de la guardia de sesión salía por streaming: respondía 200 con la página en blanco y recién después redirigía en el cliente, en vez de un 307. Lo detectó el QA de `dev` (B-37). Los esqueletos de `(dashboard)` y `(admin)` se mantienen.
