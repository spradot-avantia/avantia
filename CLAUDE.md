# CLAUDE.md — Avantia

Plataforma LMS white-label multi-tenant en español para expertos y creadores de LatAm: cada academia vende y dicta cursos bajo su propio dominio. Equipo pequeño (producto, CEO, CPO, un developer y un aprendiz), foco en llegar a un MVP rápido sin romper el aislamiento entre tenants.

Idioma: documentación, commits y UI en **español** (es-CL por defecto). Código e identificadores técnicos pueden ir en inglés, pero el dominio mantiene los nombres del esquema (`tenants`, `cursos`, `membresias`, `inscripciones`).

## Mapa del repo

- `apps/web` — Next.js (App Router) + TypeScript: panel `(dashboard)`, sitio público `(public)/[domain]`, landing `(marketing)` y API (`app/api`).
- `db/` — `schema.sql` (tablas + RLS) y `migrations/` versionadas.
- `docs/arquitectura` — arquitectura y `Supuestos_y_Pendientes.md`.
- `docs/decisiones` — ADRs. `docs/producto` — flujos, requerimientos, investigación. `docs/design` — sistema de diseño. `docs/sprints` (backlog y planes), `docs/skills`.
- `html/` y `docs/legacy` — mockups antiguos; no son fuente de verdad.

## Cómo trabajar con decisiones (ADRs)

1. **Antes de proponer un cambio estructural**, lee `docs/decisiones/*` y `docs/arquitectura/Supuestos_y_Pendientes.md`. Las decisiones "Asegurado" no se reabren sin un motivo nuevo (la 001 se revirtió con la 002 tras medir su costo real).
2. **Toda decisión de arquitectura, sistema, datos, proveedor o diseño transversal se registra como ADR** en `docs/decisiones/NNN-slug.md` (siguiente número libre), en el mismo PR que el cambio. Formato: `Fecha`, `Estado` (Propuesta / Aceptada / Reemplazada por NNN), `Contexto`, `Decisión`, `Alternativas descartadas`, `Consecuencias`. Una decisión por archivo, corto.
3. Un ADR no se edita para cambiar de opinión: se crea uno nuevo que lo reemplaza y se actualiza el estado del anterior.
4. Si una decisión resuelve un pendiente de `Supuestos_y_Pendientes.md`, escribe primero el ADR y luego borra el pendiente de esa tabla.
5. No decidas en silencio: si la tarea implica elegir entre alternativas con costo (proveedor, modelo de datos, auth, pagos), presenta la recomendación y deja el ADR en estado `Propuesta` hasta que Samuel lo apruebe.
6. Las decisiones de **producto** (alcance MVP, flujos CR/CU/AL) viven en `docs/producto/`; los cambios de alcance se anotan allí con fecha y motivo.

## Reglas de arquitectura que no se negocian

- **Aislamiento por tenant:** toda tabla de negocio nueva lleva `tenant_id`, RLS habilitada con política por tenant e índice compuesto que empiece por `tenant_id`. Además, cada query de aplicación filtra explícitamente por `tenant_id`. Sin esto, el PR no se mergea.
- `middleware.ts` corre en el edge: solo resuelve host → panel o sitio público de tenant. **Nunca** consulta la base de datos ahí.
- Dos clientes de Supabase: `lib/supabase/server.ts` (sesión + RLS) y `admin.ts` (service role). `admin.ts` solo en backend, jamás importado desde código de cliente ni usado para saltarse RLS por comodidad.
- Un único endpoint para llamadas al LLM (`app/api/ai/generar-curso`); no hay otras llamadas directas a proveedores de IA.
- Un solo proyecto Next.js (ADR 002). No se vuelve a separar front y API.
- El `tenant_id` se deriva de la sesión/host, **nunca** del body de la request (`generar-curso` ya lo cumple).
- Cuentas de alumno y credenciales **por tenant**; el mismo correo puede existir en academias distintas.
- Pagos: Mercado Pago como pasarela local del MVP (Stripe fue retirado del código). Webhooks verifican firma e idempotencia.
- Secretos solo en variables de entorno (Vercel); nunca en el repo.

## Decisiones de producto vigentes (revisión de flujos 2026-10-12)

Ver `docs/Revision_Flujos_Creador_Alumno_2026-10-12.md`. Resumen: postulación pública sin cuenta y registro del creador solo por invitación, con correo y contraseña o Google (ADR 014, Propuesta; + validación de correo/MFA); lecciones solo video (enlace) + texto; sin acceso por invitación; quiz de término; dashboard del creador (CR-11); identidad visual genérica con iniciales; **mobile-first** (alumno 100% móvil; creador: edición pesada en escritorio). La retención es el diferenciador: cadencia/cohortes, práctica de recuperación, presencia del creador, nudges con normas sociales, lecciones cortas, analítica y A/B por tenant. Gamificación pesada e IA adaptativa quedan fuera del MVP.

## Backlog y sprints

- El backlog vive en `docs/sprints/BACKLOG.md`; los planes por día/sprint, en `docs/sprints/AAAA-MM-DD_*.md`.
- Al empezar una sesión de trabajo, lee el backlog. Al cerrar un ítem (o descubrir uno nuevo, un bloqueo o una decisión abierta), actualiza `BACKLOG.md` en el mismo cambio: mueve el ítem a "Hecho" con la fecha y ajusta "Última actualización".
- Un pendiente que es una decisión de arquitectura sigue la regla de ADRs (sección anterior) y se refleja también en `Supuestos_y_Pendientes.md`.

## Diseño y UI

- La landing "programa fundador" es la **base de diseño de la marca**. Tokens en `apps/web/src/styles/avantia-tokens.css`, guía en `docs/design/Sistema_Diseno_Avantia.md`. Usa los tokens; no hardcodees colores ni tipografías nuevas.
- Mobile-first: se diseña y verifica primero a 360–390 px. Targets táctiles ≥ 44 px, contraste AA, foco visible, `prefers-reduced-motion`.
- Server Components por defecto; `'use client'` solo donde haya interactividad.
- Sitios de tenant: el theming (color, iniciales/logo) viene del tenant; nunca mostrar marca Avantia dentro de una academia salvo el 404 neutro.

## Flujo de trabajo

- Ramas cortas + PR; Vercel genera preview por PR y `main` despliega a producción. El workflow `pr-review.yml` revisa cada PR (incluye la regla de RLS).
- Commits en español, imperativo, un cambio lógico por commit. No commitear ni pushear sin que Samuel lo pida.
- El árbol puede tener cambios sin commit de otras personas: **no los reviertas ni los incluyas** en tus commits; stagea archivos por nombre.
- Antes de dar algo por hecho: `npm run lint` y `npm run build`; para UI, revisar en móvil y escritorio. Si no se pudo verificar algo, dilo.
- Cambios de esquema: migración nueva en `db/migrations/` (no editar migraciones aplicadas) y actualizar `schema.sql`.
- Documentación viva: si cambias arquitectura o modelo de datos, actualiza `docs/arquitectura` en el mismo PR.

## Investigación y evidencia

- Las cifras de mercado y retención en `docs/producto/` distinguen **verificado** de **hipótesis**. No cites una cifra como hecho sin su fuente primaria; marca lo no verificado.
- Las entrevistas con creadores se organizan según se consigan; sus resultados se sintetizan en `docs/producto/` con citas etiquetadas (dolor, solución actual, gasto real, disparador de cambio). Valen más las conductas pasadas que las opiniones.
- Retención: separar siempre retención de conocimiento de retención del alumno (que no abandone).
