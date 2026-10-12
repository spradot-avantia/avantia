# Sistema de diseño Avantia

Fuente: mockup de landing "programa fundador" (Main.dc.html). Implementación: `apps/web/src/styles/avantia-tokens.css` (importado desde `globals.css`) y `apps/web/src/components/marketing/landing.css`.

## Uso

- Tokens: variables CSS `--av-*` en `:root`. Fuente Inter vía `next/font` (`--font-inter`, expuesta en `layout.tsx`) -> `--av-font-sans`.
- Clase `.av-scope` en el contenedor aplica fondo, tipografía, resets, enlaces y foco de marca. Los componentes base (`.av-btn`, `.av-badge`, `.av-input`, `.av-card`, `.av-overline`, `.av-h2`, `.av-lede`, `.av-legal`, `.av-todo`, `.av-link`, `.av-sr-only`) funcionan dentro o fuera del scope.
- Los `--color-*` de `globals.css` son legado del dashboard; no se tocaron.

## Tokens

**Color**: tinta `--av-ink #0A1029`, `--av-ink-2 #232C55`, texto secundario `--av-muted #5A648C` (5.6:1 sobre fondo), `--av-subtle #8B93AD` (solo placeholders/iconos), líneas `--av-line #E6E4DC` / `--av-line-strong #D5D8E2` / `--av-line-dashed #B9BECF`, fondos `--av-bg #FAF9F6`, `--av-bg-sunken #F1EFE9`, `--av-surface #FFF`, `--av-surface-2 #EFF0F5`. Azul: 50 `#E4EDFD`, 200 `#A9C2F9`, 400 `#4C7DF0` (foco), 600 `#2563EB` (primario), 700 `#1D4ED8` (hover/enlaces). Violeta: 50 `#EDE9FE`, 200 `#CDB9FC`, 500 `#8B5CF6`, 700 `#6D3EE0` (pendiente/verificar). Éxito `#137A5A` sobre `#E2F4EE`. Gradiente de marca azul 600 -> violeta 500. Colores de academia de ejemplo: `--av-brand-*` (ámbar, teal, petróleo, ciruela, grafito).

**Tipografía** (Inter 300-700): h1 `clamp(42px,10.5vw,68px)`/72px desktop, peso 600, tracking -0.03em, interlineado 1.05; h2 `clamp(28px,6vw,42px)`, -0.02em, 1.12; h3 26px; lede 18px; cuerpo 16px/1.65; small 14px; overline 12px, 500, uppercase, 0.18em.

**Radios**: 8 (sm), 12 (botones/inputs), 20 (tarjetas), 32 (escenarios/sheet), 999 (pills).

**Sombras**: xs `0 1px 2px .06`; sm `0 4px 16px .07`; md `0 16px 42px .10`; lg `0 32px 78px .14` (todas rgba(10,16,41)); primaria hover `0 10px 30px rgba(37,99,235,.22)`; anillo de foco `0 0 0 3px rgba(76,125,240,.35)`.

**Espaciado**: 2 / 6 / 10 / 16 / 26 / 42 / 68 / 110 (`--av-space-1..8`); contenedor 1188px; gutter 20px (42px desde 900px); área táctil mínima 44px (`--av-target`).

**Movimiento**: `--av-ease`, `--av-ease-out`; todo respeta `prefers-reduced-motion`.

## Componentes base

- **Botón**: `.av-btn` + `--primary` (azul 600, hover 700 + sombra), `--secondary` (borde azul 200, hover azul 50), tamaños `--lg` (56px, 18px) y `--sm` (44px, 14px). Deshabilitado: opacidad .6.
- **Badge**: `.av-badge` + `--ok`, `--neutral`, `--explore`, `--verify` (violeta, borde punteado).
- **Input**: `.av-input` (56px, radio 12, borde `--av-line-strong`, foco azul 600 + anillo).
- **Card**: `.av-card` (borde línea, radio 20, sombra sm) y `--dashed` (placeholders).
- **Contenido pendiente**: `.av-todo` (violeta 700, subrayado punteado). Todo dato sin definir debe usarlo; no se inventan cifras ni personas.
- **Foco**: outline 2px `--av-blue-400`, offset 2px.

## Decisiones de la landing

- Cobertura de la revisión de flujos: ¿Qué hace? (`#que-hace`), ¿Cómo funciona? (`#como-funciona`), CTA (hero, programa fundador, cierre, barra móvil), testimonios (`#testimonios`, solo placeholders), signup/signin.
- **Signup/Signin**: solo Google para creadores. El CTA principal abre el sheet de postulación (formulario del programa fundador; hoy no persiste datos) con "Continuar con Google" que enlaza a `/registro`. `/registro` es una página placeholder con el botón de Google deshabilitado hasta conectar Supabase Auth. "Ingresar" en el header apunta a `/registro#ingresar`.
- Se cambió "PDF" por "Texto" en el módulo de ejemplo (decisión MVP: lecciones solo video + texto).

## Mapeo propuesto para dashboard y app del alumno (no aplicado)

| Legado (`globals.css` / `dashboard.module.css`) | Token Avantia |
|---|---|
| `--color-bg #f4f5f7` | `--av-bg` |
| `--color-surface` | `--av-surface` |
| `--color-border` | `--av-line` |
| `--color-text` / `--color-text-muted` | `--av-ink` / `--av-muted` |
| `--color-primary #4f46e5` / hover | `--av-blue-600` / `--av-blue-700` |
| `--color-sidebar-bg #171923` | `--av-ink` (sidebar oscuro) |
| `--radius 8px` | `--av-radius-sm` (controles) / `--av-radius-lg` (tarjetas) |
| `--shadow-sm` | `--av-shadow-xs` |
| Botones/inputs de módulo CSS | `.av-btn`, `.av-input` |
| Estados (publicado, borrador) | `.av-badge--ok`, `--neutral`, `--verify` |

Pasos sugeridos: (1) envolver `(dashboard)/layout.tsx` en `.av-scope`; (2) reemplazar variables legado por alias a `--av-*` en `globals.css`; (3) migrar botones, badges e inputs de `dashboard.module.css` a las clases `.av-*`; (4) la app del alumno (`(public)/[domain]`) usa `--brand` por tenant (color de academia con iniciales, como en el mockup) sobre los mismos neutros; verificar contraste de texto blanco sobre el color elegido por el creador.
