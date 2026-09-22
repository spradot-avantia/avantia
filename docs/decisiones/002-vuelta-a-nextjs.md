# 002 — Vuelta a Next.js

- **Fecha:** 2026-09-15
- **Estado:** Aceptada

## Contexto

La [ADR 001](001-migracion-nextjs-a-node-react.md) migró el proyecto de
Next.js a Node.js + Express + React (Vite). Esa migración tuvo costos
explícitos, documentados en sus "Consecuencias": se perdió el SSR de las
páginas públicas de venta de cursos (impacto de SEO), se perdió el
middleware de edge para resolver el tenant por hostname (reemplazado por
lógica duplicada en backend y frontend), y el despliegue pasó de una pieza
a dos.

Al revisar ese trade-off contra el caso de uso real del proyecto —un sitio
público de venta de cursos por academia, indexable, con checkout— esos
costos pesan más que la simplicidad conceptual que se buscaba ganar.

## Decisión

Volver a **Next.js (App Router)** como stack único: panel interno, sitio
público de cada academia y API (route handlers) viven en un solo proyecto,
`apps/web`.

- `src/middleware.ts`: reemplaza a `apps/api/src/middleware/resolveTenant.ts`.
  Corre en el edge y decide, según el hostname, si la request va al panel
  (`app/(dashboard)`) o se reescribe hacia el sitio público de un tenant
  (`app/(public)/[domain]`). No consulta la base de datos ahí (sería costoso
  en cada request de edge).
- `app/(public)/[domain]/layout.tsx`: Server Component que resuelve el
  tenant contra Supabase (`lib/tenant/resolve.ts`, con cache en memoria de
  60s, igual que en la versión Express) y llama a `notFound()` si no existe.
  El HTML sale con el tenant ya resuelto — sin el delay de loading que tenía
  la versión SPA.
- `app/api/*`: route handlers para webhooks de Stripe/Mercado Pago, el
  endpoint de generación de curso con IA, y el alta/resolución de tenants —
  equivalentes uno a uno a los routers de Express que reemplazan.
- Se elimina `apps/api`: no hace falta un servicio Node.js separado.

## Alternativas descartadas

- **Mantener Node.js + Express + React (Vite)**: se descarta porque el costo
  de SEO en las páginas públicas de venta (identificado como riesgo en la
  ADR 001) se considera ahora crítico para el negocio, y no vale la pena
  mantener la resolución de tenant duplicada en dos lugares (backend y
  frontend) cuando Next.js la resuelve en un solo middleware.

## Consecuencias

- **Se recupera el SSR** de las páginas públicas (`app/(public)/[domain]`):
  el contenido está en el HTML inicial, mejor para SEO.
- **Se recupera un único middleware de edge** para la resolución de tenant
  por hostname, sin duplicar esa lógica en cliente y servidor.
- **Despliegue en una sola pieza**: un proyecto de Next.js con funciones
  serverless/edge integradas, en vez de sitio estático + servicio Node
  persistente.
- **Se reintroducen las convenciones específicas de Next.js** (route groups,
  Server/Client Components, route handlers, middleware de edge) que la ADR
  001 había señalado como el costo de conceptual complexity a cambio de
  simplicidad. Se acepta ese costo a cambio del SEO y de un único punto de
  resolución de tenant.
- El gap de resolución de tenant por sesión para el panel interno (marcado
  como TODO en `app/api/ai/generar-curso/route.ts`) sigue pendiente — no es
  un problema nuevo introducido por este cambio, ya existía en la versión
  Express.
